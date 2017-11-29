define([
	'fontoxml-blueprints',
	'fontoxml-dom-identification/getNodeId',
	'fontoxml-dom-namespaces/namespaceManager',
	'fontoxml-selectors/evaluateXPathToBoolean',
	'fontoxml-selectors/evaluateXPathToFirstNode',
	'fontoxml-selectors/evaluateXPathToNodes'
], function (
	blueprints,
	getNodeId,
	namespaceManager,
	evaluateXPathToBoolean,
	evaluateXPathToFirstNode,
	evaluateXPathToNodes
) {
	'use strict';

	var unsafeMoveNodes = blueprints.blueprintMutations.unsafeMoveNodes;

	function createNewRow (parentElement, namespaceURI, blueprint) {
		var row = namespaceManager.createElementNS(parentElement.ownerDocument, namespaceURI, 'tr');
		blueprint.appendChild(parentElement, row);
		return row;
	}

	function convertCellElement (elementNameToConvertTo, namespaceURI, blueprint, tableCellElement) {
		var newElement = namespaceManager.createElementNS(tableCellElement.ownerDocument, namespaceURI, elementNameToConvertTo);

		// Use unsafeMoveNodes to prevent selections
		if (blueprint.getFirstChild(tableCellElement)) {
			unsafeMoveNodes(
				blueprint.getFirstChild(tableCellElement),
				blueprint.getLastChild(tableCellElement),
				blueprint,
				newElement,
				null,
				true);
		}
		// When there are no child nodes, there should be only one position
		else {
			blueprint.movePosition(tableCellElement, 0, newElement, 0);
		}

		var parentNode = blueprint.getParentNode(tableCellElement);
		if (parentNode) {
			blueprint.replaceChild(parentNode, newElement, tableCellElement);
		}

		return newElement;
	}

	/**
	 * Attempt to serialize the given table under the given table node.
	 *
	 * @param   {TableStructure}  tableStructure  The table structure to use for serialization
	 * @param   {TableGridModel}  tableGridModel  The tableGridModel to serialize
	 * @param   {Node}            tableNode       The tableNode to serialize the table under
	 * @param   {Blueprint}       blueprint       The blueprint to serialize in
	 * @param   {Format}          format          The format containing the validator and metadata to use
	 * @return  {boolean}         The success of the serialization. If true, the serialization took place in the given blueprint
	 */
	return function tableGridModelToXhtmlTable (tableStructure, tableGridModel, tableNode, blueprint, format) {
		// Alias values for better clearer XPaths
		var thead = tableStructure.selectorParts.thead;
		var tbody = tableStructure.selectorParts.tbody;
		var tfoot = tableStructure.selectorParts.tfoot;
		var tr = tableStructure.selectorParts.tr;
		var td = tableStructure.selectorParts.td;
		var th = tableStructure.selectorParts.th;

		var useThead = tableStructure.useThead;
		var useTbody = tableStructure.useTbody;
		var useTh = tableStructure.useTh;

		var namespaceURI = tableStructure.namespaceURI;

		blueprint.beginOverlay();

		var columnCount = tableGridModel.getWidth();
		var lastHeaderRowIndex = tableGridModel.getLowestHeaderRowIndex();

		if (tableGridModel.borders) {
			blueprint.setAttribute(tableNode, 'border', '1');
		}
		else {
			blueprint.removeAttribute(tableNode, 'border');
		}

		// Header rows XPath:
		//  - if thead -> return thead/tr
		//  - else -> find all rows preceding the first regular row which contain only th elements
		var headerRowNodes = evaluateXPathToNodes(
			'if (./' + thead + ') then ./' + thead + '/' + tr +
			' else (./' + tr + '[./' + td + '])[1]/preceding-sibling::' + tr +
				'[./' + th + ' => count() = ./*[self::' + td + ' or self::' + th + '] => count()] | ()', tableNode, blueprint);

		// Body rows XPath:
		//  - if tbody -> return tbody/tr
		//  - else -> find all rows not containing only th elements
		var bodyRowNodes = evaluateXPathToNodes(
			'if (./' + tbody + ') then ./' + tbody + '/' + tr +
			' else ./' + tr + '[not(./' + th + ' => count() = ./*[self::' + td + ' or self::' + th + '] => count())]', tableNode, blueprint);

		// Footer rows XPath:
		//  - if tfoot -> return tfoot/tr
		//  - else -> find all rows after the rows not containing only th elements
		var footerRowNodes = evaluateXPathToNodes(
			'if (./' + tfoot + ') then ./' + tfoot + '/' + tr +
			' else ./' + tr + '[./' + td + ' => count() = ./*[self::' + td + ' or self::' + th + '] => count()][last()]/following-sibling::' + tr, tableNode, blueprint);
		var rowNodes = headerRowNodes.concat(bodyRowNodes, footerRowNodes);

		var theadNode = evaluateXPathToFirstNode('./' + thead, tableNode, blueprint);
		var tbodyNode = null;
		var tfootNode = evaluateXPathToFirstNode('./' + tfoot, tableNode, blueprint);

		// Support for starting with multiple body nodes, merge these into one when present
		var tbodyNodes = evaluateXPathToNodes('./' + tbody, tableNode, blueprint);
		if (tbodyNodes.length > 0) {
			tbodyNode = tbodyNodes.reduce(function(finalTbodyNode, currentTbodyNode, index) {
				if (index === 0) {
					return finalTbodyNode;
				}

				var childTrNodes = evaluateXPathToNodes('./' + tr, currentTbodyNode, blueprint);
				if (childTrNodes.length) {
					unsafeMoveNodes(
						childTrNodes[0],
						childTrNodes[childTrNodes.length - 1],
						blueprint,
						finalTbodyNode,
						null,
						true);
				}

				blueprint.removeChild(tableNode, currentTbodyNode);

				return finalTbodyNode;
			}, tbodyNodes[0]);
		}

		// Should use thead, no thead present, there is at least 1 header row -> create thead
		if (!theadNode && useThead && lastHeaderRowIndex > -1) {
			theadNode = namespaceManager.createElementNS(tableNode.ownerDocument, namespaceURI, 'thead');

			if (headerRowNodes.length) {
				unsafeMoveNodes(
					headerRowNodes[0],
					headerRowNodes[headerRowNodes.length - 1],
					blueprint,
					theadNode,
					null,
					true);
			}

			blueprint.insertBefore(tableNode, theadNode, blueprint.getFirstChild(tableNode));
		}

		// Should not use thead, thead present -> remove thead
		if (theadNode && !useThead) {
			if (headerRowNodes.length) {
				unsafeMoveNodes(
					headerRowNodes[0],
					headerRowNodes[headerRowNodes.length - 1],
					blueprint,
					tableNode,
					blueprint.getNextSibling(theadNode),
					true);
			}

			blueprint.removeChild(tableNode, theadNode);
		}

		// Should use tbody, no tbody present -> create tbody
		if (!tbodyNode && useTbody) {
			tbodyNode = namespaceManager.createElementNS(tableNode.ownerDocument, namespaceURI, 'tbody');

			if (bodyRowNodes.length) {
				unsafeMoveNodes(
					bodyRowNodes[0],
					bodyRowNodes[bodyRowNodes.length - 1],
					blueprint,
					tbodyNode,
					null,
					true);
			}

			blueprint.appendChild(tableNode, tbodyNode);
		}

		// Should not use tbody, tbody present -> remove tbody
		if (tbodyNode && !useTbody) {
			if (bodyRowNodes.length) {
				unsafeMoveNodes(
					bodyRowNodes[0],
					bodyRowNodes[bodyRowNodes.length - 1],
					blueprint,
					tableNode,
					null,
					true);
			}

			blueprint.removeChild(tableNode, tbodyNode);
		}

		// Remove tfoot if present
		if (tfootNode) {
			if (footerRowNodes.length) {
				unsafeMoveNodes(
					footerRowNodes[0],
					footerRowNodes[footerRowNodes.length - 1],
					blueprint,
					useTbody ? tbodyNode : tableNode,
					null,
					true);
			}

			blueprint.removeChild(tableNode, tfootNode);
		}

		// Figure out if there are changes to the number of rows in the thead element
		if (useThead) {
			var diff = headerRowNodes.length - tableGridModel.headerRowCount;
			// Header rows have been removed
			if (diff > 0) {
				unsafeMoveNodes(
					headerRowNodes[headerRowNodes.length - diff],
					headerRowNodes[headerRowNodes.length - 1],
					blueprint,
					useTbody ? tbodyNode : tableNode,
					evaluateXPathToFirstNode('if ($useTbody) then ./tbody/tr else ./tr', tableNode, blueprint, { useTbody: useTbody }),
					true);

				if (headerRowNodes.length - diff === 0) {
					blueprint.removeChild(tableNode, theadNode);
				}
			}

			// Header rows have been added
			if (diff < 0) {
				if (bodyRowNodes.length > 0) {
					unsafeMoveNodes(
						bodyRowNodes[0],
						bodyRowNodes[Math.abs(diff) - 1],
						blueprint,
						theadNode,
						null,
						true);
				}
			}
		}

		// Build a map containing all of the current rows
		var unseenRows = Object.create(null);
		for (var index = 0, height = rowNodes.length;
			index < height;
			++index) {

			var unseenRow = rowNodes[index];

			// When deleting the only present header row unseenRow will actually be undefined.
			//    So we ensure thats not the case before adding it.
			if (unseenRow !== undefined) {
				unseenRows[getNodeId(unseenRow)] = unseenRow;
			}
		}

		// First: create the needed cells
		for (var rowIndex = 0, rowCount = tableGridModel.getHeight(); rowIndex < rowCount; ++rowIndex) {
			var row;

			row = rowNodes[rowIndex];
			if (!row) {
				var isHead = rowIndex <= lastHeaderRowIndex;
				var parent = tableNode;

				if (isHead && useThead) {
					parent = theadNode;
				}
				if (!isHead && useTbody) {
					parent = tbodyNode;
				}
				row = createNewRow(parent, namespaceURI, blueprint);
				rowNodes[rowIndex] = row;
			}

			if (unseenRows[getNodeId(row)]) {
				// This row still exists
				delete unseenRows[getNodeId(row)];
			}

			// Build a map containing all of the current cells of this row
			var cells = evaluateXPathToNodes('./' + td + ' | ./' + th, row, blueprint);
			var unseenCells = cells.reduce(function (map, cell) {
				map[getNodeId(cell)] = cell;
				return map;
			}, Object.create(null));

			for (var columnIndex = 0; columnIndex < columnCount; ++columnIndex) {
				var tableCell = tableGridModel.getCellAtCoordinates(rowIndex, columnIndex);

				if (tableCell.origin.row !== rowIndex) {
					// This cell spans from a previous row, thus should only be rendered there
					// Move the index to the end of the cell
					columnIndex += tableCell.size.columns - 1;
					continue;
				}

				if (unseenCells[getNodeId(tableCell.element)]) {
					// This entry still exists under the current row
					delete unseenCells[getNodeId(tableCell.element)];
				}

				var tableCellElement = tableCell.element;

				var isHeadCell = tableCell.origin.row <= lastHeaderRowIndex;
				var wasHeadCell = tableCell.origin.row < headerRowNodes.length;
				var isThElement = evaluateXPathToBoolean('self::' + th, tableCellElement, blueprint);

				if (isHeadCell && useTh && !isThElement) {
					// We need to convert the td into a th element
					var newThElement = convertCellElement('th', namespaceURI, blueprint, tableCellElement);

					if (newThElement) {
						tableCellElement = newThElement;
						tableCell.element = newThElement;
					}
				}
				if (isThElement && ((isHeadCell && !useTh) || (wasHeadCell && !isHeadCell))) {
					// We need to convert the th into a td element
					var newTdElement = convertCellElement('td', namespaceURI, blueprint, tableCellElement);

					if (newTdElement) {
						tableCellElement = newTdElement;
						tableCell.element = newTdElement;
					}
				}

				if (tableCell.size.rows !== 1) {
					// Set the rows attribute, indicating rowSpans
					blueprint.setAttribute(tableCellElement, 'rowspan', tableCell.size.rows + '');
				}

				if (tableCell.size.rows === 1 && blueprint.getAttribute(tableCellElement, 'rowspan')) {
					blueprint.removeAttribute(tableCellElement, 'rowspan');
				}

				if (tableCell.size.columns !== 1) {
					blueprint.setAttribute(tableCellElement, 'colspan', tableCell.size.columns + '');
				}

				if (tableCell.size.columns === 1 && blueprint.getAttribute(tableCellElement, 'colspan')) {
					blueprint.removeAttribute(tableCellElement, 'colspan');
				}

				if (tableCell.data.horizontalAlignment) {
					// Set the align attribute, indicating horizontal cell aligment
					blueprint.setAttribute(tableCellElement, 'align', tableCell.data.horizontalAlignment);
				}

				if (tableCell.data.verticalAlignment) {
					// Set the valign attribute, indicating vertical cell aligment
					blueprint.setAttribute(tableCellElement, 'valign', tableCell.data.verticalAlignment);
				}

				// The cell may already be present at this location.
				//   unsafeMoveNodes it to prevent positions from being collapsed wrongly
				if (blueprint.getParentNode(tableCellElement)) {
					unsafeMoveNodes(
						tableCellElement,
						tableCellElement,
						blueprint,
						row,
						null,
						true);
				}
				else {
					blueprint.appendChild(row, tableCellElement);
				}

				// Move the index to the end of this possibly spanning cell
				columnIndex += tableCell.size.columns - 1;
			}

			// All of the entries which did not appear in the past row in the grid must be removed
			var unseenNodeIds = Object.keys(unseenCells);
			for (var unseenNodeId = unseenNodeIds.pop();
					unseenNodeId;
					unseenNodeId = unseenNodeIds.pop()) {
				blueprint.removeChild(row, unseenCells[unseenNodeId]);

			}
		}

		// All rows that did not appear in the grid must be removed.
		var unseenRowNodeIds = Object.keys(unseenRows);
		for (var unseenRowNodeId = unseenRowNodeIds.pop(); unseenRowNodeId; unseenRowNodeId = unseenRowNodeIds.pop()) {
			var currentRow = unseenRows[unseenRowNodeId];
			blueprint.removeChild(blueprint.getParentNode(currentRow), currentRow);
		}

		if (format.synthesizer.completeStructure(tableNode, blueprint)) {
			// The table is valid
			blueprint.applyOverlay();
			return true;
		}

		// The table is invalid
		blueprint.discardOverlay();
		return false;
	};
});
