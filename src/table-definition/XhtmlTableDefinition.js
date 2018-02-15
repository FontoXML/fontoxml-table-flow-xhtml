define([
	'fontoxml-table-flow/TableDefinition',
	'fontoxml-table-flow/createCreateRowStrategy',
	'fontoxml-table-flow/getAttributeStrategies',
	'fontoxml-table-flow/normalizeCellNodeStrategies',
	'fontoxml-table-flow/normalizeContainerNodeStrategies',
	'fontoxml-table-flow/setAttributeStrategies'
], function (
	TableDefinition,
	createCreateRowStrategy,
	getAttributeStrategies,
	normalizeCellNodeStrategies,
	normalizeContainerNodeStrategies,
	setAttributeValueStrategies
) {
	'use strict';

	/**
	 * Configures the table definition for XHTML tables.
	 *
	 * @param {XhtmlTableOptions} options
	 */
	function XhtmlTableDefinition (options) {
		var useThead = !!options.useThead;
		var useTbody = !!options.useTbody;
		var useTh = !!options.useTh;

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

		var namespaceURI = options.table && options.table.namespaceURI ? options.table.namespaceURI : '';

		var namespaceSelector = 'Q{' + namespaceURI + '}';
		var selectorParts = {
			table: namespaceSelector + 'table' + (options.table && options.table.tableFilterSelector ?
					'[' + options.table.tableFilterSelector + ']' :
					''),
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

		var tableNodesSelector = 'self::' + col +
			' or self::' + colGroup +
			' or self::' + tr +
			' or self::' + thead +
			' or self::' + tbody +
			' or self::' + tfoot;

		var properties = {
			selectorParts: selectorParts,
			namespaceURI: namespaceURI,
			cellLocalName: 'td',

			// Table borders
			defaultBorderValue: '1',
			tableBorderToCvkTableBorder: {
				'0': 'none',
				'1': 'all'
			},

			// Defining node selectors
			tableDefiningNodeSelector: 'self::' + table,
			cellDefiningNodeSelector: 'self::' + td + ' or self::' + th,
			tablePartsNodeSelector: Object.keys(selectorParts)
				.filter(function (selector) { return selector !== 'caption'; })
				.map(function (key) {
					return 'self::' + selectorParts[key];
				}.bind(this)).join(' or '),

			// Finds
			findHeaderRowNodesXPathQuery: 'if (./' + thead + ') then ./' + thead + '/' + tr +
				' else (./' + tr + '[./' + td + '])[1]/preceding-sibling::' + tr +
				'[./' + th + ' => count() = ./*[self::' + td + ' or self::' + th + '] => count()] | ()',
			findBodyRowNodesXPathQuery: 'if (./' + tbody + ') then ./' + tbody + '/' + tr +
				' else ./' + tr + '[not(./' + th + ' => count() = ./*[self::' + td + ' or self::' + th + '] => count())]',
			findFooterRowNodesXPathQuery: 'if (./' + tfoot + ') then ./' + tfoot + '/' + tr +
				' else ./' + tr + '[./' + td + ' => count() = ./*[self::' + td + ' or self::' + th + '] => count()][last()]/following-sibling::' + tr,

			findHeaderContainerNodesXPathQuery: './' + thead,
			findBodyContainerNodesXPathQuery: './' + tbody,
			findFooterContainerNodesXPathQuery: './' + tfoot,

			findColumnSpecificationNodesXPathQuery: './' + col,

			findCellNodesXPathQuery: './' + td + ' | ./' + th,

			findNonTableNodesPrecedingRowsXPathQuery: './*[(' + tableNodesSelector + ') => not() and following-sibling::*[' + tableNodesSelector + ']]',

			// Data
			getNumberOfColumnsXPathQuery: '(let $cells := (.//' + tr + ')[1]/*[self::' + td + ' | self::' + th + '] return for $node in $cells return let $colspan := $node/@colspan => number() return if ($colspan) then $colspan else 1) => sum()',
			getRowSpanForCellNodeXPathQuery: 'let $rowspan := ./@rowspan return if ($rowspan) then $rowspan => number() else 1',
			getColumnSpanForCellNodeXPathQuery: 'let $colspan := ./@colspan return if ($colspan) then $colspan => number() else 1',

			// Normalizations
			normalizeContainerNodeStrategies: [
					useThead ?
						normalizeContainerNodeStrategies.createAddHeaderContainerNodeStrategy(namespaceURI, 'thead') :
						normalizeContainerNodeStrategies.createRemoveHeaderContainerNodeStrategy(),
					useTbody ?
						normalizeContainerNodeStrategies.createAddBodyContainerNodeStrategy(namespaceURI, 'tbody') :
						normalizeContainerNodeStrategies.createRemoveBodyContainerNodeStrategy(),
					normalizeContainerNodeStrategies.createRemoveFooterContainerNodeStrategy()
				],

			normalizeCellNodeStrategies: [
					useTh ?
						normalizeCellNodeStrategies.createConvertHeaderCellNodeToNormalCellNodeStrategy(namespaceURI, 'th') :
						normalizeCellNodeStrategies.createConvertHeaderCellNodeToNormalCellNodeStrategy(namespaceURI, 'td'),
					normalizeCellNodeStrategies.createConvertFormerHeaderCellNodeToNormalCellNodeStrategy(namespaceURI, 'td')
				],

			// Creates
			createRowStrategy: createCreateRowStrategy(namespaceURI, 'tr'),

			// Specification
			getTableSpecificationStrategies: [
					getAttributeStrategies.createGetAttributeValueAsBooleanStrategy('borders', './@border = "1"')
				],

			getColumnSpecificationStrategies: [
					getAttributeStrategies.createGetAttributeValueAsStringStrategy('columnWidth', '"1*"')
				],

			getCellSpecificationStrategies: [
					getAttributeStrategies.createGetAttributeValueAsStringStrategy('horizontalAlignment', './@align'),
					getAttributeStrategies.createGetAttributeValueAsStringStrategy('verticalAlignment', './@valign')
				],

			// Set attributes
			setTableNodeAttributeStrategies: [
					setAttributeValueStrategies.createBooleanValueAsAttributeStrategy('border', 'borders', null, '1', '0')
				],

			setCellNodeAttributeStrategies: [
					setAttributeValueStrategies.createRowSpanAsAttributeStrategy('rowspan'),
					setAttributeValueStrategies.createColumnSpanAsAttributeStrategy('colspan'),
					setAttributeValueStrategies.createStringValueAsAttributeStrategy('align', 'horizontalAlignment'),
					setAttributeValueStrategies.createStringValueAsAttributeStrategy('valign', 'verticalAlignment')
				],
		};

		TableDefinition.call(this, properties);
	}

	XhtmlTableDefinition.prototype = Object.create(TableDefinition.prototype);
	XhtmlTableDefinition.prototype.constructor = XhtmlTableDefinition;

	return XhtmlTableDefinition;
});
