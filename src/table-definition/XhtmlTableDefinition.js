import TableDefinition from 'fontoxml-table-flow/src/TableDefinition.js';
import createCreateCellNodeStrategy from 'fontoxml-table-flow/src/createCreateCellNodeStrategy.js';
import createCreateRowStrategy from 'fontoxml-table-flow/src/createCreateRowStrategy.js';
import createCreateColumnSpecificationNodeStrategy from 'fontoxml-table-flow/src/createCreateColumnSpecificationNodeStrategy.js';
import getSpecificationValueStrategies from 'fontoxml-table-flow/src/getSpecificationValueStrategies.js';
import normalizeCellNodeStrategies from 'fontoxml-table-flow/src/normalizeCellNodeStrategies.js';
import normalizeContainerNodeStrategies from 'fontoxml-table-flow/src/normalizeContainerNodeStrategies.js';
import setAttributeStrategies from 'fontoxml-table-flow/src/setAttributeStrategies.js';

function parseWidth(width) {
	const widthPart = /^(\d+(?:\.\d+)?)%$/.exec(width);
	if (widthPart === null) {
		return undefined;
	}
	var float = parseFloat(widthPart[1]);
	return isNaN(float) ? undefined : float;
}

/**
 * Configures the table definition for XHTML tables.
 *
 * @param {XhtmlTableOptions} options
 */
function XhtmlTableDefinition(options) {
	var useThead = !!options.useThead;
	var useTbody = !!options.useTbody;
	var useTh = !!options.useTh;
	var useBorders = options.useBorders !== false;
	var shouldCreateColumnSpecificationNodes = true;

	// Warn the developer that thead is used as header-defining element. This is required when
	// using tbody.
	if (useTbody && !useThead && options.useThead !== undefined) {
		throw new Error('XHTML table: Using tbody requires the use of thead.');
	}

	// Warn the developer that th is being used as header-defining element. At least one header
	// type is required.
	if (!useThead && !useTh && options.useThead !== undefined && options.useTh !== undefined) {
		throw new Error('XHTML table: At least one header type (th or thead) muse be used.');
	}

	if (!useThead && !useTh) {
		useTh = true;
	}

	var namespaceURI =
		options.table && options.table.namespaceURI ? options.table.namespaceURI : '';

	var namespaceSelector = 'Q{' + namespaceURI + '}';
	var selectorParts = {
		table:
			namespaceSelector +
			'table' +
			(options.table && options.table.tableFilterSelector
				? '[' + options.table.tableFilterSelector + ']'
				: ''),
		headerContainer: namespaceSelector + 'thead',
		bodyContainer: namespaceSelector + 'tbody',
		footerContainer: namespaceSelector + 'tfoot',
		row: namespaceSelector + 'tr',
		cell: namespaceSelector + 'td',
		headerCell: namespaceSelector + 'th',
		columnSpecificationGroup: namespaceSelector + 'colgroup',
		columnSpecification: namespaceSelector + 'col',
		caption: namespaceSelector + 'caption[parent::' + namespaceSelector + 'table]'
	};

	// Alias selector parts
	var table = selectorParts.table;
	var thead = selectorParts.headerContainer;
	var tbody = selectorParts.bodyContainer;
	var tfoot = selectorParts.footerContainer;
	var tr = selectorParts.row;
	var td = selectorParts.cell;
	var th = selectorParts.headerCell;
	var col = selectorParts.columnSpecification;
	var colGroup = selectorParts.columnSpecificationGroup;

	var tableNodesSelector =
		'self::' +
		col +
		' or self::' +
		colGroup +
		' or self::' +
		tr +
		' or self::' +
		thead +
		' or self::' +
		tbody +
		' or self::' +
		tfoot;

	var properties = {
		selectorParts: selectorParts,

		supportsBorders: useBorders,

		supportsCellAlignment: true,

		shouldCreateColumnSpecificationNodes: shouldCreateColumnSpecificationNodes,

		// Defining node selectors
		tablePartsNodeSelector: Object.keys(selectorParts)
			.filter(function(selector) {
				return selector !== 'caption';
			})
			.map(
				function(key) {
					return 'self::' + selectorParts[key];
				}.bind(this)
			)
			.join(' or '),

		// Finds
		findHeaderRowNodesXPathQuery:
			'if (./' +
			thead +
			') then ./' +
			thead +
			'/' +
			tr +
			' else (./' +
			tr +
			'[./' +
			td +
			'])[1]/preceding-sibling::' +
			tr +
			'[./' +
			th +
			' => count() = ./*[self::' +
			td +
			' or self::' +
			th +
			'] => count()] | ()',
		findBodyRowNodesXPathQuery:
			'if (./' +
			tbody +
			') then ./' +
			tbody +
			'/' +
			tr +
			' else ./' +
			tr +
			'[not(./' +
			th +
			' => count() = ./*[self::' +
			td +
			' or self::' +
			th +
			'] => count())]',
		findFooterRowNodesXPathQuery:
			'if (./' +
			tfoot +
			') then ./' +
			tfoot +
			'/' +
			tr +
			' else ./' +
			tr +
			'[./' +
			td +
			' => count() = ./*[self::' +
			td +
			' or self::' +
			th +
			'] => count()][last()]/following-sibling::' +
			tr,

		findHeaderContainerNodesXPathQuery: './' + thead,
		findBodyContainerNodesXPathQuery: './' + tbody,
		findFooterContainerNodesXPathQuery: './' + tfoot,

		findColumnSpecificationNodesXPathQuery: './' + col,

		findCellNodesXPathQuery: './' + td + ' | ./' + th,

		findNonTableNodesPrecedingRowsXPathQuery:
			'./*[(' +
			tableNodesSelector +
			') => not() and following-sibling::*[' +
			tableNodesSelector +
			']]',

		// Data
		getNumberOfColumnsXPathQuery:
			'(let $cells := head(descendant-or-self::' +
			tr +
			')/*[self::' +
			td +
			' | self::' +
			th +
			'] return for $node in $cells return let $colspan := $node/@colspan => number() return if ($colspan) then $colspan else 1) => sum()',
		getRowSpanForCellNodeXPathQuery:
			'let $rowspan := ./@rowspan return if ($rowspan) then $rowspan => number() else 1',
		getColumnSpanForCellNodeXPathQuery:
			'let $colspan := ./@colspan return if ($colspan) then $colspan => number() else 1',

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
			normalizeContainerNodeStrategies.createRemoveFooterContainerNodeStrategy()
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
			)
		],

		// Creates
		createCellNodeStrategy: createCreateCellNodeStrategy(namespaceURI, 'td'),
		createRowStrategy: createCreateRowStrategy(namespaceURI, 'tr'),
		createColumnSpecificationNodeStrategy: shouldCreateColumnSpecificationNodes
			? createCreateColumnSpecificationNodeStrategy(
					namespaceURI,
					'col',
					'./*[self::' + thead + ' or self::' + tbody + ' or self::' + tr + ']'
			  )
			: undefined,

		// Specification
		getTableSpecificationStrategies: useBorders
			? [
					getSpecificationValueStrategies.createGetValueAsBooleanStrategy(
						'borders',
						'./@border = "1"'
					)
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
			)
		].concat(
			useBorders
				? [
						getSpecificationValueStrategies.createGetValueAsBooleanStrategy(
							'columnSeparator',
							'./ancestor::' + table + '[1]/@border = "1"'
						),
						getSpecificationValueStrategies.createGetValueAsBooleanStrategy(
							'rowSeparator',
							'./ancestor::' + table + '[1]/@border = "1"'
						)
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
					)
			  ]
			: [],

		setCellNodeAttributeStrategies: [
			setAttributeStrategies.createRowSpanAsAttributeStrategy('rowspan'),
			setAttributeStrategies.createColumnSpanAsAttributeStrategy('colspan'),
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
			)
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
			getSpecificationValueStrategies.createGetValueAsStringStrategy(
				'columnWidth',
				'./@width'
			)
		],

		setColumnSpecificationNodeAttributeStrategies: [
			setAttributeStrategies.createStringValueAsAttributeStrategy('width', 'columnWidth')
		],

		// Widths
		widthToHtmlWidthStrategy: function(width, widths) {
			var proportion = parseWidth(width) || 1;
			var totalProportion = widths.reduce(function(total, proportion) {
				return total + parseWidth(proportion) || 1;
			}, 0);

			return (100 * proportion) / totalProportion + '%';
		},
		addWidthsStrategy: function(width1, width2) {
			var parsedWidth1 = parseWidth(width1);
			var proportion1 = parseFloat(parsedWidth1) || 0;
			var fixed1 = parseFloat(undefined) || 0;

			var parsedWidth2 = parseWidth(width2);
			var proportion2 = parseFloat(parsedWidth2) || 0;
			var fixed2 = parseFloat(undefined) || 0;

			var proportion = proportion1 + proportion2;
			var fixed = fixed1 + fixed2;

			return proportion !== 0 ? proportion + '*' : '' + fixed !== 0 ? fixed + 'px' : '';
		},
		divideByTwoStrategy: function(width) {
			var parsedWidth = parseWidth(width);

			var proportion = parseFloat(parsedWidth);
			var fixed = parseFloat(undefined);

			return proportion ? proportion / 2 + '*' : '' + fixed ? fixed / 2 + 'px' : '';
		},
		widthsToFractionsStrategy: function(widths) {
			var parsedWidths = widths.map(function(width) {
				if (width === '*') {
					return 1;
				}

				// Parsing withs for the column width popover does not use the parseWidth
				// function bacause widths containing fixed widths are considered invalid
				// values for the popover.
				var match = /^([0-9]+(?:\.[0-9]+)?)\*$/.exec(width);

				if (!match) {
					match = /^([0-9]+(?:\.[0-9]+)?)%$/.exec(width);
				}

				if (!match) {
					return null;
				}

				var value = parseFloat(match[1]);
				return Number.isNaN(value) ? null : value;
			});

			if (parsedWidths.indexOf(null) !== -1) {
				return parsedWidths.map(function() {
					return 1 / parsedWidths.length;
				});
			}

			var totalWidth = parsedWidths.reduce(function(total, width) {
				return total + width;
			}, 0);

			return parsedWidths.map(function(width) {
				return width / totalWidth;
			});
		},
		normalizeColumnWidthsStrategy: function(columnWidths) {
			if (columnWidths.some(w => !w.endsWith('%'))) {
				return columnWidths;
			}
			const ratios = columnWidths.map(percentage => parseFloat(percentage));
			const total = ratios.reduce((total, columnWidth) => total + columnWidth, 0);
			return ratios.map(ratio => (ratio / total).toFixed(4) * 100 + '%');
		},
		fractionsToWidthsStrategy: function(fractions) {
			return fractions.map(function(fraction) {
				return parseFloat(fraction * 100).toFixed(2) + '%';
			});
		}
	};

	TableDefinition.call(this, properties);
}

XhtmlTableDefinition.prototype = Object.create(TableDefinition.prototype);
XhtmlTableDefinition.prototype.constructor = XhtmlTableDefinition;

export default XhtmlTableDefinition;
