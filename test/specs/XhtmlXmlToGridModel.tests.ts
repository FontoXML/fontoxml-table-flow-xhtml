import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint';
import type { FontoElementNode, JsonMl } from 'fontoxml-dom-utils/src/types';
import xq from 'fontoxml-selectors/src/xq';
import { isTableGridModel } from 'fontoxml-table-flow/src/indexedTableGridModels';
import type TableCell from 'fontoxml-table-flow/src/TableGridModel/TableCell';
import type TableGridModel from 'fontoxml-table-flow/src/TableGridModel/TableGridModel';
import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/src/table-definition/XhtmlTableDefinition';
import UnitTestEnvironment from 'fontoxml-unit-test-utils/src/UnitTestEnvironment';
import { findFirstNodeInDocument } from 'fontoxml-unit-test-utils/src/unitTestSetupHelpers';

describe('XHTML tables: XML to GridModel', () => {
	let environment: UnitTestEnvironment;
	let tableDefinition: XhtmlTableDefinition;
	beforeEach(() => {
		environment = new UnitTestEnvironment();
		tableDefinition = new XhtmlTableDefinition({});
	});

	function runTest(
		jsonIn: JsonMl,
		expectedHeight: number,
		expectedWidth: number,
		expectedHeaderRowCount: number
	): TableGridModel {
		const documentId = environment.createDocumentFromJsonMl(jsonIn);
		const tableElement = findFirstNodeInDocument(
			documentId,
			xq`//*:table`
		) as FontoElementNode;
		const gridModel = tableDefinition.buildTableGridModel(
			tableElement,
			readOnlyBlueprint
		);
		if (!isTableGridModel(gridModel)) {
			throw gridModel.error;
		}

		chai.assert.equal(gridModel.getHeight(), expectedHeight, 'height');
		chai.assert.equal(gridModel.getWidth(), expectedWidth, 'width');
		chai.assert.equal(
			gridModel.headerRowCount,
			expectedHeaderRowCount,
			'headerRowCount'
		);

		return gridModel;
	}

	function runTestExpectError(jsonIn: JsonMl): void {
		const documentId = environment.createDocumentFromJsonMl(jsonIn);
		const tableElement = findFirstNodeInDocument(
			documentId,
			xq`//*:table`
		) as FontoElementNode;
		const gridModel = tableDefinition.buildTableGridModel(
			tableElement,
			readOnlyBlueprint
		);
		chai.assert.isFalse(isTableGridModel(gridModel));
	}

	describe('Basics', () => {
		it('can deserialize a 1x1 table', () => {
			runTest(['table', ['tr', ['td']]], 1, 1, 0);
		});

		it('can deserialize a 4x4 table', () => {
			runTest(
				[
					'table',
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				4,
				4,
				0
			);
		});

		it('can deserialize a 4x4 table containing a tbody element', () => {
			runTest(
				[
					'table',
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				],
				4,
				4,
				0
			);
		});

		it('can deserialize a 4x4 table containing two tbody elements', () => {
			runTest(
				[
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
				],
				4,
				4,
				0
			);
		});

		it('can deserialize a 4x4 table containing processing instructions and comments', () => {
			runTest(
				[
					'table',
					[
						'tr',
						['td'],
						['td'],
						['?someProcessingInstruction', 'someContent'],
						['td'],
						['td'],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					[
						'tr',
						['td'],
						['!', 'some comment'],
						['td'],
						['td'],
						['td'],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				4,
				4,
				0
			);
		});
	});

	describe('Headers and footers', () => {
		it('can deserialize a 4x4 table with 1 header row (th-based)', () => {
			runTest(
				[
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				4,
				4,
				1
			);
		});

		it('can deserialize a 4x4 table with 2 header rows (th-based)', () => {
			runTest(
				[
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				4,
				4,
				2
			);
		});

		it('can deserialize a 4x4 table with 1 header row (thead-based)', () => {
			runTest(
				[
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				4,
				4,
				1
			);
		});

		it('can deserialize a 4x4 table with 2 header rows (thead-based)', () => {
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
				4,
				4,
				2
			);
		});

		it('can deserialize a 4x4 table with 1 header row (th and thead-based)', () => {
			runTest(
				[
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				],
				4,
				4,
				1
			);
		});

		it('can deserialize a 4x4 table with 2 header rows (th and thead-based)', () => {
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
				4,
				4,
				2
			);
		});

		it('can deserialize a 4x4 table with 1 header row (th and thead-based) with tbody', () => {
			runTest(
				[
					'table',
					['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				],
				4,
				4,
				1
			);
		});

		it('can deserialize a 4x4 table with 2 header rows (th and thead-based) with tbody', () => {
			runTest(
				[
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
				],
				4,
				4,
				2
			);
		});

		it('can deserialize a 4x4 table with 1 header row (th-based) and a header column', () => {
			runTest(
				[
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['th'], ['td'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td'], ['td']],
					['tr', ['th'], ['td'], ['td'], ['td']],
				],
				4,
				4,
				1
			);
		});

		it('can deserialize a 4x4 table with 1 header row (th-based) at the top and treat a row whose all cells are th but which is after a body row', () => {
			runTest(
				[
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['th'], ['th'], ['th'], ['th']],
				],
				4,
				4,
				1
			);
		});

		it('can deserialize a 4x4 table with two tbody elements and 1 header row (thead-based)', () => {
			runTest(
				[
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					['tbody', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
				],
				4,
				4,
				1
			);
		});

		it('can deserialize a 4x4 table with a tbody element, 1 header row (thead-based) and 1 footer row (tfoot-based)', () => {
			runTest(
				[
					'table',
					['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
					[
						'tbody',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]],
				],
				4,
				4,
				1
			);
		});

		it('can deserialize a 4x4 table with a tbody element and 2 header rows (th- & thead-based) with comments and processing instructions', () => {
			runTest(
				[
					'table',
					[
						'thead',
						['?someProcessingInstruction', 'someContent'],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['?someProcessingInstruction', 'someContent'],
					],
					[
						'tbody',
						[
							'tr',
							['td'],
							['td'],
							['!', 'some comment'],
							['td'],
							['td'],
						],
						[
							'tr',
							['!', 'some comment'],
							['td'],
							['td'],
							['td'],
							['td'],
						],
					],
				],
				4,
				4,
				2
			);
		});
	});

	describe('Spanning cells', () => {
		function assertSpan(
			gridModel: TableGridModel,
			rowA: number,
			colA: number,
			rowB: number,
			colB: number
		): void {
			const firstSpanningCell = gridModel.getCellAtCoordinates(
				rowA,
				colA
			) as TableCell;
			const secondSpanningCell = gridModel.getCellAtCoordinates(
				rowB,
				colB
			) as TableCell;
			chai.assert.deepEqual(
				firstSpanningCell.element,
				secondSpanningCell.element
			);
		}

		describe('Column spanning cells', () => {
			it('can deserialize a 4x4 table with a column spanning cell on the first row', () => {
				const gridModel = runTest(
					[
						'table',
						['tr', ['td', { colspan: '2' }], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					4,
					4,
					0
				);
				assertSpan(gridModel, 0, 0, 0, 1);
			});

			it('can deserialize a 4x4 table containing a column spanning cell on the first header row', () => {
				const gridModel = runTest(
					[
						'table',
						['tr', ['th', { colspan: '2' }], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					4,
					4,
					1
				);
				assertSpan(gridModel, 0, 0, 0, 1);
			});

			it('can deserialize a 4x4 table with a column spanning cell on the first row (tbody based)', () => {
				const gridModel = runTest(
					[
						'table',
						[
							'tbody',
							['tr', ['td', { colspan: '2' }], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
					],
					4,
					4,
					0
				);
				assertSpan(gridModel, 0, 0, 0, 1);
			});

			it('can deserialize a 4x4 table with a column spanning cell on the first header row (thead based)', () => {
				const gridModel = runTest(
					[
						'table',
						[
							'thead',
							['tr', ['th', { colspan: '2' }], ['th'], ['th']],
						],
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
						],
					],
					4,
					4,
					1
				);
				assertSpan(gridModel, 0, 0, 0, 1);
			});

			it('throws when building a gridModel from a table containing incorrect colspans', () => {
				runTestExpectError([
					'table',
					['tr', ['td', { colspan: '2' }], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]);
			});

			it('can deserialize a table with a row spanning cell (td) into a row without td cell', () => {
				const gridModel = runTest(
					[
						'table',
						['tr', ['th'], ['th'], ['td', { rowspan: '2' }]],
						['tr', ['th'], ['th']],
					],
					2,
					3,
					0
				);
				assertSpan(gridModel, 0, 2, 1, 2);
			});

			it('can deserialize a table with a row spanning cell (th) into empty rows', () => {
				const gridModel = runTest(
					[
						'table',
						[
							'tr',
							['th', { rowspan: '3' }],
							['th', { rowspan: '3' }],
						],
						['tr'],
						['tr'],
						['tr', ['td'], ['td']],
					],
					4,
					2,
					3
				);
				assertSpan(gridModel, 0, 0, 1, 0);
				assertSpan(gridModel, 1, 0, 2, 0);
			});
		});

		describe('Row spanning cells', () => {
			it('can deserialize a 4x4 table with a row spanning cell on the first row', () => {
				const gridModel = runTest(
					[
						'table',
						[
							'tr',
							['td', { rowspan: '2' }],
							['td'],
							['td'],
							['td'],
						],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					4,
					4,
					0
				);
				assertSpan(gridModel, 0, 0, 1, 0);
			});

			it('can deserialize a 4x4 table with a row spanning cell with a following empty row', () => {
				const gridModel = runTest(
					[
						'table',
						[
							'tr',
							['td', { rowspan: '2' }],
							['td', { rowspan: '2' }],
							['td', { rowspan: '2' }],
							['td', { rowspan: '2' }],
						],
						['tr'],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					4,
					4,
					0
				);
				assertSpan(gridModel, 0, 0, 1, 0);
			});

			// virtual row flag should allow Xhtml table grid to create virutal rows at the end of the table
			it('can deserialize a table with last row having row spanning cells', () => {
				const gridModel = runTest(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						[
							'tr',
							['td', { rowspan: '3' }],
							['td', { rowspan: '3' }],
							['td', { rowspan: '3' }],
							['td', { rowspan: '3' }],
						],
					],
					5,
					4,
					1
				);
				assertSpan(gridModel, 2, 0, 3, 0);
				assertSpan(gridModel, 3, 0, 4, 0);
			});

			it('can deserialize a table with a single row spanning cell with one less entry in the next rows to accomdate the row spanning cell', () => {
				const gridModel = runTest(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						[
							'tr',
							['td', { rowspan: '3' }],
							['td'],
							['td'],
							['td'],
						],
						['tr', ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td']],
					],
					5,
					4,
					1
				);
				assertSpan(gridModel, 2, 0, 3, 0);
				assertSpan(gridModel, 2, 0, 4, 0);
			});

			it('throws error with a table with a single row spanning cell with one less entry in the next rows to accomdate the row spanning cell and an empty last virtual row', () => {
				runTestExpectError([
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td', { rowspan: '4' }], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
				]);
			});

			it('throws error with a 4x4 table with not enough empty rows to accomdate row spans', () => {
				runTestExpectError([
					'table',
					[
						'tr',
						['td', { rowspan: '2' }],
						['td', { rowspan: '2' }],
						['td', { rowspan: '2' }],
						['td', { rowspan: '2' }],
					],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]);
			});

			it('throws error with a table with an empty row that is not covered by row spanning cell', () => {
				runTestExpectError([
					'table',
					['tr', ['th'], ['th'], ['th'], ['th']],
					['tr'],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]);
			});

			it('throws error with a table containing incorrect rowspans', () => {
				runTestExpectError([
					'table',
					['tr', ['td', { rowspan: '3' }], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]);
			});
		});

		describe('Row and column spanning cells', () => {
			it('can deserialize a 4x4 table with a rowspan and a colspan in the same cell', () => {
				const gridModel = runTest(
					[
						'table',
						[
							'tr',
							['td', { colspan: '2', rowspan: '2' }],
							['td'],
							['td'],
						],
						['tr', ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
					],
					4,
					4,
					0
				);
				assertSpan(gridModel, 0, 0, 1, 0);
				assertSpan(gridModel, 1, 0, 0, 1);
				assertSpan(gridModel, 0, 1, 1, 1);
			});

			it('throws when building a gridModel from a table containing incorrect rowspans and colspans', () => {
				runTestExpectError([
					'table',
					[
						'tr',
						['td', { colspan: '3', rowspan: '3' }],
						['td'],
						['td'],
					],
					['tr', ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
					['tr', ['td'], ['td'], ['td'], ['td']],
				]);
			});
		});
	});
});
