import blueprints from 'fontoxml-blueprints';
import core from 'fontoxml-core';
import jsonMLMapper from 'fontoxml-dom-utils/jsonMLMapper';
import tableFlow from 'fontoxml-table-flow';
import tableStructureManager from 'fontoxml-table-flow/tableStructureManager';
import * as slimdom from 'slimdom';

import createDefaultRowSpec from 'fontoxml-table-flow-xhtml/tableStructure/specs/createDefaultRowSpec';
import createDefaultColSpec from 'fontoxml-table-flow-xhtml/tableStructure/specs/createDefaultColSpec';
import createDefaultCellSpec from 'fontoxml-table-flow-xhtml/tableStructure/specs/createDefaultCellSpec';
import tableGridModelToXhtmlTable from 'fontoxml-table-flow-xhtml/tableStructure/tableGridModelToXhtmlTable';
import XhtmlTableStructure from 'fontoxml-table-flow-xhtml/tableStructure/XhtmlTableStructure';

const Blueprint = blueprints.Blueprint;
const CoreDocument = core.Document;
const createNewTableCreater = tableFlow.primitives.createNewTableCreater;

const stubFormat = {
		synthesizer: {
			completeStructure: () => true
		},
		metadata: {
			get: (_option, _node) => false
		}
	};

const createTable = createNewTableCreater('td', createDefaultRowSpec, createDefaultColSpec, createDefaultCellSpec);

describe('tableGridModelToXhtmlTable', () => {
	let documentNode,
		coreDocument,
		blueprint,
		tableNode,
		xhtmlTableStructure;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		coreDocument = new CoreDocument(documentNode);

		blueprint = new Blueprint(coreDocument.dom);

		tableNode = documentNode.createElement('table');

		xhtmlTableStructure = new XhtmlTableStructure({});
		tableStructureManager.addTableStructure(xhtmlTableStructure);

		coreDocument.dom.mutate(() => {
			// tableNode.appendChild(tbodyNode);
			documentNode.appendChild(tableNode);
		});
	});

	it('can serialize a table in a basic one by one GridModel to an actual table', () => {
		const tableGridModel = createTable(1, 1, true, documentNode);

		const success = tableGridModelToXhtmlTable(xhtmlTableStructure, tableGridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
		chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild),
			['table',
				{ border: '1' },
				['tr',
					['td']
				]
			]);
	});

	it('can serialize a table in a basic n by n GridModel to an actual xhtml table', () => {
		const tableGridModel = createTable(4, 4, true, documentNode);

		const success = tableGridModelToXhtmlTable(xhtmlTableStructure, tableGridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
		chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild),
			['table',
				{ border: '1' },
				['tr',
					['th'],
					['th'],
					['th'],
					['th']
				],
				['tr',
					['td'],
					['td'],
					['td'],
					['td']
				],
				['tr',
					['td'],
					['td'],
					['td'],
					['td']
				],
				['tr',
					['td'],
					['td'],
					['td'],
					['td']
				]
			]);
	});

	it('can serialize a table in a GridModel containing colspans to an actual xhtml table', () => {
		const tableGridModel = createTable(4, 4, true, documentNode);

		const spanningCell = tableGridModel.getCellAtCoordinates(1, 1);
		spanningCell.size.rows = 2;
		spanningCell.size.columns = 2;

		tableGridModel.setCellAtCoordinates(spanningCell, 1, 1);
		tableGridModel.setCellAtCoordinates(spanningCell, 1, 2);
		tableGridModel.setCellAtCoordinates(spanningCell, 2, 1);
		tableGridModel.setCellAtCoordinates(spanningCell, 2, 2);

		const success = tableGridModelToXhtmlTable(xhtmlTableStructure, tableGridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
		chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild),
			['table',
				{ border: '1' },
				['tr',
					['th'],
					['th'],
					['th'],
					['th']
				],
				['tr',
					['td'],
					['td', { colspan: '2', rowspan: '2' }],
					['td']
				],
				['tr',
					['td'],
					['td']
				],
				['tr',
					['td'],
					['td'],
					['td'],
					['td']
				]
			]);
	});

	it('moves the selection over to new <th> elements with an empty original <td>', () => {
		const tableGridModel = createTable(4, 4, true, documentNode);

		const cellWithSelection = tableGridModel.getCellAtCoordinates(0, 0);
		const cellElement = cellWithSelection.element;

		const positionId = blueprint.registerPosition(cellElement, 0, false);

		const success = tableGridModelToXhtmlTable(xhtmlTableStructure, tableGridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
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

		const success = tableGridModelToXhtmlTable(xhtmlTableStructure, tableGridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
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

		const success = tableGridModelToXhtmlTable(xhtmlTableStructure, tableGridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
		const startPosition = blueprint.getPosition(startPositionId);
		const endPosition = blueprint.getPosition(endPositionId);
		chai.assert.deepEqual(startPosition.container, tableNode.firstChild.firstChild);
		chai.assert.equal(startPosition.offset, 0);
		chai.assert.deepEqual(endPosition.container, tableNode.firstChild.firstChild);
		chai.assert.equal(endPosition.offset, 1);
	});
});
