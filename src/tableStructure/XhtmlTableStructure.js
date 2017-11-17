define([
	'fontoxml-blueprints/readOnlyBlueprint',
	'fontoxml-selectors/evaluateXPathToBoolean',
	'fontoxml-table-flow',

	'./buildGridModel',
	'./tableGridModelToXhtmlTable',
	'./specs/createDefaultCellSpec',
	'./specs/createDefaultColSpec',
	'./specs/createDefaultRowSpec'
], function (
	readOnlyBlueprint,
	evaluateXPathToBoolean,
	tableFlow,

	buildGridModel,
	tableGridModelToXhtmlTable,
	createDefaultCellSpec,
	createDefaultColSpec,
	createDefaultRowSpec
) {
	'use strict';

	var TableStructure = tableFlow.TableStructure,
		createNewTableCreator = tableFlow.primitives.createNewTableCreater;

	function XhtmlTableStructure (options) {
		this.useThead = !!options.useThead;
		this.useTbody = !!options.useTbody;
		this.useTh = !!options.useTh;

		// Warn the developer that thead is used as header-defining element. This is required when
		// using tbody.
		if (this.useTbody && !this.useThead && options.useThead !== undefined) {
			throw new Error('XHTML table: Using tbody requires the use of thead.');
		}

		// Warn the developer that th is being used as header-defining element. At least one header
		// type is required.
		if (!this.useThead && !this.useTh && options.useThead !== undefined && options.useTh !== undefined) {
			throw new Error('XHTML table: At least one header type (th or thead) muse be used.');
		}

		if (!this.useThead && !this.useTh) {
			this.useTh = true;
		}

		this.namespaceURI = options.table && options.table.namespaceURI ? options.table.namespaceURI : '';

		var namespaceSelector = 'Q{' + this.namespaceURI + '}';
		this.selectorParts = {
			table: namespaceSelector + 'table',
			thead: namespaceSelector + 'thead',
			tbody: namespaceSelector + 'tbody',
			tfoot: namespaceSelector + 'tfoot',
			tr: namespaceSelector + 'tr',
			td: namespaceSelector + 'td',
			th: namespaceSelector + 'th',
			colgroup: namespaceSelector + 'colgroup',
			col: namespaceSelector + 'col',
			caption: namespaceSelector + 'caption[parent::' + this.table + ']'
		};

		this._tablePartsSelector = Object.keys(this.selectorParts).map(function (key) {
				return 'self::' + this.selectorParts[key];
			}.bind(this)).join(' or ');

		this.tableDefiningNodeSelector = this.selectorParts.table;
	}

	XhtmlTableStructure.prototype = TableStructure;
	XhtmlTableStructure.prototype.constructor = XhtmlTableStructure;

	XhtmlTableStructure.prototype.isTable = function (element) {
		return evaluateXPathToBoolean('self::' + this.selectorParts.table, element, readOnlyBlueprint);
	};

	XhtmlTableStructure.prototype.isTableCell = function (element) {
		return evaluateXPathToBoolean('self::' + this.selectorParts.td + ' or self::' + this.selectorParts.th, element, readOnlyBlueprint);
	};

	XhtmlTableStructure.prototype.isTablePart = function (element) {
		return evaluateXPathToBoolean(this._tablePartsSelector, element, readOnlyBlueprint);
	};

	XhtmlTableStructure.prototype.buildGridModel = function (element, blueprint) {
		return buildGridModel(this, element, blueprint);
	};

	XhtmlTableStructure.prototype.applyToDom = function (tableGridModel, tableNode, blueprint, format) {
		return tableGridModelToXhtmlTable(this, tableGridModel, tableNode, blueprint, format);
	};

	XhtmlTableStructure.prototype.getNewTableCreater = function () {
		return createNewTableCreator(
			'td',
			createDefaultRowSpec,
			createDefaultColSpec,
			createDefaultCellSpec,
			this);
	};

	return XhtmlTableStructure;
});
