define([
	'fontoxml-blueprints/readOnlyBlueprint',
	'fontoxml-families/mapBlockBodyVisualizationOptionsToCvAttributes',
	'fontoxml-families/mapCommonVisualizationOptionsToCvAttributes',
	'fontoxml-families/replaceBlockWidgetAreaPlaceholdersInJsonMl',
	'fontoxml-selectors/evaluateXPathToFirstNode',
	'fontoxml-selectors/evaluateXPathToNodes',
	'fontoxml-table-flow',
	'fontoxml-templated-views/JsonMlTemplate'
], function (
	readOnlyBlueprint,
	mapBlockBodyVisualizationOptionsToCvAttributes,
	mapCommonVisualizationOptionsToCvAttributes,
	replaceBlockWidgetAreaPlaceholdersInJsonMl,
	evaluateXPathToFirstNode,
	evaluateXPathToNodes,
	tableFlow,
	JsonMlTemplate
) {
	'use strict';

	var DEFAULT_VISUALIZATION = {};

	var tableGridModelLookupSingleton = tableFlow.tableGridModelLookupSingleton;

	function TableTemplate (visualization) {
		visualization = Object.assign({}, DEFAULT_VISUALIZATION, visualization);

		JsonMlTemplate.call(this, function createTableJsonMl (sourceNode, renderer) {
			var tableGridModel = tableGridModelLookupSingleton.getGridModel(sourceNode);

			// Create a dependency on the attributes to ensure a re-render when they are changed
			// DO NOT REMOVE
			sourceNode.getAttribute('border');

			var captionNode = evaluateXPathToFirstNode('./caption', sourceNode, readOnlyBlueprint);

			var jsonMl = ['cv-table',
					Object.assign(
						{},
						mapCommonVisualizationOptionsToCvAttributes(sourceNode, visualization),
						{
							'cv-layout': 'block'
						}),
					'{{blockOutsideBefore}}',
					'{{blockOutsideAfter}}',
					['cv-block-boundary',
						'{{blockHeader}}',
						['cv-block-body',
							mapBlockBodyVisualizationOptionsToCvAttributes(visualization),
							'{{blockBefore}}',
							'{{blockAfter}}',
							['cv-content',
								['table',
									captionNode ? ['caption', renderer.createRelatedNodePlaceholder(captionNode, '')] : '',
									[
										'tbody',
										{
											'cv-table-border': tableGridModel.borders ? 'all' : 'none'
										}
									].concat(
										evaluateXPathToNodes('./tr', sourceNode, readOnlyBlueprint).map(function (row) {
											return renderer.createRelatedNodePlaceholder(row, '');
										}))
								],
								// Work-around for tables appearing selected in Chrome if the next element is selected
								// and starts with a non-contentEditable (such as our widget areas)
								// https://bugs.chromium.org/p/chromium/issues/detail?id=591347
								['chrome-selection-workaround']
							]
						],
						'{{blockFooter}}'
					]
				];

			return replaceBlockWidgetAreaPlaceholdersInJsonMl(jsonMl, sourceNode, renderer, visualization);
		}, 'table');
	}

	TableTemplate.prototype = Object.create(JsonMlTemplate.prototype);
	TableTemplate.prototype.constructor = TableTemplate;

	return TableTemplate;
});
