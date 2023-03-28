import type Blueprint from 'fontoxml-blueprints/src/Blueprint';
import blueprintQuery from 'fontoxml-blueprints/src/blueprintQuery';
import type BlueprintSelection from 'fontoxml-blueprints/src/BlueprintSelection';
import type { DocumentId } from 'fontoxml-documents/src/types';
import type {
	FontoDocumentNode,
	FontoElementNode,
	JsonMl,
} from 'fontoxml-dom-utils/src/types';
import xq from 'fontoxml-selectors/src/xq';
import { isTableGridModel } from 'fontoxml-table-flow/src/indexedTableGridModels';
import type TableCell from 'fontoxml-table-flow/src/TableGridModel/TableCell';
import type TableGridModel from 'fontoxml-table-flow/src/TableGridModel/TableGridModel';
import type { TableElementsSharedOptions } from 'fontoxml-table-flow/src/types';
import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/src/table-definition/XhtmlTableDefinition';
import type { TableElementsXhtmlOptions } from 'fontoxml-table-flow-xhtml/src/types';
import {
	assertDocumentAsJsonMl,
	assertSelectionInDocument,
} from 'fontoxml-unit-test-utils/src/unitTestAssertionHelpers';
import UnitTestEnvironment from 'fontoxml-unit-test-utils/src/UnitTestEnvironment';
import {
	findFirstNodeInDocument,
	runWithBlueprint,
} from 'fontoxml-unit-test-utils/src/unitTestSetupHelpers';

describe('XHTML tables: Grid model to XML', () => {
	let environment: UnitTestEnvironment;
	beforeEach(() => {
		environment = new UnitTestEnvironment();
	});
	afterEach(() => {
		environment.destroy();
	});

	function runCreateTableTest(
		numberOfRows: number,
		numberOfColumns: number,
		hasHeader: boolean,
		options: TableElementsSharedOptions & TableElementsXhtmlOptions,
		expected: JsonMl
	): void {
		const documentId = environment.createDocumentFromXml('<table/>');
		const documentNode = findFirstNodeInDocument(
			documentId,
			xq`self::node()`
		) as FontoDocumentNode;
		const tableDefinition = new XhtmlTableDefinition(options);
		const tableNode = findFirstNodeInDocument(
			documentId,
			xq`/table`
		) as FontoElementNode;
		runWithBlueprint((blueprint, _, format) => {
			const tableGridModel = tableDefinition.getTableGridModelBuilder()(
				numberOfRows,
				numberOfColumns,
				hasHeader,
				documentNode
			);
			chai.assert.isTrue(
				tableDefinition.applyToDom(
					tableGridModel,
					tableNode,
					blueprint,
					format
				)
			);
		});
		assertDocumentAsJsonMl(documentId, expected);
	}

	function runEditTableTest(
		jsonIn: JsonMl,
		options: TableElementsSharedOptions & TableElementsXhtmlOptions,
		mutate: (
			tableGridModel: TableGridModel,
			blueprintSelection: BlueprintSelection,
			blueprint: Blueprint
		) => void,
		expected: JsonMl
	): DocumentId {
		const documentId = environment.createDocumentFromJsonMl(jsonIn);
		const tableDefinition = new XhtmlTableDefinition(options);

		const tableNode = findFirstNodeInDocument(
			documentId,
			xq`//table`
		) as FontoElementNode;

		runWithBlueprint((blueprint, blueprintSelection, format) => {
			const tableGridModel = tableDefinition.buildTableGridModel(
				tableNode,
				blueprint
			);
			if (!isTableGridModel(tableGridModel)) {
				throw tableGridModel.error;
			}
			mutate(tableGridModel, blueprintSelection, blueprint);

			chai.assert.isTrue(
				tableDefinition.applyToDom(
					tableGridModel,
					tableNode,
					blueprint,
					format
				)
			);
		});
		assertDocumentAsJsonMl(documentId, expected);

		return documentId;
	}

	describe('Basics', () => {
		it('can serialize a 1x1 table', () => {
			runCreateTableTest(1, 1, true, {}, [
				'table',
				{ border: '1' },
				['tr', ['td']],
			]);
		});

		it('can serialize a 4x4 table', () => {
			runCreateTableTest(4, 4, false, {}, [
				'table',
				{ border: '1' },
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			]);
		});

		it('can serialize a 4x4 table with tbody', () => {
			runCreateTableTest(4, 4, false, { useTbody: true }, [
				'table',
				{ border: '1' },
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			]);
		});

		it('can delete a row of a table without row containers', () => {
			runEditTableTest(
				[
					'table',
					{ border: '1' },
					['tr', ['th'], ['th'], ['th']],
					['tr', ['th'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td']],
				],
				{ useTh: true },
				(gridModel) => {
					gridModel.deleteRow(0);
				},
				[
					'table',
					{ border: '1' },
					['tr', ['th'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td']],
				]
			);
		});

		it('can delete a colgroup after removing a row', () => {
			documentNode = new slimdom.Document();
			coreDocument = new CoreDocument(documentNode);
			blueprint = new Blueprint(coreDocument.dom);
			const jsonIn = [
				'table',
				{ border: '1' },
				[
					'colgroup',
					['col', { width: '1*' }],
					['col', { width: '1*' }],
					['col', { width: '1*' }],
				],
				['tr', ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td']],
			];

			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(jsonIn, documentNode)
			);
			tableNode = documentNode.firstChild;
			tableDefinition = new XhtmlTableDefinition({
				useTh: true,
				shouldCreateColumnSpecificationNodes: true,
			});

			chai.assert.deepEqual(jsonMLMapper.serialize(tableNode), jsonIn);

			const tableGridModel = tableDefinition.buildTableGridModel(
				tableNode,
				blueprint
			);

			tableGridModel.deleteRow(0);

			const serializedTable2 = [
				'table',
				{ border: '1' },
				['col', { width: '1*' }],
				['col', { width: '1*' }],
				['col', { width: '1*' }],
				['tr', ['td'], ['td'], ['td']],
			];

			// to be sure that deleteRow function did not apply changes to the dom.
			chai.assert.notDeepEqual(
				jsonMLMapper.serialize(tableNode),
				serializedTable2
			);

			chai.assert.isTrue(
				tableDefinition.applyToDom(
					tableGridModel,
					tableNode,
					blueprint,
					stubFormat
				)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();

			chai.assert.deepEqual(
				jsonMLMapper.serialize(tableNode),
				serializedTable2
			);
		});

		it('can delete a colgroup after removing a column', () => {
			documentNode = new slimdom.Document();
			coreDocument = new CoreDocument(documentNode);
			blueprint = new Blueprint(coreDocument.dom);
			const jsonIn = [
				'table',
				{ border: '1' },
				[
					'colgroup',
					['col', { width: '1*' }],
					['col', { width: '1*' }],
					['col', { width: '1*' }],
				],
				['tr', ['td'], ['td'], ['td']],
			];

			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(jsonIn, documentNode)
			);
			tableNode = documentNode.firstChild;
			tableDefinition = new XhtmlTableDefinition({
				shouldCreateColumnSpecificationNodes: true,
			});

			chai.assert.deepEqual(jsonMLMapper.serialize(tableNode), jsonIn);

			const tableGridModel = tableDefinition.buildTableGridModel(
				tableNode,
				blueprint
			);

			tableGridModel.deleteColumn(0);

			const serializedTable2 = [
				'table',
				{ border: '1' },
				['col', { width: '1*' }],
				['col', { width: '1*' }],
				['tr', ['td'], ['td']],
			];

			// to be sure that deleteRow function did not apply changes to the dom.
			chai.assert.notDeepEqual(
				jsonMLMapper.serialize(tableNode),
				serializedTable2
			);

			chai.assert.isTrue(
				tableDefinition.applyToDom(
					tableGridModel,
					tableNode,
					blueprint,
					stubFormat
				)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();

			chai.assert.deepEqual(
				jsonMLMapper.serialize(tableNode),
				serializedTable2
			);
		});

		it('can delete multiple rows when we have a row with merged cells', () => {
			runEditTableTest(
				[
					'table',
					{ border: '1' },
					[
						'thead',
						['tr', ['th', { rowspan: '2' }, '0x0'], ['th', '0x1']],
						['tr', ['th', '1x1']],
					],
					['tr', ['td', '2x0'], ['td', '2x1']],
					['tr', ['td', '3x0'], ['td', '3x1']],
					['tr', ['td', '4x0'], ['td', '4x1']],
				],
				{ useThead: true, useTh: true },
				(tableGridModel) => {
					tableGridModel.deleteRow(4);
					tableGridModel.deleteRow(3);
				},
				[
					'table',
					{ border: '1' },
					[
						'thead',
						['tr', ['th', { rowspan: '2' }, '0x0'], ['th', '0x1']],
						['tr', ['th', '1x1']],
					],
					['tr', ['td', '2x0'], ['td', '2x1']],
				]
			);
		});

		it('can insert a row of a table with header column but row containers', () => {
			runEditTableTest(
				[
					'table',
					{ border: '1' },
					['tr', ['th'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td']],
				],
				{ useTh: true },
				(tableGridModel) => {
					tableGridModel.insertRow(1, true);
				},
				[
					'table',
					{ border: '1' },
					['tr', ['th'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td']],
				]
			);
		});
	});

	describe('Headers', () => {
		it('can serialize a 4x4 table with 1 header row', () => {
			runCreateTableTest(4, 4, true, {}, [
				'table',
				{ border: '1' },
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			]);
		});

		it('can serialize a 4x4 table with 1 header row (th based)', () => {
			runCreateTableTest(4, 4, true, { useTh: true }, [
				'table',
				{ border: '1' },
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			]);
		});

		it('can serialize a 4x4 table with 1 header row (thead based)', () => {
			runCreateTableTest(4, 4, true, { useThead: true }, [
				'table',
				{ border: '1' },
				['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			]);
		});

		it('can serialize a 4x4 table with 1 header row (th and thead based)', () => {
			runCreateTableTest(4, 4, true, { useThead: true, useTh: true }, [
				'table',
				{ border: '1' },
				['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			]);
		});
	});

	describe('Spanning cells', () => {
		it('can serialize a 4x4 table with 1 column spanning cell', () => {
			runEditTableTest(
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				{},
				(tableGridModel) => {
					const spanningCell = tableGridModel.getCellAtCoordinates(
						1,
						1
					) as TableCell;
					spanningCell.size.columns = 2;

					tableGridModel.setCellAtCoordinates(spanningCell, 1, 1);
					tableGridModel.setCellAtCoordinates(spanningCell, 1, 2);
				},
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td', { colspan: '2' }], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]
			);
		});

		it('can serialize a 4x4 table with 1 row spanning cell', () => {
			runEditTableTest(
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				{},
				(tableGridModel) => {
					const spanningCell = tableGridModel.getCellAtCoordinates(
						1,
						1
					) as TableCell;
					spanningCell.size.rows = 2;

					tableGridModel.setCellAtCoordinates(spanningCell, 1, 1);
					tableGridModel.setCellAtCoordinates(spanningCell, 2, 1);
				},
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td', { rowspan: '2' }], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]
			);
		});

		it('can serialize a 4x4 table with 1 column and row spanning cell', () => {
			runEditTableTest(
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				{},
				(tableGridModel) => {
					const spanningCell = tableGridModel.getCellAtCoordinates(
						1,
						1
					) as TableCell;
					spanningCell.size.columns = 2;
					spanningCell.size.rows = 2;

					tableGridModel.setCellAtCoordinates(spanningCell, 1, 1);
					tableGridModel.setCellAtCoordinates(spanningCell, 1, 2);
					tableGridModel.setCellAtCoordinates(spanningCell, 2, 1);
					tableGridModel.setCellAtCoordinates(spanningCell, 2, 2);
				},
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					[
						'tr',
						['td'],
						['td', { colspan: '2', rowspan: '2' }],
						['td'],
					],
					['tr', ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]
			);
		});
	});

	describe('Selection', () => {
		it('moves the selection over to new <th> elements with an empty original <td>', () => {
			const documentId = runEditTableTest(
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				{},
				(tableGridModel, blueprintSelection) => {
					const cellWithSelection =
						tableGridModel.getCellAtCoordinates(0, 0) as TableCell;
					const cellElement = cellWithSelection.element;
					blueprintSelection.setStart(cellElement, 0);
					blueprintSelection.collapse(true);

					tableGridModel.increaseHeaderRowCount();
				},
				[
					'table',
					{ border: '1' },
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]
			);

			assertSelectionInDocument(
				documentId,
				xq`/table/tr/th`,
				0,
				xq`/table/tr/th`,
				0
			);
		});

		it('moves the selection over to new <th> elements with nodes inside the original <td>', () => {
			const documentId = runEditTableTest(
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				{},
				(tableGridModel, blueprintSelection, blueprint) => {
					const cellWithSelection =
						tableGridModel.getCellAtCoordinates(0, 0) as TableCell;
					const cellElement = cellWithSelection.element;
					const documentNode = blueprintQuery.getDocumentNode(
						blueprint,
						cellElement
					);
					blueprint.appendChild(
						cellElement,
						documentNode.createTextNode('bla')
					);
					blueprintSelection.setStart(cellElement, 0);
					blueprintSelection.collapse(true);

					tableGridModel.increaseHeaderRowCount();
				},
				[
					'table',
					{ border: '1' },
					['tr', ['th', 'bla'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]
			);

			assertSelectionInDocument(
				documentId,
				xq`/table/tr/th`,
				0,
				xq`/table/tr/th`,
				0
			);
		});

		it('moves the non-collapsed selection over to new <th> elements with nodes inside the original <td>', () => {
			const documentId = runEditTableTest(
				[
					'table',
					{ border: '1' },
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				{},
				(tableGridModel, blueprintSelection, blueprint) => {
					const cellWithSelection =
						tableGridModel.getCellAtCoordinates(0, 0) as TableCell;
					const cellElement = cellWithSelection.element;
					const documentNode = blueprintQuery.getDocumentNode(
						blueprint,
						cellElement
					);
					blueprint.appendChild(
						cellElement,
						documentNode.createTextNode('bla')
					);
					blueprintSelection.selectNodeContents(cellElement);

					tableGridModel.increaseHeaderRowCount();
				},
				[
					'table',
					{ border: '1' },
					['tr', ['th', 'bla'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]
			);

			assertSelectionInDocument(
				documentId,
				xq`/table/tr/th`,
				0,
				xq`/table/tr/th`,
				1
			);
		});
	});
});
