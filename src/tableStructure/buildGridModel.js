define([
	'fontoxml-selectors/evaluateXPathToBoolean',
	'fontoxml-selectors/evaluateXPathToFirstNode',
	'fontoxml-selectors/evaluateXPathToNodes',
	'fontoxml-selectors/evaluateXPathToNumber',
	'fontoxml-selectors/evaluateXPathToString',
	'fontoxml-table-flow',
	'fontoxml-table-flow/validateGridModel'
], function (
	evaluateXPathToBoolean,
	evaluateXPathToFirstNode,
	evaluateXPathToNodes,
	evaluateXPathToNumber,
	evaluateXPathToString,
	tableFlow,
	validateGridModel
) {
	'use strict';

	var TableGridBuilder = tableFlow.TableGridBuilder,
		computeWidths = tableFlow.utils.computeWidths,
		ColumnSpecification = tableFlow.ColumnSpecification,
		normalizeGridModel = tableFlow.mutations.normalizeGridModel;

	function parseDefaultColumnInfo (tableStructure, tableElement, blueprint) {
		var firstRowElement = evaluateXPathToFirstNode('.//' + tableStructure.selectorParts.tr, tableElement, blueprint),
			columnCount = evaluateXPathToNodes(
					'./*[self::' + tableStructure.selectorParts.td +
					' or self::' + tableStructure.selectorParts.th + ']', firstRowElement, blueprint)
				.reduce(function (colCount, cellElement) {
					return colCount + 1 + evaluateXPathToNumber('let $colspan := ./@colspan return if ($colspan) then number($colspan) else 0', cellElement, blueprint);
				}, 0),
			columnSpecifications = [],
			oldColnamesToNewColnames = [];

		for (var index = 0; index < columnCount; ++index) {
			var columnSpecification = new ColumnSpecification(
					'left',
					'column' + index,
					index,
					true,
					'1*',
					true,
					'*',
					true,
					'column' + index
				);

			columnSpecifications.push(columnSpecification);
			oldColnamesToNewColnames['column' + index] = 'column' + index;
		}

		return {
			oldColnamesToNewColnames: oldColnamesToNewColnames,
			columnSpecifications: columnSpecifications
		};
	}

	function parseTableCellElement (cellElement, blueprint) {
		var align = evaluateXPathToString('./@align', cellElement, blueprint),
			valign = evaluateXPathToString('./@valign', cellElement, blueprint),
			data = Object.assign(
				{},
				align ? { horizontalAlignment: align } : null,
				valign ? { verticalAlignment: valign } : null
			);

		var rowSpan = evaluateXPathToNumber('let $rowSpan := ./@rowspan return if ($rowSpan) then $rowSpan => number() else 1', cellElement, blueprint),
			colSpan = evaluateXPathToNumber('let $colSpan := ./@colspan return if ($colSpan) then $colSpan => number() else 1', cellElement, blueprint);

		return {
			data: data,
			rowSpan: rowSpan,
			colSpan: colSpan
		};
	}

	/**
	 * Build a generic gridModel from the XHTML table
	 *
	 * @param   {XhtmlTableStructure}  tableStructure  The XhtmlTableStructure to used to build the gridModel with
	 * @param   {Node}                 tableElement    The root of the table
	 * @param   {Blueprint}            blueprint       The blueprint in which to consider the table
	 *
	 * @return  {GridModel}  The build gridModel
	 */
	return function buildGridModel (tableStructure, tableElement, blueprint) {
		// Alias table parts
		var thead = tableStructure.selectorParts.thead;
		var tbody = tableStructure.selectorParts.tbody;
		var tfoot = tableStructure.selectorParts.tfoot;
		var tr = tableStructure.selectorParts.tr;
		var th = tableStructure.selectorParts.th;
		var td = tableStructure.selectorParts.td;

		// Table in this case is the <table> element.
		var table = tableElement,
			builder = new TableGridBuilder(tableStructure);

		builder.model.borders = evaluateXPathToBoolean('./@border = "1"', table, blueprint);

		var rowNodes = evaluateXPathToNodes(
				'./' + tr +
				' | ./' + thead + '/' + tr +
				' | ./' + tbody + '/' + tr +
				' | ./' + tfoot + '/' + tr, table, blueprint);

		var columnInfo = parseDefaultColumnInfo(tableStructure, table, blueprint),
			columnSpecifications = columnInfo.columnSpecifications;
		builder.model.columnSpecifications = columnSpecifications;

		// Determine the number of header rows
		// if thead -> return number of tr in thead
		// if tbody -> return number of tr before tbody
		// else     -> return number of tr containing only th ocurring before the first tr not containing only th
		var numberOfHeaderRows = evaluateXPathToNumber(
			'let $hasTbody := ./' + tbody + ', $hasThead := ./' + thead + ' return ' +
			'if ($hasThead) then ./' + thead + '/' + tr + ' => count() ' +
			'else ' +
				'(if ($hasTbody) then (./' + tbody + ')[1]/preceding-sibling::' + tr + ' => count() ' +
				'else (./' + tr + '[./' + td + '])[1]/preceding-sibling::' + tr +
					'[./' + th + ' => count() = ./*[self::' + td + ' | self::' + th + '] => count()] => count())', table, blueprint);
		builder.model.headerRowCount = numberOfHeaderRows;

		// Create the TableCell objects and fill the TableGridModel.
		for (var row = 0, length = rowNodes.length; row < length; row++) {
			builder.newRow();

			var tableCellElements = evaluateXPathToNodes(
				'child::' + td + ' | child::' + th,
				rowNodes[row],
				blueprint);

			for (var counter = 0; counter < tableCellElements.length; counter++) {
				var cell = tableCellElements[counter],
					parsedCell = parseTableCellElement(cell, blueprint);

				builder.newCell(cell, parsedCell.data, parsedCell.rowSpan, parsedCell.colSpan);
			}
		}

		normalizeGridModel(builder.model);

		validateGridModel(builder);

		computeWidths(builder.model);

		return builder.model;
	};

});
