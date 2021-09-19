import configureAsBlock from 'fontoxml-families/src/configureAsBlock';
import type {
	AllowExpansionInContentView,
	Widget,
	WidgetSubAreaByName,
} from 'fontoxml-families/src/types';
import type { XPathQuery, XPathTest } from 'fontoxml-selectors/src/types';
import configureAsTableElements from 'fontoxml-table-flow/src/configureAsTableElements';

import XhtmlTableDefinition from './table-definition/XhtmlTableDefinition';

/**
 * Configure XHTML tables.
 *
 * Note that the `columnBefore` widgets are linked to col elements or the cells in the first row
 * in cases `shouldCreateColumnSpecificationNodes` is set to `false`. If the `columnBefore` widgets
 * are linked to the cells in the first row and there is even one merged cell (to left or right) in
 * the first row, the widgets in `columnBefore` widgets are not rendered.
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
 *		showSelectionWidget: true,
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
 *		],
 *		cellStylingTranslationQuery: 'import module namespace app = "http://www.fontoxml.com/app"; app:cellStylingTranslationQuery(., $tableEdges)'
 *	});
 *```
 *
 * The cell element menu button widgets are added based on the existence of contextual operations on
 * cell level. Make sure that only cell-specific operations are added to the cell widget, so that
 * users are only given options relevant to them. Check {@link fonto-documentation/docs/configure/elements/configure-tables.xml#id-d8cde415-f9e0-ba0c-14a5-cdb5f92d647d our guide}
 * for more information on table widgets.
 *
 * Example on how you can add this element menu on the widget:
 *
 * ```
 *	configureProperties(sxModule, 'self::td', {
 *		contextualOperations: [
 *			{ name: 'contextual-set-total-cell', hideIn: ['context-menu'] }
 *		]
 *	});
 *
 * ```
 *
 * XHTML tables can also be configured to be collapsible. Refer to {@link fonto-documentation/docs/configure/elements/configure-tables.xml#id-6c3f43af-b40c-4fa3-ab47-f0fd2d4ab85c our guide} to learn more.
 *
 * @fontosdk
 *
 * @category add-on/fontoxml-table-flow-xhtml
 *
 * @param  {Object}                             sxModule
 * @param  {Object}                             [options]
 * @param  {number}                             [options.priority]                                    Selector priority for all elements configured by this function.
 * @param  {AllowExpansionInContentView}        [options.allowExpansionInContentView]                 Defines the availability of expansion of a table.
 * @param  {boolean}                            [options.showInsertionWidget]                         To add insertion buttons which insert a column or a row
 *                                                                                                    to a specific place, default false.
 * @param  {boolean}                            [options.showHighlightingWidget]                      This is @deprecated. Instead use showSelectionWidget.
 * @param  {boolean}                            [options.showSelectionWidget]                         To add selection bars which select columns and rows,
 *                                                                                                    and provide operations popover, default false.
 * @param  {WidgetSubAreaByName|Widget[]|null}  [options.columnBefore]                                Used to add one or multiple widgets before each column.
 *                                                                                                    The context node for these widgets will either be the col element,
 *                                                                                                    or if `shouldCreateColumnSpecificationNodes` is set to `false`,
 *                                                                                                    the cell element of the first row. Tables that do not have these
 *                                                                                                    elements will not show `columnBefore` widgets.
 *                                                                                                    {@link fonto-documentation/docs/editor/api/index.xml#id-9d2b1ad5-bbc1-6c44-d491-16dc213c53f2 All widgets}
 *                                                                                                    are supported.
 * @param  {WidgetSubAreaByName|Widget[]|null}  [options.rowBefore]                                   Used to add a single icon widget before each row using
 *                                                                                                    {@link createIconWidget}. Row widgets are linked to the row elements
 *                                                                                                    of the table. Any widget can be added but only icon widget is supported.
 * @param  {Object[]|null}                      [options.columnWidgetMenuOperations]                  To configure table widget menu for columns. It accepts an array of
 *                                                                                                    {@link ContextualOperation}s, but only supports "name" and "contents"
 *                                                                                                    properties. It is allowed to have only one layer of menu.
 * @param  {Object[]|null}                      [options.rowWidgetMenuOperations]                     To configure table widget menu for rows. It accepts an array of
 *                                                                                                    {@link ContextualOperation}s, but only supports "name" and "contents"
 *                                                                                                    properties. It is allowed to have only one layer of menu.
 * @param  {boolean}                            [options.useTh]                                       Set to true if th should be used.
 * @param  {boolean}                            [options.useThead]                                    Set to true if thead should be used.
 * @param  {boolean}                            [options.useTbody]                                    Set to true if tbody should be used.
 * @param  {boolean}                            [options.useBorders=true]                             Set to false if the borders attribute should not be used.
 * @param  {boolean}                            [options.shouldCreateColumnSpecificationNodes=false]  Set to true if the table should include <col> elements by default.
 * @param  {Object}                             [options.table]                                       Options for the table element.
 * @param  {XPathTest}                          [options.table.tableFilterSelector]                   An optional additional selector for the table which will be used
 *                                                                                                    to refine whether a table element should be considered as an xhtml table.
 * @param  {string}                             [options.table.namespaceURI='']                       The namespace URI for this table.
 * @param  {Object}                             [options.td]                                          Configuration options for the td element.
 * @param  {string}                             [options.td.defaultTextContainer]                     The default text container for the td element.
 * @param  {Object}                             [options.th]                                          Configuration options for the th element.
 * @param  {string}                             [options.th.defaultTextContainer]                     The default text container for the th element.
 * @param  {boolean}                            [options.useDefaultContextMenu=true]                  Whether or not to use a preconfigured context menu for
 *                                                                                                    elements within the table.
 * @param  {cellStylingTranslationQuery}        [options.cellStylingTranslationQuery]                 An {@link XPathQuery} that should return the styling for the cell.
 *                                                                                                    For more details see {@link cellStylingTranslationQuery}.
 * @param  {XPathQuery}                         [options.isCollapsibleQuery=false()]                  The {@link XPathQuery} to determine whether or not a table has the
 *                                                                                                    ability to be collapsible. Optional, defaults to 'false()'.
 *                                                                                                    $rowCount and $columnCount helper variables can optionally be used
 *                                                                                                    in this XPath expression which evaluate to the total rows and total
 *                                                                                                    columns in a table.
 * @param  {XPathQuery}                         [options.isInitiallyCollapsedQuery=true()]            The {@link XPathQuery} to determine whether or not a table should
 *                                                                                                    initially start off as collapsed. Tables must first have the ability
 *                                                                                                    to be collapsible with isCollapsibleQuery. Optional, defaults to
 *                                                                                                    'true()'. $rowCount and $columnCount helper variables can optionally
 *                                                                                                    be used in this XPath expression which evaluate to the total
 *                                                                                                    rows and total columns in a table.
 */
export default function configureAsXhtmlTableElements(
	sxModule: Object,
	options?: {
		priority?: number;
		allowExpansionInContentView?: AllowExpansionInContentView;
		showInsertionWidget?: boolean;
		/**
		 * @deprecated
		 * Instead use showSelectionWidget.
		 */
		showHighlightingWidget?: boolean;
		showSelectionWidget?: boolean;
		columnBefore?: Widget[] | WidgetSubAreaByName | null;
		rowBefore?: Widget[] | WidgetSubAreaByName | null;
		columnWidgetMenuOperations?: Object[] | null;
		rowWidgetMenuOperations?: Object[] | null;
		useTh?: boolean;
		useThead?: boolean;
		useTbody?: boolean;
		useBorders?: boolean;
		shouldCreateColumnSpecificationNodes?: boolean;
		table?: {
			tableFilterSelector?: XPathTest;
			namespaceURI?: string;
		};
		td?: {
			defaultTextContainer?: string;
		};
		th?: {
			defaultTextContainer?: string;
		};
		useDefaultContextMenu?: boolean;
		cellStylingTranslationQuery?: $TSFixMeAnyFontoSdk;
		isCollapsibleQuery?: XPathQuery;
		isInitiallyCollapsedQuery?: XPathQuery;
	}
): void {
	options = options || {};
	options.cell = {
		defaultTextContainer:
			options.td && options.td.defaultTextContainer
				? options.td.defaultTextContainer
				: null,
	};
	options.headerCell = {
		defaultTextContainer:
			options.th && options.th.defaultTextContainer
				? options.th.defaultTextContainer
				: null,
	};
	const tableDefinition = new XhtmlTableDefinition(options);
	configureAsTableElements(sxModule, options, tableDefinition);
	const priority = options.priority;

	// Title (caption)
	const captionSelector = `self::${tableDefinition.selectorParts.caption}`;
	configureAsBlock(sxModule, captionSelector, undefined, {
		priority,
	});

	configureAsTableElements(sxModule, options, tableDefinition);
}
