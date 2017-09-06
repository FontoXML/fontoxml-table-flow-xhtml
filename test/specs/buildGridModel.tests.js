import blueprints from 'fontoxml-blueprints';
import core from 'fontoxml-core';
import jsonMLMapper from 'fontoxml-dom-utils/jsonMLMapper';
import tableStructureManager from 'fontoxml-table-flow/tableStructureManager';
import * as slimdom from 'slimdom';

import buildGridModel from 'fontoxml-table-flow-xhtml/tableStructure/buildGridModel';
import XhtmlTableStructure from 'fontoxml-table-flow-xhtml/tableStructure/XhtmlTableStructure';

const Blueprint = blueprints.Blueprint;
const CoreDocument = core.Document;


describe('buildGridModel()', () => {
	let documentNode,
		coreDocument,
		blueprint,
		xhtmlTableStructure;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		coreDocument = new CoreDocument(documentNode);

		blueprint = new Blueprint(coreDocument.dom);
		xhtmlTableStructure = new XhtmlTableStructure({});

		tableStructureManager.addTableStructure(xhtmlTableStructure);
	});

	it('can build a gridModel from a basic XHTML table', () => {
		coreDocument.dom.mutate(() => jsonMLMapper.parse(
			['table',
				['thead',
					['tr',
						['th'],
						['th'],
						['th']
					]
				],
				['tbody',
					['tr',
						['td'],
						['td'],
						['td']
					],
					['tr',
						['td'],
						['td'],
						['td']
					],
					['tr',
						['td'],
						['td'],
						['td']
					]
				]
			], documentNode));

		const tableElement = documentNode.firstChild;
		const gridModel = buildGridModel(xhtmlTableStructure, tableElement, blueprint);
		chai.assert.isOk(gridModel);

		chai.assert.equal(gridModel.getHeight(), 4, 'height');
		chai.assert.equal(gridModel.getWidth(), 3, 'width');
	});

	it('can build a gridModel from a table containing comments and processing instructions', () => {
		coreDocument.dom.mutate(() => jsonMLMapper.parse(
			['table',
				['thead',
					['tr',
						['th'],
						['?someProcessingInstruction', 'someContent'],
						['th'],
						['th']
					]
				],
				['tbody',
					['tr',
						['td'],
						['td'],
						['!', 'some comment'],
						['td']
					],
					['tr',
						['td'],
						['td'],
						['td']
					],
					['tr',
						['td'],
						['td'],
						['td']
					]
				]
			], documentNode));

		const tableElement = documentNode.firstChild;
		const gridModel = buildGridModel(xhtmlTableStructure, tableElement, blueprint);
		chai.assert.isOk(gridModel);

		chai.assert.equal(gridModel.getHeight(), 4, 'height');
		chai.assert.equal(gridModel.getWidth(), 3, 'width');
	});

	describe('colSpans', () => {
		it('can build a gridModel from a table containing colspans on the first row', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr',
							['td', { colspan: 2 }],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = buildGridModel(xhtmlTableStructure, tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 3, 'height');
			chai.assert.equal(gridModel.getWidth(), 3, 'width');

			const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
			const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
			chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
		});

		it('can build a table containing a colspan on the first row (header)', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['thead',
						['tr',
							['th', { colspan: 2 }],
							['th']
						]
					],
					['tbody',
						['tr',
							['td'],
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = buildGridModel(xhtmlTableStructure, tableElement, blueprint);
			chai.assert.isOk(gridModel);
		});

		it('can build a gridModel from a table containing colspans but not all colspecs');

		it('throws when building a gridModel from a table containing incorrect spans', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr',
							['td', { colspan: 3 }],
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						]
					]
				], documentNode));

			const tableElement = documentNode.firstNode;
			chai.assert.throws(buildGridModel.bind(undefined, xhtmlTableStructure, tableElement, blueprint));
		});
	});

	describe('rowSpans', () => {
		it('can build a gridModel from a table containing rowspans', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr',
							['td', { rowspan: 2 }],
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = buildGridModel(xhtmlTableStructure, tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 3, 'height');
			chai.assert.equal(gridModel.getWidth(), 3, 'width');

			const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
			const secondSpanningCell = gridModel.getCellAtCoordinates(1, 0);
			chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
		});

		it('can build a gridModel from a table containing rowspans that overlap entire rows', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr',
							['td', { rowspan: 2 }],
							['td', { rowspan: 2 }],
							['td', { rowspan: 2 }]
						],
						['tr',
							['td'],
							['td'],
							['td']
						]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = buildGridModel(xhtmlTableStructure, tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 2, 'height');
			chai.assert.equal(gridModel.getWidth(), 3, 'width');
		});

		it('throws when building a gridModel from a table containing incorrect rowspans', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr',
							['td', { rowspan: 3 }],
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			chai.assert.throws(buildGridModel.bind(undefined, xhtmlTableStructure, tableElement, blueprint));
		});
	});

	describe('colspans and rowspans', () => {
		it('can build a gridModel from a table containing rowspans and colspans in the same cell', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr',
							['td', { colspan: 2, rowspan: 2 }],
							['td']
						],
						['tr',
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = buildGridModel(xhtmlTableStructure, tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 3, 'height');
			chai.assert.equal(gridModel.getWidth(), 3, 'width');

			const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
			const secondSpanningCell = gridModel.getCellAtCoordinates(1, 0);
			const thirdSpanningCell = gridModel.getCellAtCoordinates(0, 1);
			const fourthSpanningCell = gridModel.getCellAtCoordinates(1, 1);
			chai.assert.isOk(firstSpanningCell);
			chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
			chai.assert.deepEqual(secondSpanningCell.element, thirdSpanningCell.element);
			chai.assert.deepEqual(thirdSpanningCell.element, fourthSpanningCell.element);
		});

		it('throws when building a gridModel from a table containing incorrect rowspans and colspans', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr',
							['td', { colspan: 3, rowspan: 3 }],
							['td']
						],
						['tr',
							['td']
						],
						['tr',
							['td'],
							['td'],
							['td']
						]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			chai.assert.throws(buildGridModel.bind(undefined, xhtmlTableStructure, tableElement, blueprint));
		});
	});
});
