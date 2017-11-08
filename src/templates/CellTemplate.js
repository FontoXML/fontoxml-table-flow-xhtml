define([
	'fontoxml-families/determineCommonVisualizationOptions',
	'fontoxml-families/mapCommonVisualizationOptionsToCvAttributes',
	'fontoxml-table-flow',
	'fontoxml-templated-views'
], function (
	determineCommonVisualizationOptions,
	mapCommonVisualizationOptionsToCvAttributes,
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
		var sourceNode = nodeRenderer.sourceNode;
		sourceNode.getAttribute('colspan');
		sourceNode.getAttribute('rowspan');
		sourceNode.getAttribute('align');
		sourceNode.getAttribute('valign');

		// Since we are looking upwards from either a td or th we know this lookup always returns the table node.
		var tableNode = sourceNode.parentNode.parentNode;

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

		var visualization = determineCommonVisualizationOptions(sourceNode, nodeRenderer);

		var finalVisualization = Object.assign(
			{},
			mapCommonVisualizationOptionsToCvAttributes(sourceNode, visualization),
			{
				'node-id': sourceNode.nodeId
			}
		);

		if (finalVisualization.backgroundColor) {
			cellViewNode.setAttribute('cv-frame-background', finalVisualization.backgroundColor);
		}
		if (finalVisualization.showWhen) {
			cellViewNode.setAttribute('cv-show-when', finalVisualization.showWhen);
		}

		Object.keys(finalVisualization).forEach(function (key) {
			cellViewNode.setAttribute(key, finalVisualization[key]);
		});

		nodeRenderer.appendViewNode(cellViewNode);
		nodeRenderer.traverse(cellViewNode);
	};

	return CellTemplate;
});
