import blueprints from 'fontoxml-blueprints';
import core from 'fontoxml-core';
import jsonMLMapper from 'fontoxml-dom-utils/jsonMLMapper';
import * as slimdom from 'slimdom';

import XhtmlTableStructure from 'fontoxml-table-flow-xhtml/tableStructure/XhtmlTableStructure';

const Blueprint = blueprints.Blueprint;
const CoreDocument = core.Document;

describe('buildGridModel()', () => {
	let documentNode,
		coreDocument,
		blueprint,
		tableStructure;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		coreDocument = new CoreDocument(documentNode);

		blueprint = new Blueprint(coreDocument.dom);
		tableStructure = new XhtmlTableStructure({});
	});

	describe('Basic tables', () => {
		it('can build a gridModel from a 4x4 XHTML table', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having 1 header row defined by th', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['th'], ['th'], ['th'], ['th'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having 2 header rows defined by th', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['th'], ['th'], ['th'], ['th'] ],
					['tr', ['th'], ['th'], ['th'], ['th'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 2, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having 1 header row and rows with leading header cells', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['th'], ['th'], ['th'], ['th'] ],
					['tr', ['th'], ['td'], ['td'], ['td'] ],
					['tr', ['th'], ['td'], ['td'], ['td'] ],
					['tr', ['th'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having 1 header row defined by th and 1 footer row defined by th', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['th'], ['th'], ['th'], ['th'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['th'], ['th'], ['th'], ['th'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having a tbody', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having a tbody and 1 header row defined by th, this is an invalid XHTML table', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['th'], ['th'], ['th'], ['th'] ],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having a tbody and 1 header row defined by thead', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having 2 tbody\'s and 1 header row defined by thead', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having a tbody, 1 header row defined by thead and 1 footer row defined by tfoot', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					],
					['tfoot',
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having a tbody and 2 header rows defined by thead', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 2, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having a tbody and 1 header row defined by both thead and th', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['thead',
						['tr', ['th'], ['th'], ['th'], ['th'] ]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');
		});

		it('can build a gridModel from a 4x4 XHTML table having a tbody and 2 header rows defined by thead, containing comments and processing instructions', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['thead',
						['?someProcessingInstruction', 'someContent'],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['?someProcessingInstruction', 'someContent']
					],
					['tbody',
						['tr', ['td'], ['td'], ['!', 'some comment'], ['td'], ['td'] ],
						['tr', ['!', 'some comment'], ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 2, 'headerRowCount');
		});
	});

	describe('colSpans', () => {
		it('can build a gridModel from a 4x4 XHTML table containing a colspan on the first row', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['td', { colspan: 2 }], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');

			const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
			const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
			chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
		});

		it('can build a gridModel from a 4x4 XHTML table containing a colspan on the first row (th)', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['th', { colspan: 2 }], ['th'], ['th'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');

			const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
			const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
			chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
		});

		it('can build a gridModel from a 4x4 XHTML table containing a colspan on the first row (tbody)', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tbody',
						['tr', ['td', { colspan: 2 }], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');

			const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
			const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
			chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
		});

		it('can build a gridModel from a 4x4 XHTML table containing a colspan on the first row (tbody & thead)', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['thead',
						['tr', ['th', { colspan: 2 }], ['th'], ['th'] ]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ],
						['tr', ['td'], ['td'], ['td'], ['td'] ]
					]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');

			const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
			const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
			chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
		});

		it('throws when building a gridModel from a table containing incorrect spans', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['td', { colspan: 3 }], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			chai.assert.throws(tableStructure.buildGridModel.bind(undefined, tableElement, blueprint));
		});
	});

	describe('rowSpans', () => {
		it('can build a gridModel from a 4x4 XHTML table containing rowspans', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['td', { rowspan: 2 }], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');

			const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
			const secondSpanningCell = gridModel.getCellAtCoordinates(1, 0);
			chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
		});

		it('can build a gridModel from a 4x4 XHTML table containing rowspans', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['td', { rowspan: 2 }], ['td', { rowspan: 2 }], ['td', { rowspan: 2 }], ['td', { rowspan: 2 }] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');
		});

		it('throws when building a gridModel from a table containing incorrect rowspans', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['td', { rowspan: 3 }], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			chai.assert.throws(tableStructure.buildGridModel.bind(undefined, tableElement, blueprint));
		});
	});

	describe('colspans and rowspans', () => {
		it('can build a gridModel from a 4x4 XHTML table containing a rowspan and a colspan in the same cell', () => {
			coreDocument.dom.mutate(() => jsonMLMapper.parse(
				['table',
					['tr', ['td', { colspan: 2, rowspan: 2 }], ['td'], ['td'] ],
					['tr', ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			const gridModel = tableStructure.buildGridModel(tableElement, blueprint);
			chai.assert.isOk(gridModel);

			chai.assert.equal(gridModel.getHeight(), 4, 'height');
			chai.assert.equal(gridModel.getWidth(), 4, 'width');
			chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');

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
					['tr', ['td', { colspan: 3, rowspan: 3 }], ['td'], ['td'] ],
					['tr', ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ],
					['tr', ['td'], ['td'], ['td'], ['td'] ]
				], documentNode));

			const tableElement = documentNode.firstChild;
			chai.assert.throws(tableStructure.buildGridModel.bind(undefined, tableElement, blueprint));
		});
	});
});
