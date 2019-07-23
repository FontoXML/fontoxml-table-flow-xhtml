import TableDefinition from 'fontoxml-table-flow/src/TableDefinition.js';
import createCreateCellNodeStrategy from 'fontoxml-table-flow/src/createCreateCellNodeStrategy.js';
import createCreateRowStrategy from 'fontoxml-table-flow/src/createCreateRowStrategy.js';
import createCreateColumnSpecificationNodeStrategy from 'fontoxml-table-flow/src/createCreateColumnSpecificationNodeStrategy.js';
import getSpecificationValueStrategies from 'fontoxml-table-flow/src/getSpecificationValueStrategies.js';
import normalizeCellNodeStrategies from 'fontoxml-table-flow/src/normalizeCellNodeStrategies.js';
import normalizeContainerNodeStrategies from 'fontoxml-table-flow/src/normalizeContainerNodeStrategies.js';
import setAttributeStrategies from 'fontoxml-table-flow/src/setAttributeStrategies.js';

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
	var shouldCreateColumnSpecificationNodes = !!options.shouldCreateColumnSpecificationNodes;

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

		getColumnSpecificationStrategies: shouldCreateColumnSpecificationNodes
			? [
					getSpecificationValueStrategies.createGetValueAsStringStrategy(
						'horizontalAlignment',
						'./@align'
					),
					getSpecificationValueStrategies.createGetValueAsStringStrategy(
						'verticalAlignment',
						'./@valign'
					)
			  ]
			: [],

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

		setColumnSpecificationNodeAttributeStrategies: shouldCreateColumnSpecificationNodes
			? [
					setAttributeStrategies.createStringValueAsAttributeStrategy(
						'align',
						'horizontalAlignment'
					),
					setAttributeStrategies.createStringValueAsAttributeStrategy(
						'valign',
						'verticalAlignment'
					)
			  ]
			: [],

		horizontalAlignmentOperationNames: [
			'contextual-xhtml-set-cell-horizontal-alignment-left',
			'contextual-xhtml-set-cell-horizontal-alignment-center',
			'contextual-xhtml-set-cell-horizontal-alignment-right',
			'contextual-xhtml-set-cell-horizontal-alignment-justify'
		],

		verticalAlignmentOperationNames: [
			'contextual-xhtml-set-cell-vertical-alignment-top',
			'contextual-xhtml-set-cell-vertical-alignment-bottom',
			'contextual-xhtml-set-cell-vertical-alignment-center'
		]
	};

	TableDefinition.call(this, properties);
}

XhtmlTableDefinition.prototype = Object.create(TableDefinition.prototype);
XhtmlTableDefinition.prototype.constructor = XhtmlTableDefinition;

export default XhtmlTableDefinition;
