import createCreateCellNodeStrategy from 'fontoxml-table-flow/src/createCreateCellNodeStrategy';
import createCreateColumnSpecificationNodeStrategy from 'fontoxml-table-flow/src/createCreateColumnSpecificationNodeStrategy';
import createCreateRowStrategy from 'fontoxml-table-flow/src/createCreateRowStrategy';
import getSpecificationValueStrategies from 'fontoxml-table-flow/src/getSpecificationValueStrategies';
import normalizeCellNodeStrategies from 'fontoxml-table-flow/src/normalizeCellNodeStrategies';
import normalizeContainerNodeStrategies from 'fontoxml-table-flow/src/normalizeContainerNodeStrategies';
import setAttributeStrategies from 'fontoxml-table-flow/src/setAttributeStrategies';
import TableDefinition from 'fontoxml-table-flow/src/TableDefinition';
import type { XhtmlTableOptions } from 'fontoxml-typescript-migration-debt/src/types';

function parseWidth(width: $TSFixMeAny): $TSFixMeAny {
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
	constructor(options: XhtmlTableOptions) {
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

		const namespaceSelector = `Q{${namespaceURI}}`;
		const selectorParts = {
			table: `${namespaceSelector}table${
				options.table && options.table.tableFilterSelector
					? `[${options.table.tableFilterSelector}]`
					: ''
			}`,
			headerContainer: `${namespaceSelector}thead`,
			bodyContainer: `${namespaceSelector}tbody`,
			footerContainer: `${namespaceSelector}tfoot`,
			row: `${namespaceSelector}tr`,
			cell: `${namespaceSelector}td`,
			headerCell: `${namespaceSelector}th`,
			columnSpecificationGroup: `${namespaceSelector}colgroup`,
			columnSpecification: `${namespaceSelector}col`,
			caption: `${namespaceSelector}caption[parent::${namespaceSelector}table]`,
		};

		// Alias selector parts
		const table = selectorParts.table;
		const thead = selectorParts.headerContainer;
		const tbody = selectorParts.bodyContainer;
		const tfoot = selectorParts.footerContainer;
		const tr = selectorParts.row;
		const td = selectorParts.cell;
		const th = selectorParts.headerCell;
		const col = selectorParts.columnSpecification;
		const colGroup = selectorParts.columnSpecificationGroup;

		const tableNodesSelector = `self::${col} or self::${colGroup} or self::${tr} or self::${thead} or self::${tbody} or self::${tfoot}`;

		const properties = {
			selectorParts,

			supportsBorders: useBorders,

			supportsCellAlignment: true,

			supportsRowSpanningCellsAtBottom: true,

			shouldCreateColumnSpecificationNodes,

			// Defining node selectors
			tablePartsNodeSelector: Object.keys(selectorParts)
				.filter((selector) => selector !== 'caption')
				.map((key) => `self::${selectorParts[key]}`)
				.join(' or '),

			// Header row node selector
			headerRowNodeSelector: `self::${tr}[parent::${thead} or not(child::${td})]`,

			// Finds
			findHeaderRowNodesXPathQuery: `
            ./${thead}/${tr}, ./${tr}[${td}][1]/preceding-sibling::${tr}`,
			findBodyRowNodesXPathQuery: `
            if (./${tbody})
                then ./${tbody}/${tr}
                else let $firstBodyRow := ./${tr}[${td}][1]
                    return ($firstBodyRow, $firstBodyRow/following-sibling::${tr})`,
			findFooterRowNodesXPathQuery: `if (./${tfoot}) then ./${tfoot}/${tr} else ()`,

			findHeaderContainerNodesXPathQuery: `./${thead}`,
			findBodyContainerNodesXPathQuery: `./${tbody}`,
			findFooterContainerNodesXPathQuery: `./${tfoot}`,

			findColumnSpecificationNodesXPathQuery: `./${col}`,

			findCellNodesXPathQuery: `child::*[self::${td} or self::${th}]`,

			findNonTableNodesPrecedingRowsXPathQuery: `./*[(${tableNodesSelector}) => not() and following-sibling::*[${tableNodesSelector}]]`,

			// Data
			getNumberOfColumnsXPathQuery: `let $firstRow :=
                    if (./${thead}/${tr}) then head(./${thead}/${tr})
                    else if (./${tbody}/${tr}) then head(./${tbody}/${tr})
                    else head(./${tr}),
                $cells := $firstRow/*[self::${td} | self::${th}]
                return (for $node in $cells return let $colspan := $node/@colspan => number() return if ($colspan) then $colspan else 1) => sum()`,
			getRowSpanForCellNodeXPathQuery:
				'let $rowspan := ./@rowspan return if ($rowspan) then $rowspan => number() else 1',
			getColumnSpanForCellNodeXPathQuery:
				'let $colspan := ./@colspan return if ($colspan) then $colspan => number() else 1',
			cellStylingTranslationQuery:
				options.cellStylingTranslationQuery || '',

			// Normalizations
			normalizeContainerNodeStrategies: [
				useThead
					? normalizeContainerNodeStrategies.createAddHeaderContainerNodeStrategy(
							namespaceURI,
							'thead'
					  )
					: normalizeContainerNodeStrategies.createRemoveHeaderContainerNodeStrategy(),
				useTbody
					? normalizeContainerNodeStrategies.createAddBodyContainerNodeStrategy(
							namespaceURI,
							'tbody'
					  )
					: normalizeContainerNodeStrategies.createRemoveBodyContainerNodeStrategy(),
				normalizeContainerNodeStrategies.createRemoveFooterContainerNodeStrategy(),
			],

			normalizeCellNodeStrategies: [
				useTh
					? normalizeCellNodeStrategies.createConvertHeaderCellNodeStrategy(
							namespaceURI,
							'th'
					  )
					: normalizeCellNodeStrategies.createConvertHeaderCellNodeStrategy(
							namespaceURI,
							'td'
					  ),
				normalizeCellNodeStrategies.createConvertFormerHeaderCellNodeStrategy(
					namespaceURI,
					'td'
				),
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
							`./*[self::${thead} or self::${tbody} or self::${tr}]`
					  )
					: undefined,

			// Specification
			getTableSpecificationStrategies: useBorders
				? [
						getSpecificationValueStrategies.createGetValueAsBooleanStrategy(
							'borders',
							'./@border = "1"'
						),
				  ]
				: [],

			getCellSpecificationStrategies: [
				getSpecificationValueStrategies.createGetValueAsStringStrategy(
					'characterAlignment',
					'./@char'
				),
				getSpecificationValueStrategies.createGetValueAsStringStrategy(
					'horizontalAlignment',
					'./@align'
				),
				getSpecificationValueStrategies.createGetValueAsStringStrategy(
					'verticalAlignment',
					'./@valign'
				),
			].concat(
				useBorders
					? [
							getSpecificationValueStrategies.createGetValueAsBooleanStrategy(
								'columnSeparator',
								`./ancestor::${table}[1]/@border = "1"`
							),
							getSpecificationValueStrategies.createGetValueAsBooleanStrategy(
								'rowSeparator',
								`./ancestor::${table}[1]/@border = "1"`
							),
					  ]
					: []
			),

			// Set attributes
			setTableNodeAttributeStrategies: useBorders
				? [
						setAttributeStrategies.createBooleanValueAsAttributeStrategy(
							'border',
							'borders',
							null,
							'1',
							'0'
						),
				  ]
				: [],

			setCellNodeAttributeStrategies: [
				setAttributeStrategies.createRowSpanAsAttributeStrategy(
					'rowspan'
				),
				setAttributeStrategies.createColumnSpanAsAttributeStrategy(
					'colspan'
				),
				setAttributeStrategies.createStringValueAsAttributeStrategy(
					'char',
					'characterAlignment'
				),
				setAttributeStrategies.createStringValueAsAttributeStrategy(
					'align',
					'horizontalAlignment'
				),
				setAttributeStrategies.createStringValueAsAttributeStrategy(
					'valign',
					'verticalAlignment'
				),
			],

			getColumnSpecificationStrategies: [
				getSpecificationValueStrategies.createGetValueAsStringStrategy(
					'horizontalAlignment',
					'./@align'
				),
				getSpecificationValueStrategies.createGetValueAsStringStrategy(
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
					(total, proportion) => total + parseWidth(proportion) || 1,
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
					? proportion +
							(columnWidthType === 'percentual' ? '%' : '*')
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
					? proportion / 2 +
							(columnWidthType === 'percentual' ? '%' : '*')
					: '';
			},
			widthsToFractionsStrategy(widths) {
				const parsedWidths = widths.map(parseWidth);

				if (parsedWidths.includes(null)) {
					const newWidth = 1 / parsedWidths.length;
					return parsedWidths.map(() => newWidth);
				}

				const totalWidth = parsedWidths.reduce(
					(total, width) => total + width,
					0
				);

				return parsedWidths.map((width) => width / totalWidth);
			},
			normalizeColumnWidthsStrategy(columnWidths) {
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
					(total, columnWidth) => total + columnWidth,
					0
				);
				return ratios.map(
					(ratio) => `${(ratio / total).toFixed(4) * 100}%`
				);
			},
			fractionsToWidthsStrategy(fractions) {
				if (columnWidthType === 'none') {
					return '';
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

			// Widget menu operations
			columnWidgetMenuOperations: options.columnWidgetMenuOperations || [
				{
					contents: [
						{
							name: 'contextual-xhtml-set-cell-horizontal-alignment-left',
						},
						{
							name: 'contextual-xhtml-set-cell-horizontal-alignment-center',
						},
						{
							name: 'contextual-xhtml-set-cell-horizontal-alignment-right',
						},
						{
							name: 'contextual-xhtml-set-cell-horizontal-alignment-justify',
						},
					],
				},
				{
					contents: [
						{
							name: 'contextual-xhtml-set-cell-vertical-alignment-top',
						},
						{
							name: 'contextual-xhtml-set-cell-vertical-alignment-center',
						},
						{
							name: 'contextual-xhtml-set-cell-vertical-alignment-bottom',
						},
					],
				},
				{ contents: [{ name: 'column-delete-at-index' }] },
			],
			rowWidgetMenuOperations: options.rowWidgetMenuOperations || [
				{
					contents: [
						{
							name: 'contextual-xhtml-set-cell-horizontal-alignment-left',
						},
						{
							name: 'contextual-xhtml-set-cell-horizontal-alignment-center',
						},
						{
							name: 'contextual-xhtml-set-cell-horizontal-alignment-right',
						},
						{
							name: 'contextual-xhtml-set-cell-horizontal-alignment-justify',
						},
					],
				},
				{
					contents: [
						{
							name: 'contextual-xhtml-set-cell-vertical-alignment-top',
						},
						{
							name: 'contextual-xhtml-set-cell-vertical-alignment-center',
						},
						{
							name: 'contextual-xhtml-set-cell-vertical-alignment-bottom',
						},
					],
				},
				{ contents: [{ name: 'contextual-row-delete' }] },
			],
		};

		if (columnWidthType !== 'none') {
			properties.getColumnSpecificationStrategies.push(
				getSpecificationValueStrategies.createGetValueAsStringStrategy(
					'columnWidth',
					'./@width'
				)
			);
			properties.setColumnSpecificationNodeAttributeStrategies.push(
				setAttributeStrategies.createStringValueAsAttributeStrategy(
					'width',
					'columnWidth'
				)
			);
		}

		super(properties);
	}
}

export default XhtmlTableDefinition;
