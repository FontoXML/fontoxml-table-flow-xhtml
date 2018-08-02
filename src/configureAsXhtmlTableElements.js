define([
	'fontoxml-families/configureAsBlock',
	'fontoxml-table-flow/configureAsTableElements',

	'./table-definition/XhtmlTableDefinition'
], function (
	configureAsBlock,
	configureAsTableElements,

	XhtmlTableDefinition
) {
	'use strict';

	/**
	 * Configure XHTML tables.
	 *
	 * @fontosdk
	 *
	 * @category add-on/fontoxml-table-flow-xhtml
	 *
	 * @param  {Object}  sxModule
	 * @param  {Object}  [options]
	 * @param  {number}  [options.priority]                Selector priority for all elements configured by this function
	 * @param  {boolean} [options.useTh]                   Set to true if th should be used
	 * @param  {boolean} [options.useThead]                Set to true if thead should be used
	 * @param  {boolean} [options.useTbody]                Set to true if tbody should be used
	 * @param  {boolean} [options.useBorders=true]         Set to false if the borders attribute should not be used
	 * @param  {boolean} [options.shouldCreateColumnSpecificationNodes=false] Set to true if the table should include <col> elements by default
	 * @param  {Object}  [options.table]                   Options for the table element
	 * @param  {XPathTest}  [options.table.tableFilterSelector]  An optional additional selector for the table which will be used to refine whether a table element should be considered as an xhtml table
	 * @param  {string}  [options.table.namespaceURI='']   The namespace URI for this table
	 * @param  {Object}  [options.td]                      Configuration options for the td element
	 * @param  {string}  [options.td.defaultTextContainer] The default text container for the td element
	 * @param  {Object}  [options.th]                      Configuration options for the th element
	 * @param  {string}  [options.th.defaultTextContainer] The default text container for the th element
	 */
	return function configureAsXhtmlTableElements (sxModule, options) {
		options = options || {};
		options['cell'] = {
			defaultTextContainer: options.td && options.td.defaultTextContainer ?
					options.td.defaultTextContainer :
					null
		};
		options['headerCell'] = {
			defaultTextContainer: options.th && options.th.defaultTextContainer ?
					options.th.defaultTextContainer :
					null
		};
		var tableDefinition = new XhtmlTableDefinition(options);
		configureAsTableElements(sxModule, options, tableDefinition);
		var priority = options.priority;

		// Title (caption)
		var captionSelector = 'self::' + tableDefinition.selectorParts.caption;
		configureAsBlock(sxModule, captionSelector, undefined, {
			priority: priority
		});

		configureAsTableElements(sxModule, options, tableDefinition);
	};
});
