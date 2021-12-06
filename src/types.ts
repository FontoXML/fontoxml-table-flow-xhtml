import type { XPathQuery } from 'fontoxml-selectors/src/types';

/**
 * @remarks
 * An XPath query which you can use to style the background color and the borders
 * of a cell. For example if you have a style attribute on your cell node, then you
 * can use this query to translate the properties on that attribute to actual
 * styling on the cell.
 *
 * Note that cellStylingTranslationQuery does not work together with any of the
 * other border options in the `XhtmlTableDefinition`. So you need to pay extra
 * attention to a few points:
 *
 * - We provide `cellNode` in the query as the first parameter but you can set the
 *   borders correctly according to the attributes of cell node and/or even table
 *   node.
 * - When you have cellStylingTranslationQuery, there will be no border around the
 *   table. If your table has surrounding border, you should set borders to the
 *   cells on the edge of your table. The second parameter of the
 *   cellStylingTranslationQuery is `tableEdge` and it consists of the information
 *   regarding the cell is on top, right, bottom and left edge or not:
 *
 * ```
 * map {
 *     "topEdge": true(),
 *     "rightEdge": true(),
 *     "bottomEdge": false(),
 *     "leftEdge": false(),
 * }
 * ```
 *
 * - If you want your newly inserted table to have a default type of border, you
 *   need to update your table insertion operation.
 * - When you have cellStylingTranslationQuery, there is no use of the buttons to
 *   change borders in the default table context menu and the {@link TableToolbar}
 *   and we hide them by default.
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
 * 	let $hasTableBorder := number($cellNode/ancestor::table[1]/@border) = 1
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
 * (: All stylings related to {@link https://developer.mozilla.org/en-US/docs/Web/CSS/border | borders}
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
 * @fontosdk
 *
 * @param cellNode -
 *
 * @returns The options, that you can use to style the cell
 */
export type cellStylingTranslationQuery = XPathQuery;

/**
 * @fontosdk
 */
export type CellStylingOptions = {
	/**
	 * @remarks
	 * For the background color you can use any color value CSS allows. You do need to
	 * make sure that the color has enough contrast with your text color. To check if
	 * your contrast ratio is high enough, you can use
	 * https://webaim.org/resources/contrastchecker/. It should at least pass AA. If
	 * the contrast ratio isn’t high enough, you can either change the lightness or
	 * decrease the opacity of your original color.
	 *
	 * @fontosdk
	 */
	backgroundColor: string;
	/**
	 * @remarks
	 * Set the style and/or width of your top border
	 *
	 * @fontosdk
	 */
	borderTop: CellBorderStylingOptions;
	/**
	 * @remarks
	 * Set the style and/or width of your bottom border
	 *
	 * @fontosdk
	 */
	borderBottom: CellBorderStylingOptions;
	/**
	 * @remarks
	 * Set the style and/or width of your left border
	 *
	 * @fontosdk
	 */
	borderLeft: CellBorderStylingOptions;
	/**
	 * @remarks
	 * Set the style and/or width of your right border
	 *
	 * @fontosdk
	 */
	borderRight: CellBorderStylingOptions;
};

/**
 * @fontosdk
 */
export type CellBorderStylingOptions = {
	/**
	 * @remarks
	 * The border style, only the values: 'solid', 'dashed', 'dotted', 'double',
	 * 'ridge', 'groove', 'outset', 'inset', 'none'. This is similar to the options in
	 * css, except 'hidden' is not part of it.
	 *
	 * @fontosdk
	 */
	style:
		| 'dashed'
		| 'dotted'
		| 'double'
		| 'groove'
		| 'inset'
		| 'none'
		| 'outset'
		| 'ridge'
		| 'solid';
	/**
	 * @remarks
	 * The border width, only the values '1px', '2px', '3px', '4px' and '5px' are
	 * allowed.
	 *
	 * @fontosdk
	 */
	width: '1px' | '2px' | '3px' | '4px' | '5px';
};
