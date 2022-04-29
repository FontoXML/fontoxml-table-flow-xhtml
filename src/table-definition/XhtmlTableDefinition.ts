import makeOrExpression from 'fontoxml-selectors/src/makeOrExpression';
import xq, { ensureXQExpression } from 'fontoxml-selectors/src/xq';
import createCreateCellNodeStrategy from 'fontoxml-table-flow/src/createCreateCellNodeStrategy';
import createCreateColumnSpecificationNodeStrategy from 'fontoxml-table-flow/src/createCreateColumnSpecificationNodeStrategy';
import createCreateRowStrategy from 'fontoxml-table-flow/src/createCreateRowStrategy';
import {
	createGetValueAsBooleanStrategy,
	createGetValueAsStringStrategy,
} from 'fontoxml-table-flow/src/getSpecificationValueStrategies';
import {
	createConvertFormerHeaderCellNodeStrategy,
	createConvertHeaderCellNodeStrategy,
} from 'fontoxml-table-flow/src/normalizeCellNodeStrategies';
import {
	createAddBodyContainerNodeStrategy,
	createAddHeaderContainerNodeStrategy,
	createRemoveBodyContainerNodeStrategy,
	createRemoveFooterContainerNodeStrategy,
	createRemoveHeaderContainerNodeStrategy,
} from 'fontoxml-table-flow/src/normalizeContainerNodeStrategies';
import {
	createBooleanValueAsAttributeStrategy,
	createColumnSpanAsAttributeStrategy,
	createRowSpanAsAttributeStrategy,
	createStringValueAsAttributeStrategy,
} from 'fontoxml-table-flow/src/setAttributeStrategies';
import TableDefinition from 'fontoxml-table-flow/src/TableDefinition';
import type {
	TableDefinitionProperties,
	TableElementsSharedOptions,
} from 'fontoxml-table-flow/src/types';

import type { TableElementsXhtmlOptions } from '../types';

function parseWidth(width: string): number | null {
	const widthPart = /^(\d+(?:\.\d+)?)[%*]$/.exec(width);
	if (widthPart === null) {
		return null;
	}
	const float = parseFloat(widthPart[1]);
	return Number.isNaN(float) ? null : float;
}

/**
 * @remarks
 * Configures the table definition for XHTML tables.
 */
class XhtmlTableDefinition extends TableDefinition {
	/**
	 * @param options -
	 */
	public constructor(
		options: TableElementsSharedOptions & TableElementsXhtmlOptions
	) {
		const useThead = !!options.useThead;
		const useTbody = !!options.useTbody;
		let useTh = !!options.useTh;
		const useBorders =
			options.useBorders !== false &&
			!options.cellStylingTranslationQuery;
		const shouldCreateColumnSpecificationNodes =
			!!options.shouldCreateColumnSpecificationNodes;
		const columnWidthType = options.columnWidthType || 'none'; // ' percentual' | 'relative' | 'none'

		// Warn the developer that columnWidthType is specified without shouldCreateColumnSpecificationNodes set to true.
		if (
			columnWidthType !== 'none' &&
			!shouldCreateColumnSpecificationNodes
		) {
			throw new Error(
				'XHTML table: using columnWidthType requires shouldCreateColumnSpecificationNodes to be true.'
			);
		}

		// Warn the developer that thead is used as header-defining element. This is required when
		// using tbody.
		if (useTbody && !useThead && options.useThead !== undefined) {
			throw new Error(
				'XHTML table: Using tbody requires the use of thead.'
			);
		}

		// Warn the developer that th is being used as header-defining element. At least one header
		// type is required.
		if (
			!useThead &&
			!useTh &&
			options.useThead !== undefined &&
			options.useTh !== undefined
		) {
			throw new Error(
				'XHTML table: At least one header type (th or thead) muse be used.'
			);
		}

		if (!useThead && !useTh) {
			useTh = true;
		}

		const namespaceURI =
			options.table && options.table.namespaceURI
				? options.table.namespaceURI
				: '';

		const tablePartSelectors = {
			table: xq`${ensureXQExpression(`self::Q{${namespaceURI}}table`)}[${
				options.table && options.table.tableFilterSelector
					? ensureXQExpression(options.table.tableFilterSelector)
					: xq`true()`
			}]`,
			headerContainer: ensureXQExpression(
				`self::Q{${namespaceURI}}thead`
			),
			bodyContainer: ensureXQExpression(`self::Q{${namespaceURI}}tbody`),
			footerContainer: ensureXQExpression(
				`self::Q{${namespaceURI}}tfoot`
			),
			row: ensureXQExpression(`self::Q{${namespaceURI}}tr`),
			cell: ensureXQExpression(`self::Q{${namespaceURI}}td`),
			headerCell: ensureXQExpression(`self::Q{${namespaceURI}}th`),
			columnSpecificationGroup: ensureXQExpression(
				`self::Q{${namespaceURI}}colgroup`
			),
			columnSpecification: ensureXQExpression(
				`self::Q{${namespaceURI}}col`
			),
			caption: ensureXQExpression(
				`self::Q{${namespaceURI}}caption[parent::Q{${namespaceURI}}table]`
			),
		};

		// Alias selector parts
		const table = tablePartSelectors.table;
		const thead = tablePartSelectors.headerContainer;
		const tbody = tablePartSelectors.bodyContainer;
		const tfoot = tablePartSelectors.footerContainer;
		const tr = tablePartSelectors.row;
		const td = tablePartSelectors.cell;
		const th = tablePartSelectors.headerCell;
		const col = tablePartSelectors.columnSpecification;
		const colGroup = tablePartSelectors.columnSpecificationGroup;

		const tableNodesSelector = makeOrExpression([
			col,
			colGroup,
			tr,
			thead,
			tbody,
			tfoot,
		]);

		const properties: TableDefinitionProperties = {
			tablePartSelectors,

			supportsBorders: useBorders,

			supportsCellAlignment: true,

			supportsRowSpanningCellsAtBottom: true,

			// Defining node selectors
			tablePartsNodeSelector: makeOrExpression(
				Object.keys(tablePartSelectors)
					.filter((selector) => selector !== 'caption')
					.map((key) => tablePartSelectors[key])
			),
			// Header row node selector
			headerRowNodeSelector: xq`${tr}[parent::*[${thead}] or not(child::*[${td}])]`,

			// Finds
			findHeaderRowNodesXPathQuery: xq`
            child::*[${thead}]/child::*[${tr}], child::*[${tr}[child::*[${td}]]][1]/preceding-sibling::*[${tr}]`,
			findBodyRowNodesXPathQuery: xq`
            if (child::*[${tbody}])
                then child::*[${tbody}]/child::*[${tr}]
                else let $firstBodyRow := child::*[${tr}[child::*[${td}]]][1]
                    return ($firstBodyRow, $firstBodyRow/following-sibling::*[${tr}])`,
			findFooterRowNodesXPathQuery: xq`if (child::*[${tfoot}]) then child::*[${tfoot}]/child::*[${tr}] else ()`,

			findHeaderContainerNodesXPathQuery: xq`child::*[${thead}]`,
			findBodyContainerNodesXPathQuery: xq`child::*[${tbody}]`,
			findFooterContainerNodesXPathQuery: xq`child::*[${tfoot}]`,

			findColumnSpecificationNodesXPathQuery: xq`child::*[${col}]`,

			findCellNodesXPathQuery: xq`child::*[${td} or ${th}]`,

			findNonTableNodesPrecedingRowsXPathQuery: xq`child::*[(${tableNodesSelector}) => not() and following-sibling::*[${tableNodesSelector}]]`,

			// Data
			getNumberOfColumnsXPathQuery: xq`let $firstRow :=
                    if (child::*[${thead}]/child::*[${tr}]) then head(child::*[${thead}]/child::*[${tr}])
                    else if (child::*[${tbody}]/child::*[${tr}]) then head(child::*[${tbody}]/child::*[${tr}])
                    else head(child::*[${tr}]),
                $cells := $firstRow/child::*[${td} | ${th}]
                return (for $node in $cells return let $colspan := $node/@colspan => number() return if ($colspan) then $colspan else 1) => sum()`,
			getRowSpanForCellNodeXPathQuery: xq`let $rowspan := ./@rowspan return if ($rowspan) then $rowspan => number() else 1`,
			getColumnSpanForCellNodeXPathQuery: xq`let $colspan := ./@colspan return if ($colspan) then $colspan => number() else 1`,
			cellStylingTranslationQuery:
				options.cellStylingTranslationQuery &&
				ensureXQExpression(options.cellStylingTranslationQuery),

			// Normalizations
			normalizeContainerNodeStrategies: [
				useThead
					? createAddHeaderContainerNodeStrategy(
							namespaceURI,
							'thead'
					  )
					: createRemoveHeaderContainerNodeStrategy(),
				useTbody
					? createAddBodyContainerNodeStrategy(namespaceURI, 'tbody')
					: createRemoveBodyContainerNodeStrategy(),
				createRemoveFooterContainerNodeStrategy(),
			],

			normalizeCellNodeStrategies: [
				useTh
					? createConvertHeaderCellNodeStrategy(namespaceURI, 'th')
					: createConvertHeaderCellNodeStrategy(namespaceURI, 'td'),
				createConvertFormerHeaderCellNodeStrategy(namespaceURI, 'td'),
			],

			// Creates
			createCellNodeStrategy: createCreateCellNodeStrategy(
				namespaceURI,
				'td'
			),
			createRowStrategy: createCreateRowStrategy(namespaceURI, 'tr'),
			createColumnSpecificationNodeStrategy:
				shouldCreateColumnSpecificationNodes
					? createCreateColumnSpecificationNodeStrategy(
							namespaceURI,
							'col',
							xq`./*[${thead} or ${tbody} or ${tr}]`
					  )
					: undefined,

			// Specification
			getTableSpecificationStrategies: useBorders
				? [
						createGetValueAsBooleanStrategy(
							'borders',
							xq`./@border = "1"`
						),
				  ]
				: [],

			getCellSpecificationStrategies: [
				createGetValueAsStringStrategy('characterAlignment', './@char'),
				createGetValueAsStringStrategy(
					'horizontalAlignment',
					xq`./@align`
				),
				createGetValueAsStringStrategy(
					'verticalAlignment',
					xq`./@valign`
				),
				...(useBorders
					? [
							createGetValueAsBooleanStrategy(
								'columnSeparator',
								xq`./ancestor::*[${table}][1]/@border = "1"`
							),
							createGetValueAsBooleanStrategy(
								'rowSeparator',
								xq`./ancestor::*[${table}][1]/@border = "1"`
							),
					  ]
					: []),
			],

			// Set attributes
			setTableNodeAttributeStrategies: useBorders
				? [
						createBooleanValueAsAttributeStrategy(
							'border',
							'borders',
							null,
							'1',
							'0'
						),
				  ]
				: [],

			setCellNodeAttributeStrategies: [
				createRowSpanAsAttributeStrategy('rowspan'),
				createColumnSpanAsAttributeStrategy('colspan'),
				createStringValueAsAttributeStrategy(
					'char',
					'characterAlignment'
				),
				createStringValueAsAttributeStrategy(
					'align',
					'horizontalAlignment'
				),
				createStringValueAsAttributeStrategy(
					'valign',
					'verticalAlignment'
				),
			],

			getColumnSpecificationStrategies: [
				createGetValueAsStringStrategy(
					'horizontalAlignment',
					'./@align'
				),
				createGetValueAsStringStrategy(
					'verticalAlignment',
					'./@valign'
				),
			],
			setColumnSpecificationNodeAttributeStrategies: [],

			// Widths
			widthToHtmlWidthStrategy(width, widths) {
				if (columnWidthType === 'none') {
					return '';
				}

				const proportion = parseWidth(width) || 1;
				const totalProportion = widths.reduce(
					(total: number, proportion) =>
						total + parseWidth(proportion) || 1,
					0
				);

				return `${(100 * proportion) / totalProportion}%`;
			},
			addWidthsStrategy(width1, width2) {
				if (columnWidthType === 'none') {
					return '';
				}

				const parsedWidth1 = parseWidth(width1);
				const proportion1 = parsedWidth1 || 0;

				const parsedWidth2 = parseWidth(width2);
				const proportion2 = parsedWidth2 || 0;

				const proportion = proportion1 + proportion2;

				return proportion !== 0
					? `${proportion}${
							columnWidthType === 'percentual' ? '%' : '*'
					  }`
					: '';
			},
			divideByTwoStrategy(width) {
				if (columnWidthType === 'none') {
					return '';
				}
				const parsedWidth = parseWidth(width);

				if (!parsedWidth) {
					return '';
				}

				const proportion = parsedWidth;

				return proportion !== 0
					? `${proportion / 2}${
							columnWidthType === 'percentual' ? '%' : '*'
					  }`
					: '';
			},
			widthsToFractionsStrategy(widths: string[]): number[] {
				const parsedWidths = widths.map(parseWidth);

				if (parsedWidths.includes(null)) {
					const newWidth = 1 / parsedWidths.length;
					return parsedWidths.map(() => newWidth);
				}

				const totalWidth = parsedWidths.reduce(
					(total: number, width) => total + width,
					0
				);

				return parsedWidths.map((width) => width / totalWidth);
			},
			normalizeColumnWidthsStrategy(columnWidths: string[]): string[] {
				if (columnWidthType === 'none') {
					return '';
				}
				if (!columnWidthType) {
					return columnWidths.map((_) => '');
				}
				if (columnWidthType === 'relative') {
					const relativeWidths = columnWidths.map(
						(relative) => `${parseFloat(relative)}*`
					);
					return relativeWidths;
				}
				const ratios = columnWidths.map((percentage) =>
					parseFloat(percentage)
				);
				const total = ratios.reduce(
					(total: number, columnWidth) => total + columnWidth,
					0
				);
				return ratios.map(
					(ratio) => `${((ratio / total) * 100).toFixed(4)}%`
				);
			},
			fractionsToWidthsStrategy(fractions): string[] {
				if (columnWidthType === 'none') {
					return [];
				}
				if (columnWidthType === 'percentual') {
					return fractions.map(
						(fraction) => `${(fraction * 100).toFixed(2)}%`
					);
				}
				return fractions.map(
					(fraction) => `${(fraction * 100).toFixed(2)}*`
				);
			},

			// Deprecated
			columnWidgetMenuOperations: options.columnWidgetMenuOperations,
			rowWidgetMenuOperations: options.rowWidgetMenuOperations,
			// Widget menu operations
			columnsWidgetMenuOperations:
				options.columnsWidgetMenuOperations || [
					{
						contents: [
							{
								name: 'xhtml-set-cell-horizontal-alignment-left',
							},
							{
								name: 'xhtml-set-cell-horizontal-alignment-center',
							},
							{
								name: 'xhtml-set-cell-horizontal-alignment-right',
							},
							{
								name: 'xhtml-set-cell-horizontal-alignment-justify',
							},
						],
					},
					{
						contents: [
							{
								name: 'xhtml-set-cell-vertical-alignment-top',
							},
							{
								name: 'xhtml-set-cell-vertical-alignment-center',
							},
							{
								name: 'xhtml-set-cell-vertical-alignment-bottom',
							},
						],
					},
					{ contents: [{ name: 'columns-delete' }] },
				],
			rowsWidgetMenuOperations: options.rowsWidgetMenuOperations || [
				{
					contents: [
						{
							name: 'xhtml-set-cell-horizontal-alignment-left',
						},
						{
							name: 'xhtml-set-cell-horizontal-alignment-center',
						},
						{
							name: 'xhtml-set-cell-horizontal-alignment-right',
						},
						{
							name: 'xhtml-set-cell-horizontal-alignment-justify',
						},
					],
				},
				{
					contents: [
						{
							name: 'xhtml-set-cell-vertical-alignment-top',
						},
						{
							name: 'xhtml-set-cell-vertical-alignment-center',
						},
						{
							name: 'xhtml-set-cell-vertical-alignment-bottom',
						},
					],
				},
				{ contents: [{ name: 'rows-delete' }] },
			],
		};

		if (columnWidthType !== 'none') {
			properties.getColumnSpecificationStrategies.push(
				createGetValueAsStringStrategy('columnWidth', './@width')
			);
			properties.setColumnSpecificationNodeAttributeStrategies.push(
				createStringValueAsAttributeStrategy('width', 'columnWidth')
			);
		}

		super(properties);
	}
}

export default XhtmlTableDefinition;
