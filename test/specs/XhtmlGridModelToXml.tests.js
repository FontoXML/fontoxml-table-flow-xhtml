import Blueprint from 'fontoxml-blueprints/Blueprint';
import CoreDocument from 'fontoxml-core/Document';
import jsonMLMapper from 'fontoxml-dom-utils/jsonMLMapper';
import indicesManager from 'fontoxml-indices/indicesManager';
import * as slimdom from 'slimdom';

import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/table-definition/XhtmlTableDefinition';

const stubFormat = {
	synthesizer: {
		completeStructure: () => true
	},
	metadata: {
		get: (_option, _node) => false
	},
	validator: {
		canContain: () => true
	}
};

describe('XHTML tables: Grid model to XML', () => {
	let blueprint;
	let coreDocument;
	let createTable;
	let documentNode;
	let tableDefinition;
	let tableNode;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		coreDocument = new CoreDocument(documentNode);
		blueprint = new Blueprint(coreDocument.dom);

		tableNode = documentNode.createElement('table');

		tableDefinition = new XhtmlTableDefinition({});
		createTable = tableDefinition.getTableGridModelBuilder();

		coreDocument.dom.mutate(() => {
			documentNode.appendChild(tableNode);
		});
	});

	describe('Basics', () => {
		it('can serialize a 1x1 table', () => {
			const tableGridModel = createTable(1, 1, true, documentNode);
			chai.assert.isTrue(
				tableDefinition.applyToDom(tableGridModel, tableNode, blueprint, stubFormat)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['tr', ['td']]
			]);
		});

		it('can serialize a 4x4 table', () => {
			const tableGridModel = createTable(4, 4, false, documentNode);
			chai.assert.isTrue(
				tableDefinition.applyToDom(tableGridModel, tableNode, blueprint, stubFormat)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']]
			]);
		});

		it('can serialize a 4x4 table with tbody', () => {
			const tableGridModel = createTable(4, 4, false, documentNode);
			const tableDefinition = new XhtmlTableDefinition({ useTbody: true });
			chai.assert.isTrue(
				tableDefinition.applyToDom(tableGridModel, tableNode, blueprint, stubFormat)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				]
			]);
		});
	});

	describe('Headers', () => {
		it('can serialize a 4x4 table with 1 header row', () => {
			const tableGridModel = createTable(4, 4, true, documentNode);
			chai.assert.isTrue(
				tableDefinition.applyToDom(tableGridModel, tableNode, blueprint, stubFormat)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']]
			]);
		});

		it('can serialize a 4x4 table with 1 header row (th based)', () => {
			const tableGridModel = createTable(4, 4, true, documentNode);
			const tableDefinition = new XhtmlTableDefinition({ useTh: true });
			chai.assert.isTrue(
				tableDefinition.applyToDom(tableGridModel, tableNode, blueprint, stubFormat)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']]
			]);
		});

		it('can serialize a 4x4 table with 1 header row (thead based)', () => {
			const tableGridModel = createTable(4, 4, true, documentNode);
			const tableDefinition = new XhtmlTableDefinition({ useThead: true });
			chai.assert.isTrue(
				tableDefinition.applyToDom(tableGridModel, tableNode, blueprint, stubFormat)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']]
			]);
		});

		it('can serialize a 4x4 table with 1 header row (th and thead based)', () => {
			const tableGridModel = createTable(4, 4, true, documentNode);
			const tableDefinition = new XhtmlTableDefinition({ useThead: true, useTh: true });
			chai.assert.isTrue(
				tableDefinition.applyToDom(tableGridModel, tableNode, blueprint, stubFormat)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']]
			]);
		});
	});

	describe('Spanning cells', () => {
		it('can serialize a 4x4 table with 1 column spanning cell', () => {
			const tableGridModel = createTable(4, 4, false, documentNode);
			const spanningCell = tableGridModel.getCellAtCoordinates(1, 1);
			spanningCell.size.columns = 2;

			tableGridModel.setCellAtCoordinates(spanningCell, 1, 1);
			tableGridModel.setCellAtCoordinates(spanningCell, 1, 2);

			chai.assert.isTrue(
				tableDefinition.applyToDom(tableGridModel, tableNode, blueprint, stubFormat)
			);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td', { colspan: '2' }], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']]
			]);
		});

		it('can serialize a 4x4 table with 1 row spanning cell', () => {
			const tableGridModel = createTable(4, 4, false, documentNode);
			const spanningCell = tableGridModel.getCellAtCoordinates(1, 1);
			spanningCell.size.rows = 2;

			tableGridModel.setCellAtCoordinates(spanningCell, 1, 1);
			tableGridModel.setCellAtCoordinates(spanningCell, 2, 1);

			const success = tableDefinition.applyToDom(
				tableGridModel,
				tableNode,
				blueprint,
				stubFormat
			);
			chai.assert.isTrue(success);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td', { rowspan: '2' }], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']]
			]);
		});

		it('can serialize a 4x4 table with 1 column and row spanning cell', () => {
			const tableGridModel = createTable(4, 4, false, documentNode);

			const spanningCell = tableGridModel.getCellAtCoordinates(1, 1);
			spanningCell.size.columns = 2;
			spanningCell.size.rows = 2;

			tableGridModel.setCellAtCoordinates(spanningCell, 1, 1);
			tableGridModel.setCellAtCoordinates(spanningCell, 1, 2);
			tableGridModel.setCellAtCoordinates(spanningCell, 2, 1);
			tableGridModel.setCellAtCoordinates(spanningCell, 2, 2);

			const success = tableDefinition.applyToDom(
				tableGridModel,
				tableNode,
				blueprint,
				stubFormat
			);
			chai.assert.isTrue(success);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), [
				'table',
				{ border: '1' },
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td', { colspan: '2', rowspan: '2' }], ['td']],
				['tr', ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']]
			]);
		});
	});

	describe('Selection', () => {
		it('moves the selection over to new <th> elements with an empty original <td>', () => {
			const tableGridModel = createTable(4, 4, true, documentNode);

			const cellWithSelection = tableGridModel.getCellAtCoordinates(0, 0);
			const cellElement = cellWithSelection.element;

			const positionId = blueprint.registerPosition(cellElement, 0, false);

			const success = tableDefinition.applyToDom(
				tableGridModel,
				tableNode,
				blueprint,
				stubFormat
			);
			chai.assert.isTrue(success);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			const position = blueprint.getPosition(positionId);
			chai.assert.deepEqual(position.container, tableNode.firstChild.firstChild);
			chai.assert.equal(position.offset, 0);
		});

		it('moves the selection over to new <th> elements with nodes inside the original <td>', () => {
			const tableGridModel = createTable(4, 4, true, documentNode);

			const cellWithSelection = tableGridModel.getCellAtCoordinates(0, 0);
			const cellElement = cellWithSelection.element;
			blueprint.appendChild(cellElement, documentNode.createTextNode('bla'));

			const positionId = blueprint.registerPosition(cellElement, 0, false);

			const success = tableDefinition.applyToDom(
				tableGridModel,
				tableNode,
				blueprint,
				stubFormat
			);
			chai.assert.isTrue(success);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			const position = blueprint.getPosition(positionId);
			chai.assert.deepEqual(position.container, tableNode.firstChild.firstChild);
			chai.assert.equal(position.offset, 0);
		});

		it('moves the non-collapsed selection over to new <th> elements with nodes inside the original <td>', () => {
			const tableGridModel = createTable(4, 4, true, documentNode);

			const cellWithSelection = tableGridModel.getCellAtCoordinates(0, 0);
			const cellElement = cellWithSelection.element;
			blueprint.appendChild(cellElement, documentNode.createTextNode('bla'));

			const startPositionId = blueprint.registerPosition(cellElement, 0, false);
			const endPositionId = blueprint.registerPosition(cellElement, 1, false);

			const success = tableDefinition.applyToDom(
				tableGridModel,
				tableNode,
				blueprint,
				stubFormat
			);
			chai.assert.isTrue(success);

			blueprint.realize();
			indicesManager.getIndexSet().commitMerge();
			const startPosition = blueprint.getPosition(startPositionId);
			const endPosition = blueprint.getPosition(endPositionId);
			chai.assert.deepEqual(startPosition.container, tableNode.firstChild.firstChild);
			chai.assert.equal(startPosition.offset, 0);
			chai.assert.deepEqual(endPosition.container, tableNode.firstChild.firstChild);
			chai.assert.equal(endPosition.offset, 1);
		});
	});
});
