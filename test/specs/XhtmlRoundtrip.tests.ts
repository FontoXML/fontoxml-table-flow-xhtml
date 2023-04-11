import type Blueprint from 'fontoxml-blueprints/src/Blueprint';
import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint';
import type { IDomFacade } from 'fontoxml-blueprints/src/types';
import namespaceManager from 'fontoxml-dom-namespaces/src/namespaceManager';
import type {
	FontoElementNode,
	FontoNode,
	JsonMl,
} from 'fontoxml-dom-utils/src/types';
import evaluateXPathToBoolean from 'fontoxml-selectors/src/evaluateXPathToBoolean';
import xq from 'fontoxml-selectors/src/xq';
import { isTableGridModel } from 'fontoxml-table-flow/src/indexedTableGridModels';
import mergeCells from 'fontoxml-table-flow/src/TableGridModel/mutations/merging/mergeCells';
import splitNonSpanningCell from 'fontoxml-table-flow/src/TableGridModel/mutations/splitting/splitNonSpanningCell';
import splitSpanningCell from 'fontoxml-table-flow/src/TableGridModel/mutations/splitting/splitSpanningCell';
import type TableCell from 'fontoxml-table-flow/src/TableGridModel/TableCell';
import type TableGridModel from 'fontoxml-table-flow/src/TableGridModel/TableGridModel';
import type { TableElementsSharedOptions } from 'fontoxml-table-flow/src/types';
import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/src/table-definition/XhtmlTableDefinition';
import type { TableElementsXhtmlOptions } from 'fontoxml-table-flow-xhtml/src/types';
import { assertDocumentAsJsonMl } from 'fontoxml-unit-test-utils/src/unitTestAssertionHelpers';
import UnitTestEnvironment from 'fontoxml-unit-test-utils/src/UnitTestEnvironment';
import {
	findFirstNodeInDocument,
	runWithBlueprint,
} from 'fontoxml-unit-test-utils/src/unitTestSetupHelpers';

const mergeCellWithCellToTheRight = mergeCells.mergeCellWithCellToTheRight;
const mergeCellWithCellToTheLeft = mergeCells.mergeCellWithCellToTheLeft;
const mergeCellWithCellBelow = mergeCells.mergeCellWithCellBelow;
const mergeCellWithCellAbove = mergeCells.mergeCellWithCellAbove;

const splitSpanningCellIntoRows = splitSpanningCell.splitCellIntoRows;
const splitSpanningCellIntoColumns = splitSpanningCell.splitCellIntoColumns;

const splitNonSpanningCellIntoRows =
	splitNonSpanningCell.splitNonSpanningCellIntoRows;

function isValidNode(domFacade: IDomFacade, node: FontoNode): boolean {
	// Column nodes should be the first nodes, after a non-col, we expect no more cols.
	return evaluateXPathToBoolean(
		'every $node in ./* satisfies if (name($node) != "col") then $node/following-sibling::col => empty() else true()',
		node,
		domFacade
	);
}

describe('XHTML tables: XML to XML roundtrip', () => {
	let environment: UnitTestEnvironment;
	beforeEach(() => {
		environment = new UnitTestEnvironment();

		environment.stubMetadataProperties({
			'is-invalid-due-to-selector': (node, domFacade) =>
				isValidNode(domFacade, node) ? undefined : xq`true()`,
		});
	});
	afterEach(() => {
		environment.destroy();
	});

	function runTest(
		jsonIn: JsonMl,
		jsonOut: JsonMl,
		options: TableElementsSharedOptions & TableElementsXhtmlOptions = {},
		mutateGridModel: (
			tableGridModel: TableGridModel,
			blueprint: Blueprint
		) => void = () => {
			// Do nothing
		}
	): void {
		const documentId = environment.createDocumentFromJsonMl(jsonIn);
		const tableDefinition = new XhtmlTableDefinition(options);
		const tableNode = findFirstNodeInDocument(
			documentId,
			xq`//*:table`
		) as FontoElementNode;

		runWithBlueprint((blueprint, _, format) => {
			const gridModel = tableDefinition.buildTableGridModel(
				tableNode,
				blueprint
			);
			if (!isTableGridModel(gridModel)) {
				throw gridModel.error;
			}

			mutateGridModel(gridModel, blueprint);

			const success = tableDefinition.applyToDom(
				gridModel,
				tableNode,
				blueprint,
				format
			);
			chai.assert.isTrue(success);
		});

		assertDocumentAsJsonMl(documentId, jsonOut);
	}

	describe('Without changes', () => {
		it('can handle a 1x1 table, changing nothing', () => {
			runTest(['table', ['tr', ['td']]], ['table', ['tr', ['td']]], {
				shouldCreateColumnSpecificationNodes: false,
				useTh: true,
			});
		});

		it('can handle a 4x4 table, changing nothing', () => {
			runTest(
				[
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				[
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				{
					shouldCreateColumnSpecificationNodes: false,
					useTh: true,
				}
			);
		});
	});

	describe('Header rows', () => {
		describe('th-based header', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: false,
						useTbody: false,
						useTh: true,
					},
					(gridModel) => gridModel.increaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: false,
						useTbody: false,
						useTh: true,
					},
					(gridModel) => gridModel.increaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: false,
						useTbody: false,
						useTh: true,
					},
					(gridModel) => gridModel.decreaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: false,
						useTbody: false,
						useTh: true,
					},
					(gridModel) => gridModel.decreaseHeaderRowCount()
				);
			});
		});

		describe('thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: false,
					},
					(gridModel) => gridModel.increaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						[
							'thead',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: false,
					},
					(gridModel) => gridModel.increaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: false,
					},
					(gridModel) => gridModel.decreaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				runTest(
					[
						'table',
						[
							'thead',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: false,
					},
					(gridModel) => gridModel.decreaseHeaderRowCount()
				);
			});
		});

		describe('th and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: true,
					},
					(gridModel) => gridModel.increaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table using prefixes, changing nothing', () => {
				namespaceManager.clear();
				namespaceManager.addNamespace(
					'xhtml',
					'http://www.w3.org/1999/xhtml'
				);

				let gridModel: TableGridModel;
				runTest(
					[
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
					],
					[
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
					],
					{
						table: {
							namespaceURI: 'http://www.w3.org/1999/xhtml',
						},
						shouldCreateColumnSpecificationNodes: false,
						useTh: true,
						useTbody: true,
						useThead: true,
					},
					(gm) => {
						gridModel = gm;
					}
				);
				chai.assert.isNotNull(
					readOnlyBlueprint.getParentNode(
						(gridModel!.getCellAtCoordinates(0, 0) as TableCell)
							.element
					)
				);
			});

			it('can handle a 4x4 table using prefixes, changing nodenames', () => {
				namespaceManager.clear();
				namespaceManager.addNamespace(
					'xhtml',
					'http://www.w3.org/1999/xhtml'
				);

				let gridModel: TableGridModel;
				runTest(
					[
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
					],
					[
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
					],
					{
						table: {
							namespaceURI: 'http://www.w3.org/1999/xhtml',
						},
						shouldCreateColumnSpecificationNodes: false,
						// The following setting causes all element names to change around
						useTh: true,
						useTbody: true,
						useThead: true,
					},
					(gm) => {
						gridModel = gm;
					}
				);

				for (let width = 0; width < 3; ++width) {
					for (let height = 0; height < 4; ++height) {
						chai.assert.isNotNull(
							readOnlyBlueprint.getParentNode(
								(
									gridModel!.getCellAtCoordinates(
										height,
										width
									) as TableCell
								).element
							),
							`Cell at (${height};${width}) is still in the document`
						);
					}
				}
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						[
							'thead',
							['tr', ['th'], ['th'], ['th'], ['th']],
							['tr', ['th'], ['th'], ['th'], ['th']],
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: true,
					},
					(gridModel) => gridModel.increaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				runTest(
					[
						'table',
						['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: true,
					},
					(gridModel) => gridModel.decreaseHeaderRowCount()
				);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				runTest(
					[
						'table',
						[
							'thead',
							['tr', ['th'], ['th'], ['th'], ['th']],
							['tr', ['th'], ['th'], ['th'], ['th']],
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					[
						'table',
						['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					{
						shouldCreateColumnSpecificationNodes: false,
						useThead: true,
						useTbody: false,
						useTh: true,
					},
					(gridModel) => gridModel.decreaseHeaderRowCount()
				);
			});
		});

		describe('tbody and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.increaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.increaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
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

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('tbody, th and thead based', () => {
			it('can handle a 4x4 table, increasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.increaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, increasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.increaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
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

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		// Skip the tfoot tests until we have full footer row node support
		describe.skip('thead, tbody and tfoot based', () => {
			it('can handle a 4x4 table (thead, tbody, tfoot), increasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.increaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 1 header row, increasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.increaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 1 header row, decreasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table (thead, tbody, tfoot based) with 2 header rows, decreasing the header row count by 1', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tbody', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.decreaseHeaderRowCount();

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});
	});

	describe('Insert row', () => {
		it('can handle a 4x4 table (tbody), adding 1 row before index 0', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(0, false);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 4x4 table (tbody), adding 1 row before index 2 (middle)', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(2, false);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 4x4 table (tbody), adding 1 row after index 3 (last)', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(3, true);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 4x4 table (tbody, thead), adding 1 row before index 0', () => {
			const jsonIn: JsonMl = [
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

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(0, false);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 4x4 table (tbody, thead), adding 1 row after index 1 (last header row)', () => {
			const jsonIn: JsonMl = [
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

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(1, true);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('inserts row under the last header row with td cells', () => {
			const jsonIn: JsonMl = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				['tr', ['td'], ['td'], ['td', '1x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(1, true);
			};

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('inserts header row under the last header row with th cells', () => {
			const jsonIn: JsonMl = [
				'table',
				['thead', ['tr', ['th'], ['th'], ['th']]],
				['tr', ['td'], ['td'], ['td', '1x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(1, true);
			};

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('inserts header row under the header row with th cells and normalize thead', () => {
			const jsonIn: JsonMl = [
				'table',
				['thead', ['tr', ['th'], ['th'], ['th', '0x2']]],
				['tr', ['th'], ['th'], ['th', '1x2']],
				['tr', ['td'], ['td'], ['td', '2x2']],
				['tr', ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(1, true);
			};

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('Delete row', () => {
		describe('tbody based', () => {
			it('can handle a 4x4 table, deleting 1 row at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table, deleting 1 row at index 2 (middle)', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(2);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table, deleting 1 row at index 3 (last)', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(3);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('row based', () => {
			it('can handle a 4x4 table, deleting 1 row at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table, deleting 1 row at index 2 (middle)', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(2);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table, deleting 1 row at index 3 (last)', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(3);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('th based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(1);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'thead',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(1);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead and tbody based', () => {
			it('can handle 4x4 a table with 1 header row, deleting 1 row at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 0', () => {
				const jsonIn: JsonMl = [
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

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle 4x4 a table with 2 header rows, deleting 1 row at index 1', () => {
				const jsonIn: JsonMl = [
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

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteRow(1);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});
	});

	describe('Insert column', () => {
		describe('tbody based', () => {
			describe('without colspecs', () => {
				it('can handle a 4x4 table based, adding 1 column before index 0', () => {
					const jsonIn: JsonMl = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
					];

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(0, false);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can handle a 4x4 table based, adding 1 column before index 2', () => {
					const jsonIn: JsonMl = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
					];

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(2, false);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can transform a 4x4 table based, adding 1 column after index 3', () => {
					const jsonIn: JsonMl = [
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
					];

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(3, true);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});
			});

			describe('with colspecs', () => {
				it('can handle a 4x4 table based, adding 1 column before index 0', () => {
					const jsonIn: JsonMl = [
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
						gridModel.insertColumn(0, false);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can handle a 4x4 table based, adding 1 column before index 2', () => {
					const jsonIn: JsonMl = [
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
						gridModel.insertColumn(2, false);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can transform a 4x4 table based, adding 1 column after index 3', () => {
					const jsonIn: JsonMl = [
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
						gridModel.insertColumn(3, true);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});
			});
		});

		describe('row based', () => {
			describe('without colspecs', () => {
				it('can handle a 4x4 table based, adding 1 column before index 0', () => {
					const jsonIn: JsonMl = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(0, false);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can handle a 4x4 table based, adding 1 column before index 2', () => {
					const jsonIn: JsonMl = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(2, false);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can transform a 4x4 table based, adding 1 column after index 3', () => {
					const jsonIn: JsonMl = [
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					];

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(3, true);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});
			});

			describe('with colspecs', () => {
				it('can handle a 4x4 table based, adding 1 column before index 0', () => {
					const jsonIn: JsonMl = [
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

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(0, false);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can handle a 4x4 table based, adding 1 column before index 2', () => {
					const jsonIn: JsonMl = [
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

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(2, false);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});

				it('can transform a 4x4 table based, adding 1 column after index 3', () => {
					const jsonIn: JsonMl = [
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

					const mutateGridModel = (gridModel: TableGridModel) => {
						gridModel.insertColumn(3, true);
					};

					const jsonOut: JsonMl = [
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

					runTest(jsonIn, jsonOut, options, mutateGridModel);
				});
			});
		});

		describe('thead and tbody based', () => {
			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) => {
					gridModel.insertColumn(0, false);
				};

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 2', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) => {
					gridModel.insertColumn(2, false);
				};

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based with 1 header row, adding 1 column after index 3', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) => {
					gridModel.insertColumn(3, true);
				};

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});
	});

	describe('Delete column', () => {
		describe('tbody based', () => {
			it('can handle a 4x4 table based, deleting 1 column at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteColumn(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based, deleting 1 column at index 2', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteColumn(2);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based, deleting 1 column at index 3', () => {
				const jsonIn: JsonMl = [
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteColumn(3);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('row based', () => {
			it('can handle a 4x4 table based, deleting 1 column at index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteColumn(0);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based, deleting 1 column at index 2', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteColumn(2);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based, deleting 1 column at index 3', () => {
				const jsonIn: JsonMl = [
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				];

				const mutateGridModel = (gridModel: TableGridModel) =>
					gridModel.deleteColumn(3);

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});

		describe('thead and tbody based', () => {
			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 0', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) => {
					gridModel.insertColumn(0, false);
				};

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can handle a 4x4 table based with 1 header row, adding 1 column before index 2', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) => {
					gridModel.insertColumn(2, false);
				};

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});

			it('can transform a 4x4 table based with 1 header row, adding 1 column after index 3', () => {
				const jsonIn: JsonMl = [
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				];

				const mutateGridModel = (gridModel: TableGridModel) => {
					gridModel.insertColumn(3, true);
				};

				const jsonOut: JsonMl = [
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

				runTest(jsonIn, jsonOut, options, mutateGridModel);
			});
		});
	});

	describe('Merging cells', () => {
		it('can handle a 3x3 table, merging a cell with the cell above', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (
				gridModel: TableGridModel,
				blueprint: Blueprint
			) =>
				mergeCellWithCellAbove(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1) as TableCell,
					blueprint
				);

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, merging a cell with the cell to the right', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (
				gridModel: TableGridModel,
				blueprint: Blueprint
			) =>
				mergeCellWithCellToTheRight(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1) as TableCell,
					blueprint
				);

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, merging a cell with the cell below', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (
				gridModel: TableGridModel,
				blueprint: Blueprint
			) =>
				mergeCellWithCellBelow(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1) as TableCell,
					blueprint
				);

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, merging a cell with a cell to the left', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (
				gridModel: TableGridModel,
				blueprint: Blueprint
			) =>
				mergeCellWithCellToTheLeft(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1) as TableCell,
					blueprint
				);

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('Split cells', () => {
		it('can handle a 3x3 table, splitting a cell spanning over rows', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td', { rowspan: '2' }], ['td']],
					['tr', ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				splitSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1) as TableCell
				);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, splitting a cell at the end of the thead', () => {
			const jsonIn: JsonMl = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				splitNonSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(0, 1) as TableCell
				);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, splitting a cell at the start of the body', () => {
			const jsonIn: JsonMl = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				splitNonSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1) as TableCell
				);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, splitting a cell at the end of the body', () => {
			const jsonIn: JsonMl = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				splitNonSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(2, 1) as TableCell
				);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can handle a 3x3 table, splitting a cell spanning over columns', () => {
			const jsonIn: JsonMl = [
				'table',
				[
					'tbody',
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td', { colspan: '2' }]],
					['tr', ['td'], ['td'], ['td']],
				],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				splitSpanningCellIntoColumns(
					gridModel,
					gridModel.getCellAtCoordinates(1, 1) as TableCell
				);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can split the cell in only header row into rows', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th', '0x1']],
				['tr', ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
				'table',
				['tr', ['th', { rowspan: '2' }], ['th', '0x1']],
				['tr', ['th']],
				['tr', ['td'], ['td']],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				splitNonSpanningCellIntoRows(
					gridModel,
					gridModel.getCellAtCoordinates(0, 1) as TableCell
				);
			};

			const options = {
				shouldCreateColumnSpecificationNodes: false,
				useThead: false,
				useTbody: false,
				useTh: true,
			};

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('Tables not conforming to settings (useThead, useTbody, useTh, useBorders, shouldCreateColumnSpecificationNodes)', () => {
		// Skip the tfoot tests until we have full footer row node support
		it.skip('can transform a table based on thead, tbody, tfoot with 1 header row to a table based on rows only', () => {
			const jsonIn: JsonMl = [
				'table',
				['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
				[
					'tbody',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows to a table based on tbody', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows to a table based on rows', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on rows with a header defined by thead', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can transform a table without cols to one with cols', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on rows with a header defined by both thead and th', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on tbody and a header defined by thead', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can transform a table based on rows with 1 header row to a table based on tbody and a header defined by both thead and th', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can transform a table based on multiple tbody elements', () => {
			const jsonIn: JsonMl = [
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

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});

		it('can turn borders off', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options);
		});
	});

	describe('Keeps previously set @align and @valign attributes intact', () => {
		it('can add a row to a table having col elements with @align and @valign attributes', () => {
			const jsonIn: JsonMl = [
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

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(2, false);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('can add a row to a table having col elements with each having a different configuration of @align and @valign attributes', () => {
			const jsonIn: JsonMl = [
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

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(2, false);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('does not add @align or @valign attributes on a table starting without col elements', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(2, false);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});

		it('does not add @align or @valign attributes on a table starting with "empty" col elements', () => {
			const jsonIn: JsonMl = [
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

			const mutateGridModel = (gridModel: TableGridModel) => {
				gridModel.insertRow(2, false);
			};

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, mutateGridModel);
		});
	});

	describe('borders', () => {
		it('can turn borders on', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, (gridModel) => {
				gridModel.tableSpecification.borders = true;
				gridModel.giveCellsBorders();
			});
		});

		it('can turn borders off', () => {
			const jsonIn: JsonMl = [
				'table',
				{ border: '1' },
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, (gridModel) => {
				gridModel.tableSpecification.borders = false;
				gridModel.makeCellsBorderless();
			});
		});

		it('can leave borders off (as default)', () => {
			const jsonIn: JsonMl = [
				'table',
				['tr', ['th'], ['th'], ['th'], ['th']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
				['tr', ['td'], ['td'], ['td'], ['td']],
			];

			const jsonOut: JsonMl = [
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

			runTest(jsonIn, jsonOut, options, (gridModel) => {
				gridModel.tableSpecification.borders = false;
				gridModel.makeCellsBorderless();
			});
		});
	});
});
