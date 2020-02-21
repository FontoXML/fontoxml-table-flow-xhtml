import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint.js';
import * as slimdom from 'slimdom';
import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/src/table-definition/XhtmlTableDefinition.js';

describe('XhtmlTableDefinition', () => {
	let documentNode;
	let tableNode;
	let rowNode;
	let cellNode;
	let tableDefinition;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		tableNode = documentNode.createElement('table');
		documentNode.appendChild(tableNode);
		rowNode = documentNode.createElement('tr');
		tableNode.appendChild(rowNode);
		cellNode = documentNode.createElement('td');
		rowNode.appendChild(cellNode);
		tableDefinition = new XhtmlTableDefinition({});
	});

	describe('XhtmlTableDefinition()', () => {
		it('can be initialized', () => {});
	});

	describe('isTable()', () => {
		it('can recognize a table element', () =>
			chai.assert.isTrue(tableDefinition.isTable(tableNode, readOnlyBlueprint)));
	});

	describe('isTableCell()', () => {
		it('can recognize a cell element', () =>
			chai.assert.isTrue(tableDefinition.isTableCell(cellNode, readOnlyBlueprint)));
	});

	describe('isTablePart()', () => {
		it('can recognize a table part', () =>
			chai.assert.isTrue(tableDefinition.isTablePart(rowNode, readOnlyBlueprint)));
	});
});
