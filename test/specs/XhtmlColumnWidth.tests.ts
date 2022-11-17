import type { FontoElementNode } from 'fontoxml-dom-utils/src/types';
import type TableGridModel from 'fontoxml-table-flow/src/TableGridModel/TableGridModel';
import normalizeColumnWidths from 'fontoxml-table-flow/src/utils/normalizeColumnWidths';
import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/src/table-definition/XhtmlTableDefinition';
import { assertDocumentAsJsonMl } from 'fontoxml-unit-test-utils/src/unitTestAssertionHelpers';
import UnitTestEnvironment from 'fontoxml-unit-test-utils/src/UnitTestEnvironment';
import {
	findFirstNodeInDocument,
	runWithBlueprint,
} from 'fontoxml-unit-test-utils/src/unitTestSetupHelpers';

describe('XHTML tables: Column Width', () => {
	let environment: UnitTestEnvironment;

	beforeEach(() => {
		environment = new UnitTestEnvironment();

		environment.synthesizer.setCompleteStructureImplementation(() => true);

		environment.validator.setCanContainImplementation(() => true);
		environment.validator.setValidateDownImplementation(() => []);
	});

	afterEach(() => {
		environment.destroy();
	});

	function transformTable(
		jsonIn,
		jsonOut,
		options = {},
		mutateGridModel = (_: TableGridModel) => {
			/* no-op */
		}
	) {
		const documentId = environment.createDocumentFromJsonMl(jsonIn);
		const tableDefinition = new XhtmlTableDefinition(options);

		runWithBlueprint((blueprint, _blueprintSelection, format) => {
			const tableNode = findFirstNodeInDocument(
				documentId,
				'descendant::table[1]',
				blueprint
			) as FontoElementNode;

			const gridModel = tableDefinition.buildTableGridModel(
				tableNode,
				blueprint
			);
			chai.assert.isFalse('error' in gridModel);

			mutateGridModel(gridModel as TableGridModel);

			const success = tableDefinition.applyToDom(
				gridModel as TableGridModel,
				tableNode,
				blueprint,
				format
			);
			chai.assert.isTrue(success);
		});

		assertDocumentAsJsonMl(documentId, jsonOut);
	}

	it('can handle a 4x4 table based, adding 1 column before index 0 with percentual column type', () => {
		const jsonIn = [
			'table',
			['col', { width: '20%' }],
			['col', { width: '20%' }],
			['col', { width: '20%' }],
			['col', { width: '20%' }],
			[
				'tbody',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			],
		];

		const mutateGridModel = (gridModel) => gridModel.insertColumn(0, false);

		const jsonOut = [
			'table',
			['col', { width: '20%' }],
			['col', { width: '20%' }],
			['col', { width: '20%' }],
			['col', { width: '20%' }],
			['col', { width: '20%' }],
			[
				'tbody',
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
			],
		];

		const options = {
			shouldCreateColumnSpecificationNodes: true,
			columnWidthType: 'percentual',
			useThead: true,
			useTbody: true,
			useTh: false,
		};

		transformTable(jsonIn, jsonOut, options, mutateGridModel);
	});

	it('can handle a 4x4 table based, adding 1 column before index 0 with relative column type', () => {
		const jsonIn = [
			'table',
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			[
				'tbody',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			],
		];

		const mutateGridModel = (gridModel) => gridModel.insertColumn(0, false);

		const jsonOut = [
			'table',
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			[
				'tbody',
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
			],
		];

		const options = {
			shouldCreateColumnSpecificationNodes: true,
			columnWidthType: 'relative',
			useThead: true,
			useTbody: true,
			useTh: false,
		};

		transformTable(jsonIn, jsonOut, options, mutateGridModel);
	});

	it('can normalize columns after deleting a column', () => {
		const jsonIn = [
			'table',
			['col'],
			['col'],
			['col'],
			['col'],
			[
				'tbody',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			],
		];

		const mutateGridModel = (gridModel: TableGridModel) => {
			gridModel.deleteColumn(0);

			normalizeColumnWidths(gridModel);
		};

		const jsonOut = [
			'table',
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			['col', { width: '1*' }],
			[
				'tbody',
				['tr', ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td']],
			],
		];

		const options = {
			shouldCreateColumnSpecificationNodes: true,
			columnWidthType: 'relative',
			useThead: true,
			useTbody: true,
			useTh: false,
		};

		transformTable(jsonIn, jsonOut, options, mutateGridModel);
	});
});
