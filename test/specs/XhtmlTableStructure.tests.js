import * as slimdom from 'slimdom';
import XhtmlTableStructure from 'fontoxml-table-flow-xhtml/tableStructure/XhtmlTableStructure';

describe('XhtmlTableStructure', () => {
	let documentNode,
		xhtmlTableStructure;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		xhtmlTableStructure = new XhtmlTableStructure({});
	});

	describe('XhtmlTableStructure()', () => {
		it('can be initialized', () => {});
	});

	describe('isTable()', () => {
		it('can recognize a table element',
			() => chai.assert.isTrue(xhtmlTableStructure.isTable(documentNode.createElement('table'))));
	});

	describe('isTablePart()', () => {
		it('can recognize a table part element',
			() => chai.assert.isTrue(xhtmlTableStructure.isTablePart(documentNode.createElement('td'))));
	});
});
