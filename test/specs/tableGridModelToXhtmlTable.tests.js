import blueprints from 'fontoxml-blueprints';
import core from 'fontoxml-core';
import jsonMLMapper from 'fontoxml-dom-utils/jsonMLMapper';
import tableFlow from 'fontoxml-table-flow';
import TableStructureManager from 'fontoxml-table-flow/TableStructureManager';
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
		TableStructureManager.addTableStructure(xhtmlTableStructure);

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
});
