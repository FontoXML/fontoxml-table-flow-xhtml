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

describe('XHTML tables: Column Width', () => {
	let documentNode;
	let coreDocument;
	let blueprint;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		coreDocument = new CoreDocument(documentNode);

		blueprint = new Blueprint(coreDocument.dom);
	});

	function transformTable(jsonIn, jsonOut, options = {}, mutateGridModel = () => {}) {
		coreDocument.dom.mutate(() => jsonMLMapper.parse(jsonIn, documentNode));

		const tableDefinition = new XhtmlTableDefinition(options);
		const tableNode = documentNode.firstChild;
		const gridModel = tableDefinition.buildTableGridModel(tableNode, blueprint);
		chai.assert.isOk(gridModel);

		mutateGridModel(gridModel);

		const success = tableDefinition.applyToDom(gridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
		// The changes will be set to merge with the base index, this needs to be commited.
		indicesManager.getIndexSet().commitMerge();
		chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), jsonOut);
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
				['tr', ['td'], ['td'], ['td'], ['td']]
			]
		];

		const mutateGridModel = gridModel => gridModel.insertColumn(0, false);

		const jsonOut = [
			'table',
			{ border: '0' },
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
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
			]
		];

		const options = {
			shouldCreateColumnSpecificationNodes: true,
			columnWidthType: 'percentual',
			useThead: true,
			useTbody: true,
			useTh: false
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
				['tr', ['td'], ['td'], ['td'], ['td']]
			]
		];

		const mutateGridModel = gridModel => gridModel.insertColumn(0, false);

		const jsonOut = [
			'table',
			{ border: '0' },
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
				['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
			]
		];

		const options = {
			shouldCreateColumnSpecificationNodes: true,
			columnWidthType: 'relative',
			useThead: true,
			useTbody: true,
			useTh: false
		};

		transformTable(jsonIn, jsonOut, options, mutateGridModel);
	});
});
