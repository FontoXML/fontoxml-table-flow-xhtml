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

		it('throws when an invalid combination of useThead and useTh is used', () => {
			chai.assert.throws(() => {
				new XhtmlTableStructure({
					useThead: false,
					useTh: false
				});
			});
		});

		it('throws when an invalid combination of useThead and useTbody is used', () => {
			chai.assert.throws(() => {
				new XhtmlTableStructure({
					useThead: false,
					useTbody: true
				});
			});
		});
	});

	describe('isTable()', () => {
		it('can recognize a table element',
			() => chai.assert.isTrue(xhtmlTableStructure.isTable(documentNode.createElement('table'))));
	});

	describe('isTablePart()', () => {
		it('can recognize a table part element',
			() => chai.assert.isTrue(xhtmlTableStructure.isTablePart(documentNode.createElement('td'))));
	});

	describe('isTableCell()', () => {
		it('can recognize a td as cell element',
			() => chai.assert.isTrue(xhtmlTableStructure.isTableCell(documentNode.createElement('td'))));
		it('can recognize a th as cell element',
			() => chai.assert.isTrue(xhtmlTableStructure.isTableCell(documentNode.createElement('th'))));
	});
});
