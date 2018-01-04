import blueprints from 'fontoxml-blueprints';
import core from 'fontoxml-core';
import jsonMLMapper from 'fontoxml-dom-utils/jsonMLMapper';
import * as slimdom from 'slimdom';

import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/table-definition/XhtmlTableDefinition';

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
		},
		validator: {
			canContain: () => true
		}
	};

describe('XHTML tables: XML to XML roundtrip', () => {
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

		const tableDefinition = new XhtmlTableDefinition(options);
		const tableNode = documentNode.firstChild;
		const gridModel = tableDefinition.buildTableGridModel(tableNode, blueprint);
		chai.assert.isOk(gridModel);

		mutateGridModel(gridModel);

		const success = tableDefinition.applyToDom(gridModel, tableNode, blueprint, stubFormat);
		chai.assert.isTrue(success);

		blueprint.realize();
		chai.assert.deepEqual(jsonMLMapper.serialize(documentNode.firstChild), jsonOut);
	}

	describe('Without changes', () => {
		it('can handle a 1x1 table, changing nothing', () => {
			const jsonIn = ['table',
					['tr', ['td']]
				];

			const jsonOut = ['table',
					['tr', ['td']]
				];

			const options = {
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can handle a 4x4 table, changing nothing', () => {
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
					useTh: true
				};

			transformTable(jsonIn, jsonOut, options);
		});
	});

	describe('Header rows', () => {
		describe('th-based header', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

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

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

				const jsonOut = ['table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
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

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = ['table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
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

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = ['table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

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
		});

		describe('thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

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

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

				const jsonOut = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

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

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

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

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('th and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

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

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['th'], ['th'], ['th'], ['th']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

				const jsonOut = ['table',
						['thead',
							['tr', ['th'], ['th'], ['th'], ['th']],
							['tr', ['th'], ['th'], ['th'], ['th']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: true
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['th'], ['th'], ['th'], ['th']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

				const jsonOut = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: true
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['th'], ['th'], ['th'], ['th']],
							['tr', ['th'], ['th'], ['th'], ['th']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

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

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('tbody and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
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

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
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

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

				const jsonOut = ['table',
						['thead',
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

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
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

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
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
		});

		describe('tbody, th and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

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

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
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

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

				const jsonOut = ['table',
						['thead',
							['tr', ['th'], ['th'], ['th'], ['th']],
							['tr', ['th'], ['th'], ['th'], ['th']]
						],
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const options = {
						useThead: true,
						useTbody: true,
						useTh: true
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
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

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['th'], ['th'], ['th'], ['th']],
							['tr', ['th'], ['th'], ['th'], ['th']]
						],
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.decreaseHeaderRowCount();

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

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead, tbody and tfoot based', () => {
			it('can handle a 4x4 table (thead, tbody, tfoot), increasing the header row count by 1', () => {
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

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tfoot',
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.increaseHeaderRowCount(1);

				const jsonOut = ['table',
						['thead',
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

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
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

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 2 header rows, decreasing the header row count by 1', () => {
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
		});
	});

	describe('Insert row', () => {
		it('can handle a 4x4 table (tbody), adding 1 row before index 0', () => {
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

		it('can handle a 4x4 table (tbody), adding 1 row before index 2 (middle)', () => {
			const jsonIn = ['table',
					['tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					]

				];

			const mutateGridModel = (gridModel) => gridModel.insertRow(2, false);

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

		it('can handle a 4x4 table (tbody), adding 1 row after index 3 (last)', () => {
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

		it('can handle a 4x4 table (tbody, thead), adding 1 row before index 0', () => {
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

		it('can handle a 4x4 table (tbody, thead), adding 1 row after index 1 (last header row)', () => {
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
	});

	describe('Delete row', () => {
		describe('tbody based', () => {
			it('can handle a 4x4 table, deleting 1 row at index 0', () => {
				const jsonIn = ['table',
						['tbody',
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

			it('can handle a 4x4 table, deleting 1 row at index 2 (middle)', () => {
				const jsonIn = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(2);

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

			it('can handle a 4x4 table, deleting 1 row at index 3 (last)', () => {
				const jsonIn = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(3);

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

		describe('row based', () => {
			it('can handle a 4x4 table, deleting 1 row at index 0', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
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

			it('can handle a 4x4 table, deleting 1 row at index 2 (middle)', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(2);

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

			it('can handle a 4x4 table, deleting 1 row at index 3 (last)', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(3);

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
		});

		describe('th based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
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

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
				const jsonIn = ['table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = ['table',
						['tr', ['th'], ['th'], ['th'], ['th']],
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

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
				const jsonIn = ['table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(1);

				const jsonOut = ['table',
						['tr', ['th'], ['th'], ['th'], ['th']],
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

		describe('thead based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
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
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
				const jsonIn = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(1);

				const jsonOut = ['table',
						['thead',
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead and tbody based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
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

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
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

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = ['table',
						['thead',
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

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
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

				const mutateGridModel = (gridModel) => gridModel.deleteRow(1);

				const jsonOut = ['table',
						['thead',
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
		});
	});

	describe('Insert column', () => {
		describe('tbody based', () => {
			it('can handle a 4x4 table based, adding 1 column before index 0', () => {
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

			it('can handle a 4x4 table based, adding 1 column before index 2', () => {
				const jsonIn = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.insertColumn(2, false);

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

			it('can transform a 4x4 table based, adding 1 column after index 3', () => {
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
		});

		describe('row based', () => {
			it('can handle a 4x4 table based, adding 1 column before index 0', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.insertColumn(0, false);

				const jsonOut = ['table',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based, adding 1 column before index 2', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.insertColumn(2, false);

				const jsonOut = ['table',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based, adding 1 column after index 3', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.insertColumn(3, true);

				const jsonOut = ['table',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead and tbody based', () => {
			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 0', () => {
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

			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 2', () => {
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

				const mutateGridModel = (gridModel) => gridModel.insertColumn(2, false);

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

			it('can transform a 4x4 table based with 1 header row, adding 1 column after index 3', () => {
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
	});

	describe('Delete column', () => {
		describe('tbody based', () => {
			it('can handle a 4x4 table based, deleting 1 column at index 0', () => {
				const jsonIn = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteColumn(0);

				const jsonOut = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td']],
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

			it('can handle a 4x4 table based, deleting 1 column at index 2', () => {
				const jsonIn = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteColumn(2);

				const jsonOut = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td']],
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

			it('can transform a 4x4 table based, deleting 1 column at index 3', () => {
				const jsonIn = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteColumn(3);

				const jsonOut = ['table',
						['tbody',
							['tr', ['td'], ['td'], ['td']],
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

		describe('row based', () => {
			it('can handle a 4x4 table based, deleting 1 column at index 0', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteColumn(0);

				const jsonOut = ['table',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based, deleting 1 column at index 2', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteColumn(2);

				const jsonOut = ['table',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based, deleting 1 column at index 3', () => {
				const jsonIn = ['table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					];

				const mutateGridModel = (gridModel) => gridModel.deleteColumn(3);

				const jsonOut = ['table',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']]
					];

				const options = {
						useThead: true,
						useTbody: false,
						useTh: false
					};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead and tbody based', () => {
			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 0', () => {
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

			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 2', () => {
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

				const mutateGridModel = (gridModel) => gridModel.insertColumn(2, false);

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

			it('can transform a 4x4 table based with 1 header row, adding 1 column after index 3', () => {
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
	});

	describe('Merging cells', () => {
		it('can handle a 3x3 table, merging a cell with the cell above', () => {
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

		it('can handle a 3x3 table, merging a cell with the cell to the right', () => {
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

		it('can handle a 3x3 table, merging a cell with the cell below', () => {
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

		it('can handle a 3x3 table, merging a cell with a cell to the left', () => {
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

	describe('Split cells', () => {
		it('can handle a 3x3 table, splitting a cell spanning over rows', () => {
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

		it('can handle a 3x3 table, splitting a cell spanning over columns', () => {
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

	describe('Tables not conforming to settings (useThead, useTbody, useTh)', () => {
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
});
