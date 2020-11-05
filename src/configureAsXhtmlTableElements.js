import configureAsBlock from 'fontoxml-families/src/configureAsBlock.js';
import configureAsTableElements from 'fontoxml-table-flow/src/configureAsTableElements.js';
import XhtmlTableDefinition from './table-definition/XhtmlTableDefinition.js';

/**
 * Configure XHTML tables.
 *
 * Note that the `columnBefore` widget area can only be used if your tables use col elements, i.e.,
 * when `shouldCreateColumnSpecificationNodes` is set to `true`.
 *
 * Example usage for the table widgets:
 *
 *```
 *	configureAsXhtmlTableElements(sxModule, {
 *		table: {
 *			namespaceURI: 'http://docbook.org/ns/docbook',
 *			tableFilterSelector: 'self::table and not(tgroup)'
 *		},
 *		td: {
 *			defaultTextContainer: 'simpara'
 *		}
 *		columnBefore: [
 *			createIconWidget('clock-o', {
 *				clickOperation: 'lcTime-value-edit',
 *				tooltipContent: 'Click here to edit the duration'
 *			})
 *		],
 *		rowBefore: [
 *			createIconWidget('dot-circle-o', {
 *				clickOperation: 'do-nothing'
 *			})
 *		],
 *		showInsertionWidget: true,
 *		showHighlightingWidget: true,
 *		columnWidgetMenuOperations: [
 *			{
 *				contents: [
 *					{ name: 'contextual-xhtml-set-cell-horizontal-alignment-left' },
 *					{ name: 'contextual-xhtml-set-cell-horizontal-alignment-center' },
 *					{ name: 'contextual-xhtml-set-cell-horizontal-alignment-right' },
 *					{ name: 'contextual-xhtml-set-cell-horizontal-alignment-justify' }
 *				]
 *			},
 *			{
 *				contents: [
 *					{ name: 'contextual-xhtml-set-cell-vertical-alignment-top' },
 *					{ name: 'contextual-xhtml-set-cell-vertical-alignment-center' },
 *					{ name: 'contextual-xhtml-set-cell-vertical-alignment-bottom' }
 *				]
 *			},
 *			{ contents: [{ name: 'column-delete-at-index' }] }
 *		],
 *		rowWidgetMenuOperations: [
 *			{
 *				contents: [
 *					{ name: 'contextual-xhtml-set-cell-horizontal-alignment-left' },
 *					{ name: 'contextual-xhtml-set-cell-horizontal-alignment-center' },
 *					{ name: 'contextual-xhtml-set-cell-horizontal-alignment-right' },
 *					{ name: 'contextual-xhtml-set-cell-horizontal-alignment-justify' }
 *				]
 *			},
 *			{
 *				contents: [
 *					{ name: 'contextual-xhtml-set-cell-vertical-alignment-top' },
 *					{ name: 'contextual-xhtml-set-cell-vertical-alignment-center' },
 *					{ name: 'contextual-xhtml-set-cell-vertical-alignment-bottom' }
 *				]
 *			},
 *			{ contents: [{ name: 'contextual-row-delete' }] }
 *		]
 *	});
 *```
 *
 * The cell element menu button widgets are added based on the existence of contextual operations on
 * cell level. Make sure that only cell-specific operations are added to the cell widget, so that
 * users are only given options relevant to them.
 * Example on how you can add this element menu on the widget:
 *
 * ```
 *	configureProperties(sxModule, 'self::td', {
 *		contextualOperations: [
 *			{ name: 'contextual-set-total-cell', hideIn: ['context-menu'] }
 *		]
 *	});
 * ```

 * @fontosdk
 *
 * @category add-on/fontoxml-table-flow-xhtml
 *
 * @param  {Object}          sxModule
 * @param  {Object}          [options]
 * @param  {number}          [options.priority]                    Selector priority for all elements configured by this function
 * @param  {boolean}         [options.showInsertionWidget]         To add insertion buttons which insert a column or a row to a specific place, default false.
 * @param  {boolean}         [options.showHighlightingWidget]      To add highlighting bars which highlight columns and rows, and provide operations popover, default false.
 * @param  {Widget[]|null}   [options.columnBefore]                To add column icon widgets by using {@link createIconWidget}. Column widgets are linked to the col elements. Tables that do not have these elements will not show columnBefore widgets. Any widget can be added but only icon widget is supported.
 * @param  {Widget[]|null}   [options.rowBefore]                   To add row icon widgets by using {@link createIconWidget}. Row widgets are linked to the row elements of the table. Any widget can be added but only icon widget is supported.
 * @param  {Object[]|null}   [options.columnWidgetMenuOperations]  To configure table widget menu for columns. It accepts an array of {@link ContextualOperation}s, but only supports "name" and "contents" properties. It is allowed to have only one layer of menu.
 * @param  {Object[]|null}   [options.rowWidgetMenuOperations]     To configure table widget menu for rows. It accepts an array of {@link ContextualOperation}s, but only supports "name" and "contents" properties. It is allowed to have only one layer of menu.
 * @param  {boolean}         [options.useTh]                       Set to true if th should be used
 * @param  {boolean}         [options.useThead]                    Set to true if thead should be used
 * @param  {boolean}         [options.useTbody]                    Set to true if tbody should be used
 * @param  {boolean}         [options.useBorders=true]             Set to false if the borders attribute should not be used
 * @param  {boolean}         [options.shouldCreateColumnSpecificationNodes=false] Set to true if the table should include <col> elements by default
 * @param  {Object}          [options.table]                       Options for the table element
 * @param  {XPathTest}       [options.table.tableFilterSelector]   An optional additional selector for the table which will be used to refine whether a table element should be considered as an xhtml table
 * @param  {string}          [options.table.namespaceURI='']       The namespace URI for this table
 * @param  {Object}          [options.td]                          Configuration options for the td element
 * @param  {string}          [options.td.defaultTextContainer]     The default text container for the td element
 * @param  {Object}          [options.th]                          Configuration options for the th element
 * @param  {string}          [options.th.defaultTextContainer]     The default text container for the th element
 * @param  {boolean}         [options.useDefaultContextMenu=true]  Whether or not to use a preconfigured context menu for elements within the table
 */
export default function configureAsXhtmlTableElements(sxModule, options) {
	options = options || {};
	options['cell'] = {
		defaultTextContainer:
			options.td && options.td.defaultTextContainer ? options.td.defaultTextContainer : null
	};
	options['headerCell'] = {
		defaultTextContainer:
			options.th && options.th.defaultTextContainer ? options.th.defaultTextContainer : null
	};
	const tableDefinition = new XhtmlTableDefinition(options);
	configureAsTableElements(sxModule, options, tableDefinition);
	const priority = options.priority;

	// Title (caption)
	const captionSelector = 'self::' + tableDefinition.selectorParts.caption;
	configureAsBlock(sxModule, captionSelector, undefined, {
		priority: priority
	});

	configureAsTableElements(sxModule, options, tableDefinition);
}
