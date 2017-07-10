define([
	'fontoxml-table-flow',
	'fontoxml-templated-views'
], function (
	tableFlow,
	templatedViews
) {
	'use strict';

	var tableGridModelLookupSingleton = tableFlow.tableGridModelLookupSingleton,
		Template = templatedViews.base.Template;

	function CellTemplate () {
		Template.call(this);
	}

	CellTemplate.prototype = Object.create(Template.prototype);
	CellTemplate.prototype.constructor = CellTemplate;

	CellTemplate.prototype.render = function (nodeRenderer) {
		var tableGridModel = tableGridModelLookupSingleton.getGridModel(nodeRenderer.sourceNode),
			tableCell = tableGridModel.getCellByNodeId(nodeRenderer.sourceNode.nodeId),
			cellViewNode = nodeRenderer.viewDocumentNode.createElement(tableCell.element.nodeName);

		// Create a dependency on the attributes to ensure a re-render when they are changed
		// DO NOT REMOVE
		nodeRenderer.sourceNode.getAttribute('colspan');
		nodeRenderer.sourceNode.getAttribute('rowspan');
		nodeRenderer.sourceNode.getAttribute('align');
		nodeRenderer.sourceNode.getAttribute('valign');

		// Since we are looking upwards from either a td or th we know this lookup always returns the table node.
		var tableNode = nodeRenderer.sourceNode.parentNode.parentNode;

		// Create a dependency on the attributes of the col elements within the table to ensure a re-render when they are changed.
		// DO NOT REMOVE
		tableNode.getAttribute('border');
		tableNode.childNodes.forEach(function (childNode) {
			if (childNode.localName === 'col') {
				childNode.attributes;
			}
		});

		cellViewNode.setAttribute('colspan', tableCell.size.columns + '');
		cellViewNode.setAttribute('rowspan', tableCell.size.rows + '');

		if (tableCell.data.horizontalAlignment) {
			cellViewNode.setAttribute('cv-table-cell-horizontal-alignment', tableCell.data.horizontalAlignment);
		}
		if (tableCell.data.verticalAlignment) {
			cellViewNode.setAttribute('cv-table-cell-vertical-alignment', tableCell.data.verticalAlignment);
		}
		else {
			cellViewNode.setAttribute('cv-table-cell-vertical-alignment', 'top');
		}
		if (tableGridModel.borders) {
			cellViewNode.setAttribute('cv-table-column-separator', '1');
		}
		if (tableGridModel.borders) {
			cellViewNode.setAttribute('cv-table-row-separator', '1');
		}

		// Set the node-id for triggering the right click context menu
		cellViewNode.setAttribute('node-id', nodeRenderer.sourceNode.nodeId);

		nodeRenderer.appendViewNode(cellViewNode);
		nodeRenderer.traverse(cellViewNode);
	};

	return CellTemplate;
});
