import configureAsBlock from 'fontoxml-families/src/configureAsBlock.js';
import configureAsTableElements from 'fontoxml-table-flow/src/configureAsTableElements.js';
import XhtmlTableDefinition from './table-definition/XhtmlTableDefinition.js';

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
 *		],
 *		cellStylingTranslationQuery: 'import module namespace app = "http://www.fontoxml.com/app"; app:cellStylingTranslationQuery(., $tableEdges)'
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
 *
 * ```
 *
 * XHTML tables can also be configured to be collapsible. Refer to {@link fonto-documentation/docs/editor/fontoxml-editor-documentation/quickstarts/configure-tables.xml#id-6c3f43af-b40c-4fa3-ab47-f0fd2d4ab85c our guide} to learn more.
 *
 * @fontosdk
 *
 * @category add-on/fontoxml-table-flow-xhtml
 *
 * @param  {Object}          sxModule
 * @param  {Object}          [options]
 * @param  {number}          [options.priority]                          Selector priority for all elements configured by this function
 * @param  {boolean}         [options.showInsertionWidget]               To add insertion buttons which insert a column or a row to a specific place, default false.
 * @param  {boolean}         [options.showHighlightingWidget]            To add highlighting bars which highlight columns and rows, and provide operations popover, default false.
 * @param  {Widget[]|null}   [options.columnBefore]                      To add one or multiple
 * widgets before each column. Column widgets are linked to the col elements or the cells in the
 * first row in cases `shouldCreateColumnSpecificationNodes` is set to `false`. Tables that do
 * not have these elements will not show `columnBefore` widgets.
 * {@link fonto-documentation/docs/editor/api/index.xml#id-9d2b1ad5-bbc1-6c44-d491-16dc213c53f2 | All widgets} are supported.
 * @param  {Widget[]|null}   [options.rowBefore]                         To add a single icon widget
 * before each row by using {@link createIconWidget}. Row widgets are linked to the row elements of
 * the table. Any widget can be added but only icon widget is supported.
 * @param  {Object[]|null}   [options.columnWidgetMenuOperations]        To configure table widget menu for columns. It accepts an array of {@link ContextualOperation}s, but only supports "name" and "contents" properties. It is allowed to have only one layer of menu.
 * @param  {Object[]|null}   [options.rowWidgetMenuOperations]           To configure table widget menu for rows. It accepts an array of {@link ContextualOperation}s, but only supports "name" and "contents" properties. It is allowed to have only one layer of menu.
 * @param  {boolean}         [options.useTh]                             Set to true if th should be used
 * @param  {boolean}         [options.useThead]                          Set to true if thead should be used
 * @param  {boolean}         [options.useTbody]                          Set to true if tbody should be used
 * @param  {boolean}         [options.useBorders=true]                   Set to false if the borders attribute should not be used
 * @param  {boolean}         [options.shouldCreateColumnSpecificationNodes=false] Set to true if the table should include <col> elements by default
 * @param  {Object}          [options.table]                             Options for the table element
 * @param  {XPathTest}       [options.table.tableFilterSelector]         An optional additional selector for the table which will be used to refine whether a table element should be considered as an xhtml table
 * @param  {string}          [options.table.namespaceURI='']             The namespace URI for this table
 * @param  {Object}          [options.td]                                Configuration options for the td element
 * @param  {string}          [options.td.defaultTextContainer]           The default text container for the td element
 * @param  {Object}          [options.th]                                Configuration options for the th element
 * @param  {string}          [options.th.defaultTextContainer]           The default text container for the th element
 * @param  {boolean}         [options.useDefaultContextMenu=true]        Whether or not to use a preconfigured context menu for elements within the table
 * @param  {cellStylingTranslationQuery} [options.cellStylingTranslationQuery] An {@link XPathQuery} that should return the styling for the cell. For more details see {@link cellStylingTranslationQuery}.
 * @param  {XPathQuery}      [options.isCollapsibleQuery=false()]        The {@link XPathQuery} to determine whether or not a table has the ability to be collapsible. Optional, defaults to 'false()'. $rowCount and $columnCount helper variables can optionally be used in this XPath expression which evaluate to the total rows and total columns in a table.
 * @param  {XPathQuery}      [options.isInitiallyCollapsedQuery=true()]  The {@link XPathQuery} to determine whether or not a table should initially start off as collapsed. Tables must first have the ability to be collapsible with isCollapsibleQuery. Optional, defaults to 'true()'. $rowCount and $columnCount helper variables can optionally be used in this XPath expression which evaluate to the total rows and total columns in a table.
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

/**
 * @typedef  {XPathQuery}  cellStylingTranslationQuery
 *
 * @fontosdk
 *
 * @description
 *
 * An XPath query which you can use to style the background color and the borders of a cell.
 * For example if you have a style attribute on your cell node, then you can use this query to translate
 * the properties on that attribute to actual styling on the cell.
 *
 * Note that cellStylingTranslationQuery does not work together with any of the other border options
 * in the `XhtmlTableDefinition`. So you need to pay extra attention to a few points:
 * - We provide `cellNode` in the query as the first parameter but you can set the borders correctly
 * according to the attributes of cell node and/or even table node.
 * - When you have cellStylingTranslationQuery, there will be no border around the table. If your
 * table has surrounding border, you should set borders to the cells on the edge of your table. The
 * second parameter of the cellStylingTranslationQuery is `tableEdge` and it consists of the
 * information regarding the cell is on top, right, bottom and left edge or not:
 * ```
 * map {
 *     "topEdge": true(),
 *     "rightEdge": true(),
 *     "bottomEdge": false(),
 *     "leftEdge": false(),
 * }
 * ```
 * - If you want your newly inserted table to have a default type of border, you need to update your
 * table insertion operation.
 * - When you have cellStylingTranslationQuery, there is no use of the buttons to change borders
 * in the default table context menu and the
 * {@link fonto-documentation/docs/editor/api/componentTableToolbar.xml} and we hide them
 * by default.
 *
 * ## Example
 *
 * ```
 * declare %public function app:evaluateBorderStyle(
 * 	$style as xs:string?,
 * 	$width as xs:string?,
 * 	$isEdge as xs:boolean,
 * 	$hasTableBorder as xs:boolean
 * ) as map(*) {
 * 	if ((not($style) or ($style = "none" and $isEdge)) and $hasTableBorder)
 * 		then map {
 * 			"width": "1px",
 * 			"style": "ridge"
 * 		}
 * 		else map {
 * 			"width": $width,
 * 			"style": $style
 * 		}
 * };
 *
 * declare %public function app:cellStylingTranslationQuery(
 * 	$cellNode as node(),
 * 	$tableEdges as map(xs:string, xs:boolean)
 * ) as map(*) {
 * 	let $hasTableBorder := number($cellNode/ancestor::table/@border) = 1
 * 	let $styles := app:parseStyleAttribute(string($cellNode/@style))
 * 	return map {
 * 		"borderTop": app:evaluateBorderStyle(
 * 			$styles("border-top-style"),
 * 			$styles("border-top-width"),
 * 			$tableEdges?topEdge,
 * 			$hasTableBorder
 * 		),
 * 		"borderBottom": app:evaluateBorderStyle(
 * 			$styles("border-bottom-style"),
 * 			$styles("border-bottom-width"),
 * 			$tableEdges?bottomEdge,
 * 			$hasTableBorder
 * 		),
 * 		"borderLeft": app:evaluateBorderStyle(
 * 			$styles("border-left-style"),
 * 			$styles("border-left-width"),
 * 			$tableEdges?leftEdge,
 * 			$hasTableBorder
 * 		),
 * 		"borderRight": app:evaluateBorderStyle(
 * 			$styles("border-right-style"),
 * 			$styles("border-right-width"),
 * 			$tableEdges?rightEdge,
 * 			$hasTableBorder
 * 		),
 * 		"backgroundColor": if( tokenize($styles("background-color"), ',\s*') => string-join(',') = ("#000000", 'rgb(128,128,128)') )
 * 			then if( $styles("background-color") = "#000000")
 * 				then "rgba(0, 0, 0, 0.3)" (:~ color compatible with Fonto ~:)
 * 				else "rgba(128, 128, 128, 0.4)") (:~ color compatible with Fonto ~:)
 * 			else
 * 				$styles("background-color")
 * 	}
 * };
 *
 * (: For if you use the same attribute as in the example above, here we will also give an example on parsing the style attribute: :)
 *
 * declare variable  $styleOptions := ('none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset');
 *
 * declare %private function app:splitBorderProperty($name as xs:string, $style as xs:string) {
 * 	let $properties := tokenize($style, '\s+')[not(. = '')]
 * 	let $borderStyleValue := $properties[. = $styleOptions][1]
 * 	let $borderWidthValue := $properties[ends-with(., 'px')][1]
 * 	let $borderStyle := if ($borderStyleValue) then map:entry(concat($name, '-style'), $borderStyleValue) else ()
 * 	let $borderWidth := if ($borderWidthValue) then map:entry(concat($name, '-width'), $borderWidthValue) else ()
 * 	return ($borderStyle, $borderWidth)
 * };
 *
 * (: All stylings related to {@link https://developer.mozilla.org/en-US/docs/Web/CSS/border borders}
 * will be parsed to a map which its key is border-{top/right/bottom/left}-{style/width} and its
 * value is the related border value. The stylings other than borders will be parsed as a
 * key and a value pair directly. :)
 * declare %public function app:parseStyleAttribute($style as xs:string) as map(*) {
 * 	let $properties := tokenize($style, ';\s*')[not(. = '') and contains(., ":")]
 * 	return map:merge(for $style in reverse($properties) return
 * 		let $key := normalize-space(substring-before($style, ":"))
 * 		let $value := normalize-space(substring-after($style, ":"))
 * 		return if ($key = "border-style")
 * 			then (map:entry("border-top-style", $value),
 * 				map:entry("border-bottom-style", $value),
 * 				map:entry("border-left-style", $value),
 * 				map:entry("border-right-style", $value))
 * 			else if ($key = "border-width")
 * 			then (map:entry("border-top-width", $value),
 * 				map:entry("border-bottom-width", $value),
 * 				map:entry("border-left-width", $value),
 * 				map:entry("border-right-width", $value))
 * 			else if ($key = "border")
 * 			then (app:splitBorderProperty("border-top", $value),
 * 				app:splitBorderProperty("border-bottom", $value),
 * 				app:splitBorderProperty("border-left", $value),
 * 				app:splitBorderProperty("border-right", $value))
 * 			else if ($key = ("border-top", "border-bottom", "border-left", "border-right"))
 * 				then app:splitBorderProperty($key, $value)
 * 				else map:entry($key, $value)
 * 	)
 * };
 * ```
 *
 * @param {node()} cellNode
 * @return {configureAsXhtmlTableElements~cellStylingOptions} The options, that you can use to style the cell
 */

/**
 *
 * @typedef   {Object}  cellStylingOptions
 * @memberof  configureAsXhtmlTableElements
 * @inner
 *
 * @property  {string}   backgroundColor  For the background color you can use any color value CSS allows.
 *                You do need to make sure that the color has enough contrast with your text color.
 *                To check if your contrast ratio is high enough, you can use https://webaim.org/resources/contrastchecker/.
 *                It should at least pass AA. If the contrast ratio isn’t high enough, you can either
 *                change the lightness or decrease the opacity of your original color.
 * @property  {configureAsXhtmlTableElements~styleAndWidth}   borderTop Set the style and/or width of your top border
 * @property  {configureAsXhtmlTableElements~styleAndWidth}   borderBottom Set the style and/or width of your bottom border
 * @property  {configureAsXhtmlTableElements~styleAndWidth}   borderLeft Set the style and/or width of your left border
 * @property  {configureAsXhtmlTableElements~styleAndWidth}   borderRight Set the style and/or width of your right border
 *
 * @fontosdk  members
 */

/**
 *
 * @typedef   {Object}  styleAndWidth
 * @memberof  configureAsXhtmlTableElements
 * @inner
 *
 * @property  {string}   style The border style, only the values: 'solid',
 *             'dashed', 'dotted', 'double', 'ridge', 'groove', 'outset', 'inset', 'none'.
 *              This is similar to the options in css, except 'hidden' is not part of it.
 * @property  {string}   width The border width, only the values '1px', '2px', '3px', '4px' and '5px' are allowed.
 *
 * @fontosdk  members
 */
