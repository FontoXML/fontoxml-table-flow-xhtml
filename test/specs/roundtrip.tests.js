import blueprints from 'fontoxml-blueprints';
import core from 'fontoxml-core';
import jsonMLMapper from 'fontoxml-dom-utils/jsonMLMapper';
import * as slimdom from 'slimdom';

import XhtmlTableStructure from 'fontoxml-table-flow-xhtml/tableStructure/XhtmlTableStructure';

import mergeCells from 'fontoxml-table-flow/TableGridModel/mutations/merging/mergeCells';
import splitSpanningCell from 'fontoxml-table-flow/TableGridModel/mutations/splitting/splitSpanningCell';

const mergeCellWithCellToTheRight = mergeCells.mergeCellWithCellToTheRight;
const mergeCellWithCellToTheLeft = mergeCells.mergeCellWithCellToTheLeft;
const mergeCellWithCellBelow = mergeCells.mergeCellWithCellBelow;
const mergeCellWithCellAbove = mergeCells.mergeCellWithCellAbove;

const splitCellIntoRows = splitSpanningCell.splitCellIntoRows;
const splitCellIntoColumns = splitSpanningCell.splitCellIntoColumns;

const Blueprint = blueprints.Blueprint;
const CoreDocument = core.Document;

const stubFormat = {
		synthesizer: {
			completeStructure: () => true
		},
		metadata: {
			get: (_option, _node) => false
		}
	};

describe('XHTML tables: XML to XML', () => {
	let documentNode;
	let coreDocument;
	let blueprint;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		coreDocument = new CoreDocument(documentNode);

		blueprint = new Blueprint(coreDocument.dom);
	});

	function transformTable (jsonIn, jsonOut, options = {}, mutateGridModel = () => {}) {
		coreDocument.dom.mutate(() => jsonMLMapper.parse(jsonIn, documentNode));

		const tableStructure = new XhtmlTableStructure(options);
		const tableNode = documentNode.firstChild;
		const gridModel = tableStructure.buildGridModel(tableNode, blueprint);
		chai.assert.isOk(gridModel);

		mutateGridModel(gridModel);

		const success = tableStructure.applyToDom(gridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
		chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), jsonOut);
	}

	describe('tables not conforming settings (useThead, useTbody, useTh)', () => {
		it('can transform a table based on rows to a table based on tbody', () => {
			const jsonIn = ['table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows to a table based on rows', () => {
			const jsonIn = ['table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const jsonOut = ['table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const options = {
					useThead: true,
					useTbody: false,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on rows with a header defined by thead', () => {
			const jsonIn = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const options = {
					useThead: true,
					useTbody: false,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on rows with a header defined by both thead and th', () => {
			const jsonIn = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const jsonOut = ['table',
					['thead',
						['tr', ['th'], ['th'], ['th'], ['th']]
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const options = {
					useThead: true,
					useTbody: false,
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on tbody and a header defined by thead', () => {
			const jsonIn = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on tbody and a header defined by both thead and th', () => {
			const jsonIn = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const jsonOut = ['table',
					['thead',
						['tr', ['th'], ['th'], ['th'], ['th']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on multiple tbody elements', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options);
		});
	});

	describe('increasing/decreasing header row count', () => {
		it('can transform a table based on thead, tbody, tfoot with 1 header row to a table based on rows only', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot',
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const jsonOut = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const options = {
					useThead: false,
					useTbody: false,
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on thead, tbody, tfoot with 1 header row, removing 1 header row', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot',
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on thead, tbody, tfoot without header row, adding 1 header row', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot',
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on thead, tbody, tfoot with 2 header rows, removing 1 header row', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tfoot',
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on thead and tbody with 2 header rows, adding 1 header row', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, thead and th, removing 1 header row', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['th'], ['th'], ['th'], ['th']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

			const jsonOut = ['table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const options = {
					useThead: false,
					useTbody: false,
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('insert row', () => {
		it('can transform a table based on tbody, adding 1 row before index 0', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]

				];

			const mutateGridModel = (gridModel) => gridModel.insertRow(0, false);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, adding 1 row after index 3 (last)', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.insertRow(3, true);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody and thead, adding 1 row in the thead before index 0', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.insertRow(0, false);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody and thead, adding 1 row in the thead after index 1 (last header row)', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.insertRow(1, true);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on rows, containing a header column, adding 1 row after index 3 (last row)', () => {
			const jsonIn = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['td'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td'], ['td']]
				];

			const mutateGridModel = (gridModel) => gridModel.insertRow(3, true);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['th'], ['td'], ['td'], ['td']],
						['tr', ['th'], ['td'], ['td'], ['td']],
						['tr', ['th'], ['td'], ['td'], ['td']],
						['tr', ['th'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('remove row', () => {
		it('can transform a table based on tbody, removing 1 row at index 0', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, removing 1 row at index 4 (last)', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteRow(4);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on rows, removing 1 row in the header at index 0', () => {
			const jsonIn = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

			const jsonOut = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const options = {
					useThead: false,
					useTbody: false,
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on rows, removing 1 row in the header at index 1 (last header row)', () => {
			const jsonIn = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteRow(1);

			const jsonOut = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const options = {
					useThead: false,
					useTbody: false,
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on rows, removing 1 row in the header at index 0 (header should be gone)', () => {
			const jsonIn = ['table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

			const jsonOut = ['table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']]
				];

			const options = {
					useThead: false,
					useTbody: false,
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody and thead, removing 1 row in the thead at index 0', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody and thead, removing 1 row in the thead at index 1 (last header row)', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteRow(1);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody and thead, removing 1 row in the thead at index 0 (header should collapse)', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('add column', () => {
		it('can transform a table based on tbody, adding 1 column at index 0', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.insertColumn(0, false);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, adding 1 column at index 3 (last column)', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.insertColumn(3, true);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on thead, tbody, adding 1 column at index 0', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.insertColumn(0, false);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on thead, tbody, adding 1 column at index 3 (last column)', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.insertColumn(3, true);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('remove column', () => {
		it('can transform a table based on tbody, removing 1 column at index 0', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteColumn(0);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, removing 1 column at index 4 (last column)', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteColumn(4);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on thead, tbody, removing 1 column at index 0', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteColumn(0);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on thead, tbody, removing 1 column at index 4 (last column)', () => {
			const jsonIn = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) => gridModel.deleteColumn(4);

			const jsonOut = ['table',
					['thead',
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('merge cell', () => {
		it('can transform a table based on tbody, merging the center cell with the cell above', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) =>
				mergeCellWithCellAbove(gridModel, gridModel.getCellAtCoordinates(1, 1), blueprint);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td', { rowspan: '2' }], ['td']],
						['tr', ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, merging the center cell with the cell to the right', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) =>
				mergeCellWithCellToTheRight(gridModel, gridModel.getCellAtCoordinates(1, 1), blueprint);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td', { colspan: '2' }]],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, merging the center cell with the cell below', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) =>
				mergeCellWithCellBelow(gridModel, gridModel.getCellAtCoordinates(1, 1), blueprint);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td', { rowspan: '2' }], ['td']],
						['tr', ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, merging the center cell with the cell to the left', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) =>
				mergeCellWithCellToTheLeft(gridModel, gridModel.getCellAtCoordinates(1, 1), blueprint);

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td', { colspan: '2' }], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('split cell', () => {
		it('can transform a table based on tbody, splitting a cell spanning over rows', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td', { rowspan: '2' }], ['td']],
						['tr', ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) =>
				splitCellIntoRows(gridModel, gridModel.getCellAtCoordinates(1, 1));

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can transform a table based on tbody, splitting a cell spanning over columns', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td', { colspan: '2' }]],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const mutateGridModel = (gridModel) =>
				splitCellIntoColumns(gridModel, gridModel.getCellAtCoordinates(1, 1));

			const jsonOut = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					]
				];

			const options = {
					useThead: true,
					useTbody: true,
					useTh: false
				};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});
});
