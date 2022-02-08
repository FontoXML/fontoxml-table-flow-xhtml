import configureAsBlock from 'fontoxml-families/src/configureAsBlock';
import type { SxModule } from 'fontoxml-modular-schema-experience/src/sxManager';
import { ensureXQExpression } from 'fontoxml-selectors/src/xq';
import configureAsTableElements from 'fontoxml-table-flow/src/configureAsTableElements';
import type { TableElementsSharedOptions } from 'fontoxml-table-flow/src/types';

import XhtmlTableDefinition from './table-definition/XhtmlTableDefinition';
import type { TableElementsXhtmlOptions } from './types';

/**
 * @remarks
 * Configure XHTML tables.
 *
 * Note that the `columnBefore` widgets are linked to col elements or the cells in
 * the first row in cases `shouldCreateColumnSpecificationNodes` is set to `false`.
 * If the `columnBefore` widgets are linked to the cells in the first row and there
 * is even one merged cell (to left or right) in the first row, the widgets in
 * `columnBefore` widgets are not rendered.
 *
 * Example usage for the table widgets:
 *
 * ```
 * configureAsXhtmlTableElements(sxModule, {
 * 	table: {
 * 		namespaceURI: 'http://docbook.org/ns/docbook',
 * 		tableFilterSelector: 'self::table and not(tgroup)'
 * 	},
 * 	td: {
 * 		defaultTextContainer: 'simpara'
 * 	}
 * 	columnBefore: [
 * 		createIconWidget('clock-o', {
 * 			clickOperation: 'lcTime-value-edit',
 * 			tooltipContent: 'Click here to edit the duration'
 * 		})
 * 	],
 * 	rowBefore: [
 * 		createIconWidget('dot-circle-o', {
 * 			clickOperation: 'do-nothing'
 * 		})
 * 	],
 * 	showInsertionWidget: true,
 * 	showSelectionWidget: true,
 * 	columnsWidgetMenuOperations: [
 *		{
 *			contents: [
 *				{ name: 'xhtml-set-cell-horizontal-alignment-left' },
 *				{ name: 'xhtml-set-cell-horizontal-alignment-center' },
 *				{ name: 'xhtml-set-cell-horizontal-alignment-right' },
 *				{ name: 'xhtml-set-cell-horizontal-alignment-justify' }
 *			]
 *		},
 *		{
 *			contents: [
 *				{ name: 'xhtml-set-cell-vertical-alignment-top' },
 *				{ name: 'xhtml-set-cell-vertical-alignment-center' },
 *				{ name: 'xhtml-set-cell-vertical-alignment-bottom' }
 *			]
 *		},
 *		{ contents: [{ name: 'columns-delete' }] }
 *	],
 *	rowsWidgetMenuOperations: [
 *		{
 *			contents: [
 *				{ name: 'xhtml-set-cell-horizontal-alignment-left' },
 *				{ name: 'xhtml-set-cell-horizontal-alignment-center' },
 *				{ name: 'xhtml-set-cell-horizontal-alignment-right' },
 *				{ name: 'xhtml-set-cell-horizontal-alignment-justify' }
 *			]
 *		},
 *		{
 *			contents: [
 *				{ name: 'xhtml-set-cell-vertical-alignment-top' },
 *				{ name: 'xhtml-set-cell-vertical-alignment-center' },
 *				{ name: 'xhtml-set-cell-vertical-alignment-bottom' }
 *			]
 *		},
 *		{ contents: [{ name: 'rows-delete' }] }
 *	],
 * 	cellStylingTranslationQuery: 'import module namespace app = "http://www.fontoxml.com/app"; app:cellStylingTranslationQuery(., $tableEdges)'
 * });
 * ```
 *
 * The cell element menu button widgets are added based on the existence of
 * contextual operations on cell level. Make sure that only cell-specific
 * operations are added to the cell widget, so that users are only given options
 * relevant to them. Check {@link
 * fonto-documentation/docs/configure/elements/configure-tables.xml#id-d8cde415-f9e0-ba0c-14a5-cdb5f92d647d
 * | our guide} for more information on table widgets.
 *
 * Example on how you can add this element menu on the widget:
 *
 * ```
 * configureProperties(sxModule, 'self::td', {
 * 	contextualOperations: [
 * 		{ name: 'contextual-set-total-cell', hideIn: ['context-menu'] }
 * 	]
 * });
 *
 * ```
 *
 * XHTML tables can also be configured to be collapsible. Refer to {@link
 * fonto-documentation/docs/configure/elements/configure-tables.xml#id-6c3f43af-b40c-4fa3-ab47-f0fd2d4ab85c
 * | our guide} to learn more.
 *
 * @fontosdk importable
 */
export default function configureAsXhtmlTableElements(
	sxModule: SxModule,
	options?: TableElementsSharedOptions & TableElementsXhtmlOptions
): void {
	options = options || {};
	const tableDefinition = new XhtmlTableDefinition(options);
	configureAsTableElements(sxModule, options, tableDefinition);
	const priority = options.priority;

	// Title (caption)
	const namespaceURI =
		options.table && options.table.namespaceURI
			? options.table.namespaceURI
			: '';
	configureAsBlock(
		sxModule,
		ensureXQExpression(
			`self::Q{${namespaceURI}}caption[parent::Q{${namespaceURI}}table]`
		),
		undefined,
		{
			priority,
		}
	);

	configureAsTableElements(
		sxModule,
		{
			...options,
			cell: options.td,
			headerCell: options.th,
		},
		tableDefinition
	);
}
