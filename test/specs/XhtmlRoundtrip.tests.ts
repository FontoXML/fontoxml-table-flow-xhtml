import Blueprint from 'fontoxml-blueprints/src/Blueprint';
import CoreDocument from 'fontoxml-core/src/Document';
import namespaceManager from 'fontoxml-dom-namespaces/src/namespaceManager';
import jsonMLMapper from 'fontoxml-dom-utils/src/jsonMLMapper';
import indicesManager from 'fontoxml-indices/src/indicesManager';
import evaluateXPathToBoolean from 'fontoxml-selectors/src/evaluateXPathToBoolean';
import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/src/table-definition/XhtmlTableDefinition';
import mergeCells from 'fontoxml-table-flow/src/TableGridModel/mutations/merging/mergeCells';
import splitNonSpanningCell from 'fontoxml-table-flow/src/TableGridModel/mutations/splitting/splitNonSpanningCell';
import splitSpanningCell from 'fontoxml-table-flow/src/TableGridModel/mutations/splitting/splitSpanningCell';
import * as slimdom from 'slimdom';

const mergeCellWithCellToTheRight = mergeCells.mergeCellWithCellToTheRight;
const mergeCellWithCellToTheLeft = mergeCells.mergeCellWithCellToTheLeft;
const mergeCellWithCellBelow = mergeCells.mergeCellWithCellBelow;
const mergeCellWithCellAbove = mergeCells.mergeCellWithCellAbove;

const splitSpanningCellIntoRows = splitSpanningCell.splitCellIntoRows;
const splitSpanningCellIntoColumns = splitSpanningCell.splitCellIntoColumns;

const splitNonSpanningCellIntoRows =
	splitNonSpanningCell.splitNonSpanningCellIntoRows;

const stubFormat = {
	synthesizer: {
		completeStructure: (node, blueprint) => {
			// Column nodes should be the first nodes, after a non-col, we expect no more cols.
			return evaluateXPathToBoolean(
				'every $node in ./* satisfies if (name($node) != "col") then $node/following-sibling::col => empty() else true()',
				node,
				blueprint
			);
		},
	},
	metadata: {
		get: (_option, _node) => false,
	},
	validator: {
		canContain: () => true,
		validateDown: () => [],
	},
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

	function transformTable(
		jsonIn,
		jsonOut,
		options = {},
		mutateGridModel = () => {}
	) {
		coreDocument.dom.mutate(() => jsonMLMapper.parse(jsonIn, documentNode));

		const tableDefinition = new XhtmlTableDefinition(options);
		const tableNode = documentNode.firstChild;
		const gridModel = tableDefinition.buildTableGridModel(
			tableNode,
			blueprint
		);
		chai.assert.isUndefined(gridModel.error);

		mutateGridModel(gridModel);

		const success = tableDefinition.applyToDom(
			gridModel,
			tableNode,
			blueprint,
			stubFormat
		);
		chai.assert.isTrue(success);

		blueprint.realize();
		// The changes will be set to merge with the base index, this needs to be commited.
		indicesManager.getIndexSet().commitMerge();
		chai.assert.deepEqual(
			jsonMLMapper.serialize(documentNode.firstChild),
			jsonOut
		);
	}

	describe('Without changes', () => {
		it('can handle a 1x1 table, changing nothing', () => {
			const jsonIn = ['table', ['tr', ['td']]];

			const jsonOut = ['table', ['tr', ['td']]];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can handle a 4x4 table, changing nothing', () => {
			const jsonIn = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options);
		});
	});

	describe('Header rows', () => {
		describe('th-based header', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('th and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table using prefixes, changing nothing', () => {
				namespaceManager.clear();
				namespaceManager.addNamespace(
					'xhtml',
					'http://www.w3.org/1999/xhtml'
				);

				const jsonIn = [
					'xhtml:table',
					{ 'xmlns:xhtml': 'http://www.w3.org/1999/xhtml' },
					[
						'xhtml:thead',
						[
							'xhtml:tr',
							['xhtml:th'],
							['xhtml:th'],
							['xhtml:th'],
							['xhtml:th'],
						],
					],
					[
						'xhtml:tbody',
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
					],
				];

				let gridModel;
				const callback = (gm) => {
					gridModel = gm;
				};

				const jsonOut = [
					'xhtml:table',
					{ 'xmlns:xhtml': 'http://www.w3.org/1999/xhtml' },

					[
						'xhtml:thead',
						[
							'xhtml:tr',
							['xhtml:th'],
							['xhtml:th'],
							['xhtml:th'],
							['xhtml:th'],
						],
					],
					[
						'xhtml:tbody',
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
					],
				];

				const options = {
					table: {
						namespaceURI: 'http://www.w3.org/1999/xhtml',
					},
					shouldCreateColumnSpecificationNodes: false,
					useTh: true,
					useTbody: true,
					useThead: true,
				};

				transformTable(jsonIn, jsonOut, options, callback);
				chai.assert.isNotNull(
					gridModel.getCellAtCoordinates(0, 0).element.parentNode
				);
			});

			it('can handle a 4x4 table using prefixes, changing nodenames', () => {
				namespaceManager.clear();
				namespaceManager.addNamespace(
					'xhtml',
					'http://www.w3.org/1999/xhtml'
				);

				const jsonIn = [
					'xhtml:table',
					{ 'xmlns:xhtml': 'http://www.w3.org/1999/xhtml' },

					[
						'xhtml:thead',
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
					],
					[
						'xhtml:tbody',
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
					],
				];

				let gridModel;
				const callback = (gm) => {
					gridModel = gm;
				};

				const jsonOut = [
					'xhtml:table',
					{ 'xmlns:xhtml': 'http://www.w3.org/1999/xhtml' },

					[
						'xhtml:thead',
						[
							'xhtml:tr',
							['xhtml:th'],
							['xhtml:th'],
							['xhtml:th'],
							['xhtml:th'],
						],
					],
					[
						'xhtml:tbody',
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
						[
							'xhtml:tr',
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
							['xhtml:td'],
						],
					],
				];

				const options = {
					table: {
						namespaceURI: 'http://www.w3.org/1999/xhtml',
					},
					shouldCreateColumnSpecificationNodes: false,
					// The following setting causes all element names to change around
					useTh: true,
					useTbody: true,
					useThead: true,
				};

				transformTable(jsonIn, jsonOut, options, callback);
				for (let width = 0; width < 3; ++width) {
					for (let height = 0; height < 4; ++height) {
						chai.assert.isNotNull(
							gridModel.getCellAtCoordinates(height, width)
								.element.parentNode,
							`Cell at (${height};${width}) is still in the document`
						);
					}
				}
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					[
						'thead',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('tbody and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('tbody, th and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					[
						'thead',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
					],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
					],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead, tbody and tfoot based', () => {
			it('can handle a 4x4 table (thead, tbody, tfoot), increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 1 header row, increasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.increaseHeaderRowCount(1);

				const jsonOut = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tbody', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});
	});

	describe('Insert row', () => {
		it('can handle a 4x4 table (tbody), adding 1 row before index 0', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				gridModel.insertRow(0, false);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 4x4 table (tbody), adding 1 row before index 2 (middle)', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				gridModel.insertRow(2, false);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 4x4 table (tbody), adding 1 row after index 3 (last)', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) => gridModel.insertRow(3, true);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 4x4 table (tbody, thead), adding 1 row before index 0', () => {
			const jsonIn = [
				'table',
				[
					'thead',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				gridModel.insertRow(0, false);

			const jsonOut = [
				'table',
				[
					'thead',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 4x4 table (tbody, thead), adding 1 row after index 1 (last header row)', () => {
			const jsonIn = [
				'table',
				[
					'thead',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) => gridModel.insertRow(1, true);

			const jsonOut = [
				'table',
				[
					'thead',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('inserts row under the last header row with td cells', () => {
			const jsonIn = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				['tr', ['td'], ['td'], ['td', '1x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				['tr', ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td', '1x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: false,
				useTh: false,
			};

			const mutateGridModel = (gridModel) => gridModel.insertRow(1, true);

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('inserts header row under the last header row with th cells', () => {
			const jsonIn = [
				'table',
				['thead', ['tr', ['th'], ['th'], ['th']]],
				['tr', ['td'], ['td'], ['td', '1x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				[
					'thead',
					['tr', ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th']],
				],
				['tr', ['td'], ['td'], ['td', '1x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: false,
				useTh: true,
			};

			const mutateGridModel = (gridModel) => gridModel.insertRow(1, true);

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('inserts header row under the header row with th cells and normalize thead', () => {
			const jsonIn = [
				'table',
				['thead', ['tr', ['th'], ['th'], ['th', '0x2']]],
				['tr', ['th'], ['th'], ['th', '1x2']],
				['tr', ['td'], ['td'], ['td', '2x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['tr', ['th'], ['th'], ['th', '0x2']],
				['tr', ['th'], ['th'], ['th']],
				['tr', ['th'], ['th'], ['th', '1x2']],
				['tr', ['td'], ['td'], ['td', '2x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			const mutateGridModel = (gridModel) => gridModel.insertRow(1, true);

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('Delete row', () => {
		describe('tbody based', () => {
			it('can handle a 4x4 table, deleting 1 row at index 0', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table, deleting 1 row at index 2 (middle)', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(2);

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table, deleting 1 row at index 3 (last)', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(3);

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('row based', () => {
			it('can handle a 4x4 table, deleting 1 row at index 0', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table, deleting 1 row at index 2 (middle)', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(2);

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table, deleting 1 row at index 3 (last)', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(3);

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('th based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
				const jsonIn = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
				const jsonIn = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
				const jsonIn = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(1);

				const jsonOut = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: false,
					useTbody: false,
					useTh: true,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(1);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead and tbody based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(0);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
				const jsonIn = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) => gridModel.deleteRow(1);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});
	});

	describe('Insert column', () => {
		describe('tbody based', () => {
			describe('without colspecs', () => {
				it('can handle a 4x4 table based, adding 1 column before index 0', () => {
					const jsonIn = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(0, false);

					const jsonOut = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: true,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can handle a 4x4 table based, adding 1 column before index 2', () => {
					const jsonIn = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(2, false);

					const jsonOut = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: true,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can transform a 4x4 table based, adding 1 column after index 3', () => {
					const jsonIn = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(3, true);

					const jsonOut = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: true,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});
			});

			describe('with colspecs', () => {
				it('can handle a 4x4 table based, adding 1 column before index 0', () => {
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

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(0, false);

					const jsonOut = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['col'],
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
						useThead: true,
						useTbody: true,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can handle a 4x4 table based, adding 1 column before index 2', () => {
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

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(2, false);

					const jsonOut = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['col'],
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
						useThead: true,
						useTbody: true,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can transform a 4x4 table based, adding 1 column after index 3', () => {
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

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(3, true);

					const jsonOut = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['col'],
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
						useThead: true,
						useTbody: true,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});
			});
		});

		describe('row based', () => {
			describe('without colspecs', () => {
				it('can handle a 4x4 table based, adding 1 column before index 0', () => {
					const jsonIn = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(0, false);

					const jsonOut = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can handle a 4x4 table based, adding 1 column before index 2', () => {
					const jsonIn = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(2, false);

					const jsonOut = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can transform a 4x4 table based, adding 1 column after index 3', () => {
					const jsonIn = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(3, true);

					const jsonOut = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});
			});

			describe('with colspecs', () => {
				it('can handle a 4x4 table based, adding 1 column before index 0', () => {
					const jsonIn = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(0, false);

					const jsonOut = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['col'],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: true,
						useThead: true,
						useTbody: false,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can handle a 4x4 table based, adding 1 column before index 2', () => {
					const jsonIn = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(2, false);

					const jsonOut = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['col'],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: true,
						useThead: true,
						useTbody: false,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can transform a 4x4 table based, adding 1 column after index 3', () => {
					const jsonIn = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel) =>
						gridModel.insertColumn(3, true);

					const jsonOut = [
						'table',
						['col'],
						['col'],
						['col'],
						['col'],
						['col'],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					];

					const options = {
						shouldCreateColumnSpecificationNodes: true,
						useThead: true,
						useTbody: false,
						useTh: false,
					};

					transformTable(jsonIn, jsonOut, options, mutateGridModel);
				});
			});
		});

		describe('thead and tbody based', () => {
			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 0', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.insertColumn(0, false);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 2', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.insertColumn(2, false);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based with 1 header row, adding 1 column after index 3', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.insertColumn(3, true);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});
	});

	describe('Delete column', () => {
		describe('tbody based', () => {
			it('can handle a 4x4 table based, deleting 1 column at index 0', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.deleteColumn(0);

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based, deleting 1 column at index 2', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.deleteColumn(2);

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based, deleting 1 column at index 3', () => {
				const jsonIn = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.deleteColumn(3);

				const jsonOut = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('row based', () => {
			it('can handle a 4x4 table based, deleting 1 column at index 0', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.deleteColumn(0);

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based, deleting 1 column at index 2', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.deleteColumn(2);

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based, deleting 1 column at index 3', () => {
				const jsonIn = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.deleteColumn(3);

				const jsonOut = [
					'table',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: false,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead and tbody based', () => {
			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 0', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.insertColumn(0, false);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 2', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.insertColumn(2, false);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based with 1 header row, adding 1 column after index 3', () => {
				const jsonIn = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel) =>
					gridModel.insertColumn(3, true);

				const jsonOut = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td'], ['td']],
					],
				];

				const options = {
					shouldCreateColumnSpecificationNodes: false,
					useThead: true,
					useTbody: true,
					useTh: false,
				};

				transformTable(jsonIn, jsonOut, options, mutateGridModel);
			});
		});
	});

	describe('Merging cells', () => {
		it('can handle a 3x3 table, merging a cell with the cell above', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				mergeCellWithCellAbove(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1),
					blueprint
				);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td', { rowspan: '2' }], ['td']],
					['tr', ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, merging a cell with the cell to the right', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				mergeCellWithCellToTheRight(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1),
					blueprint
				);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td', { colspan: '2' }]],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, merging a cell with the cell below', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				mergeCellWithCellBelow(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1),
					blueprint
				);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td', { rowspan: '2' }], ['td']],
					['tr', ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, merging a cell with a cell to the left', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				mergeCellWithCellToTheLeft(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1),
					blueprint
				);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td', { colspan: '2' }], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('Split cells', () => {
		it('can handle a 3x3 table, splitting a cell spanning over rows', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td', { rowspan: '2' }], ['td']],
					['tr', ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				splitSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1)
				);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, splitting a cell at the end of the thead', () => {
			const jsonIn = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				splitNonSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(0, 1)
				);

			const jsonOut = [
				'table',
				[
					'thead',
					[
						'tr',
						['td', { rowspan: '2' }],
						['td'],
						['td', { rowspan: '2' }],
					],
					['tr', ['td']],
				],

				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, splitting a cell at the start of the body', () => {
			const jsonIn = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				splitNonSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1)
				);

			const jsonOut = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],

				[
					'tbody',
					[
						'tr',
						['td', { rowspan: '2' }],
						['td'],
						['td', { rowspan: '2' }],
					],
					['tr', ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, splitting a cell at the end of the body', () => {
			const jsonIn = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				splitNonSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(2, 1)
				);

			const jsonOut = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],

				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					[
						'tr',
						['td', { rowspan: '2' }],
						['td'],
						['td', { rowspan: '2' }],
					],
					['tr', ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, splitting a cell spanning over columns', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td', { colspan: '2' }]],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel) =>
				splitSpanningCellIntoColumns(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1)
				);

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can split the cell in only header row into rows', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th', '0x1']],
				['tr', ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['tr', ['th', { rowspan: '2' }], ['th', '0x1']],
				['tr', ['th']],
				['tr', ['td'], ['td']],
			];

			const mutateGridModel = (gridModel) =>
				splitNonSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(0, 1)
				);

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('Tables not conforming to settings (useThead, useTbody, useTh, useBorders, shouldCreateColumnSpecificationNodes)', () => {
		it('can transform a table based on thead, tbody, tfoot with 1 header row to a table based on rows only', () => {
			const jsonIn = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
			];

			const jsonOut = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows to a table based on tbody', () => {
			const jsonIn = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows to a table based on rows', () => {
			const jsonIn = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: false,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on rows with a header defined by thead', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: false,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table without cols to one with cols', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['col'],
				['col'],
				['col'],
				['col'],
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: true,
				useThead: false,
				useTbody: false,
				useTh: true,
				useBorders: false,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on rows with a header defined by both thead and th', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on tbody and a header defined by thead', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: false,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on tbody and a header defined by both thead and th', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can transform a table based on multiple tbody elements', () => {
			const jsonIn = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const jsonOut = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: true,
				useTbody: true,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options);
		});

		it('can turn borders off', () => {
			const jsonIn = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useTh: true,
				useBorders: false,
			};

			transformTable(jsonIn, jsonOut, options);
		});
	});

	describe('Keeps previously set @align and @valign attributes intact', () => {
		it('can add a row to a table having col elements with @align and @valign attributes', () => {
			const jsonIn = [
				'table',
				['col', { align: 'center', valign: 'middle' }],
				['col', { align: 'center', valign: 'middle' }],
				['col', { align: 'center', valign: 'middle' }],
				['col', { align: 'center', valign: 'middle' }],
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const mutateGridModel = (gridModel) =>
				gridModel.insertRow(2, false);

			const jsonOut = [
				'table',
				['col', { align: 'center', valign: 'middle' }],
				['col', { align: 'center', valign: 'middle' }],
				['col', { align: 'center', valign: 'middle' }],
				['col', { align: 'center', valign: 'middle' }],
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: true,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can add a row to a table having col elements with each having a different configuration of @align and @valign attributes', () => {
			const jsonIn = [
				'table',
				['col', { align: 'center' }],
				['col', { valign: 'middle' }],
				['col', { align: 'left', valign: 'top' }],
				['col'],
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const mutateGridModel = (gridModel) =>
				gridModel.insertRow(2, false);

			const jsonOut = [
				'table',
				['col', { align: 'center' }],
				['col', { valign: 'middle' }],
				['col', { align: 'left', valign: 'top' }],
				['col'],
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: true,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('does not add @align or @valign attributes on a table starting without col elements', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const mutateGridModel = (gridModel) =>
				gridModel.insertRow(2, false);

			const jsonOut = [
				'table',
				['col'],
				['col'],
				['col'],
				['col'],
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: true,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('does not add @align or @valign attributes on a table starting with "empty" col elements', () => {
			const jsonIn = [
				'table',
				['col'],
				['col'],
				['col'],
				['col'],
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const mutateGridModel = (gridModel) =>
				gridModel.insertRow(2, false);

			const jsonOut = [
				'table',
				['col'],
				['col'],
				['col'],
				['col'],
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: true,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('borders', () => {
		it('can turn borders on', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				{ border: '1' },
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useBorders: true,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options, (gridModel) => {
				gridModel.tableSpecification.borders = true;
				gridModel.giveCellsBorders();
			});
		});

		it('can turn borders off', () => {
			const jsonIn = [
				'table',
				{ border: '1' },
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				{ border: '0' },
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useBorders: true,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options, (gridModel) => {
				gridModel.tableSpecification.borders = false;
				gridModel.makeCellsBorderless();
			});
		});

		it('can leave borders off (as default)', () => {
			const jsonIn = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useBorders: true,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			transformTable(jsonIn, jsonOut, options, (gridModel) => {
				gridModel.tableSpecification.borders = false;
				gridModel.makeCellsBorderless();
			});
		});
	});
});
