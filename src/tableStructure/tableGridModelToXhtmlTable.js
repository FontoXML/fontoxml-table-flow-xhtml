define([
	'fontoxml-blueprints',
	'fontoxml-dom-identification/getNodeId',
	'fontoxml-dom-namespaces/namespaceManager',
	'fontoxml-selectors/evaluateXPathToBoolean',
	'fontoxml-selectors/evaluateXPathToNodes'
], function (
	blueprints,
	getNodeId,
	namespaceManager,
	evaluateXPathToBoolean,
	evaluateXPathToNodes
) {
	'use strict';

	var unsafeMoveNodes = blueprints.blueprintMutations.unsafeMoveNodes;

	function createNewRow (parentElement, namespaceUri, blueprint) {
		var row = namespaceManager.createElementNS(parentElement.ownerDocument, namespaceUri, 'tr');
		blueprint.appendChild(parentElement, row);
		return row;
	}

	function convertCellElement (elementNameToConvertTo, namespaceUri, blueprint, tableCellElement) {
		var newElement = namespaceManager.createElementNS(tableCellElement.ownerDocument, namespaceUri, elementNameToConvertTo);

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
	 * Attempt to serialize the given table under the given table node
	 *
	 * @param   {TableStructure}  tableStructure  The table structure to use for serialization
	 * @param   {TableGridModel}  tableGridModel  The tableGridModel to serialize
	 * @param   {Node}            tableNode       The tableNode to serialize the table under
	 * @param   {Blueprint}       blueprint       The blueprint to serialize in
	 * @param   {Format}          format          The format containing the validator and metadata to use
	 * @return  {boolean}         The success of the serialization. If true, the serialization took place in the given blueprint
	 */
	return function tableGridModelToXhtmlTable (tableStructure, tableGridModel, tableNode, blueprint, format) {
		blueprint.beginOverlay();

		// Get the already existing rows in the table
		var bodyRows = evaluateXPathToNodes(
				'descendant::' + tableStructure.selectorParts.tr +
				'[not(parent::' + tableStructure.selectorParts.thead +
				') and not(parent::' + tableStructure.selectorParts.tfoot + ')]', tableNode, blueprint);

		var columnCount = tableGridModel.getWidth();

		if (tableGridModel.borders) {
			blueprint.setAttribute(tableNode, 'border', '1');
		}
		else {
			blueprint.removeAttribute(tableNode, 'border');
		}

		// Build a map containing all of the current rows
		var unseenRows = Object.create(null);
		for (var index = 0, height = bodyRows.length;
			index < height;
			++index) {

			var unseenRow = bodyRows[index];

			// When deleting the only present header row unseenRow will actually be undefined.
			//    So we ensure thats not the case before adding it.
			if (unseenRow !== undefined) {
				unseenRows[getNodeId(unseenRow)] = unseenRow;
			}
		}

		// First: create the needed cells
		for (var rowIndex = 0, rowCount = tableGridModel.getHeight(); rowIndex < rowCount; ++rowIndex) {
			var row;

			row = bodyRows[rowIndex];
			if (!row) {
				row = createNewRow(tableNode, tableStructure.namespaceUri, blueprint);
				bodyRows[rowIndex] = row;
			}

			if (unseenRows[getNodeId(row)]) {
				// This row still exists
				delete unseenRows[getNodeId(row)];
			}

			// Build a map containing all of the current cells of this row
			var cells = evaluateXPathToNodes(
				'./*[self::' +
				tableStructure.selectorParts.td +
				' or self::' +
				tableStructure.selectorParts.th +
				']', row, blueprint);
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

				if (tableCell.origin.row <= tableGridModel.getLowestHeaderRowIndex() &&
						evaluateXPathToBoolean('self::' + tableStructure.selectorParts.td, tableCellElement, blueprint)) {
					// We need to convert the td into a th element
					var newThElement = convertCellElement('th', tableStructure.namespaceUri, blueprint, tableCellElement);

					if (newThElement) {
						tableCellElement = newThElement;
						tableCell.element = newThElement;
					}
				}
				else if (tableCell.origin.row > tableGridModel.getLowestHeaderRowIndex() &&
						evaluateXPathToBoolean('self::' + tableStructure.selectorParts.th, tableCellElement, blueprint)) {
					// We need to convert the th into a td element
					var newTdElement = convertCellElement('td', tableStructure.namespaceUri, blueprint, tableCellElement);

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
			blueprint.removeChild(tableNode, unseenRows[unseenRowNodeId]);
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
