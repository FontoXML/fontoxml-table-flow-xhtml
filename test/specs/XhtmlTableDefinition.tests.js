import readOnlyBlueprint from 'fontoxml-blueprints/readOnlyBlueprint';
import * as slimdom from 'slimdom';
import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/table-definition/XhtmlTableDefinition';

describe('XhtmlTableDefinition', () => {
	let documentNode;
	let tableDefinition;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		tableDefinition = new XhtmlTableDefinition({});
	});

	describe('XhtmlTableDefinition()', () => {
		it('can be initialized', () => {});
	});

	describe('isTable()', () => {
		it('can recognize a table element',
			() => chai.assert.isTrue(tableDefinition.isTable(documentNode.createElement('table'), readOnlyBlueprint)));
	});

	describe('isTableCell()', () => {
		it('can recognize a cell element',
			() => chai.assert.isTrue(tableDefinition.isTableCell(documentNode.createElement('td'), readOnlyBlueprint)));
	});

	describe('isTablePart()', () => {
		it('can recognize a table part',
			() => chai.assert.isTrue(tableDefinition.isTablePart(documentNode.createElement('tr'), readOnlyBlueprint)));
	});
});
