import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint';
import type { FontoNode } from 'fontoxml-dom-utils/src/types';
import xq from 'fontoxml-selectors/src/xq';
import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/src/table-definition/XhtmlTableDefinition';
import UnitTestEnvironment from 'fontoxml-unit-test-utils/src/UnitTestEnvironment';
import { findFirstNodeInDocument } from 'fontoxml-unit-test-utils/src/unitTestSetupHelpers';

describe('XhtmlTableDefinition', () => {
	let environment: UnitTestEnvironment;
	let tableNode: FontoNode;
	let rowNode: FontoNode;
	let cellNode: FontoNode;
	let tableDefinition: XhtmlTableDefinition;
	beforeEach(() => {
		environment = new UnitTestEnvironment();
		const documentId = environment.createDocumentFromJsonMl([
			'table',
			['tr', ['td']],
		]);
		tableNode = findFirstNodeInDocument(documentId, xq`/table`);
		rowNode = findFirstNodeInDocument(documentId, xq`/table/tr`);
		cellNode = findFirstNodeInDocument(documentId, xq`/table/tr/td`);
		tableDefinition = new XhtmlTableDefinition({});
	});
	afterEach(() => {
		environment.destroy();
	});

	describe('isTable()', () => {
		it('can recognize a table element', () => {
			chai.assert.isTrue(
				tableDefinition.isTable(tableNode, readOnlyBlueprint)
			);
		});
	});

	describe('isTableCell()', () => {
		it('can recognize a cell element', () => {
			chai.assert.isTrue(
				tableDefinition.isTableCell(cellNode, readOnlyBlueprint)
			);
		});
	});

	describe('isTablePart()', () => {
		it('can recognize a table part', () => {
			chai.assert.isTrue(
				tableDefinition.isTablePart(rowNode, readOnlyBlueprint)
			);
		});
	});
});
