import Blueprint from 'fontoxml-blueprints/src/Blueprint.js';
import CoreDocument from 'fontoxml-core/src/Document.js';
import jsonMLMapper from 'fontoxml-dom-utils/src/jsonMLMapper.js';
import * as slimdom from 'slimdom';

import XhtmlTableDefinition from 'fontoxml-table-flow-xhtml/src/table-definition/XhtmlTableDefinition.js';

describe('XHTML tables: XML to GridModel', () => {
	let documentNode;
	let coreDocument;
	let blueprint;
	let tableDefinition;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		coreDocument = new CoreDocument(documentNode);

		blueprint = new Blueprint(coreDocument.dom);
		tableDefinition = new XhtmlTableDefinition({});
	});

	describe('Basics', () => {
		it('can deserialize a 1x1 table', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(['table', ['tr', ['td']]], documentNode)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 1);
			chai.assert.equal(gridModel.getWidth(), 1);
			chai.assert.equal(gridModel.headerRowCount, 0);
		});

		it('can deserialize a 4x4 table', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 0);
		});

		it('can deserialize a 4x4 table containing a tbody element', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 0);
		});

		it('can deserialize a 4x4 table containing two tbody elements', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 0);
		});

		it('can deserialize a 4x4 table containing processing instructions and comments', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						[
							'tr',
							['td'],
							['td'],
							['?someProcessingInstruction', 'someContent'],
							['td'],
							['td']
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['!', 'some comment'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 0);
		});
	});

	describe('Headers and footers', () => {
		it('can deserialize a 4x4 table with 1 header row (th-based)', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 1);
		});

		it('can deserialize a 4x4 table with 2 header rows (th-based)', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 2);
		});

		it('can deserialize a 4x4 table with 1 header row (thead-based)', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 1);
		});

		it('can deserialize a 4x4 table with 2 header rows (thead-based)', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						[
							'thead',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 2);
		});

		it('can deserialize a 4x4 table with 1 header row (th and thead-based)', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 1);
		});

		it('can deserialize a 4x4 table with 2 header rows (th and thead-based)', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						[
							'thead',
							['tr', ['th'], ['th'], ['th'], ['th']],
							['tr', ['th'], ['th'], ['th'], ['th']]
						],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 2);
		});

		it('can deserialize a 4x4 table with 1 header row (th and thead-based) with tbody', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['thead', ['tr', ['th'], ['th'], ['th'], ['th']]],
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 1);
		});

		it('can deserialize a 4x4 table with 2 header rows (th and thead-based) with tbody', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						[
							'thead',
							['tr', ['th'], ['th'], ['th'], ['th']],
							['tr', ['th'], ['th'], ['th'], ['th']]
						],
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 2);
		});

		it('can deserialize a 4x4 table with 1 header row (th-based) and a header column', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['th'], ['td'], ['td'], ['td']],
						['tr', ['th'], ['td'], ['td'], ['td']],
						['tr', ['th'], ['td'], ['td'], ['td']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 1);
		});

		it('can deserialize a 4x4 table with 1 header row (th-based) at the top and treat a row whose all cells are th but which is after a body row', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['tr', ['th'], ['th'], ['th'], ['th']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['td'], ['td'], ['td'], ['td']],
						['tr', ['th'], ['th'], ['th'], ['th']]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 1);
		});

		it('can deserialize a 4x4 table with two tbody elements and 1 header row (thead-based)', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
						['tbody', ['tr', ['td'], ['td'], ['td'], ['td']]],
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 1);
		});

		it('can deserialize a 4x4 table with a tbody element, 1 header row (thead-based) and 1 footer row (tfoot-based)', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						['thead', ['tr', ['td'], ['td'], ['td'], ['td']]],
						[
							'tbody',
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						['tfoot', ['tr', ['td'], ['td'], ['td'], ['td']]]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 1);
		});

		it('can deserialize a 4x4 table with a tbody element and 2 header rows (th- & thead-based) with comments and processing instructions', () => {
			coreDocument.dom.mutate(() =>
				jsonMLMapper.parse(
					[
						'table',
						[
							'thead',
							['?someProcessingInstruction', 'someContent'],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['?someProcessingInstruction', 'someContent']
						],
						[
							'tbody',
							['tr', ['td'], ['td'], ['!', 'some comment'], ['td'], ['td']],
							['tr', ['!', 'some comment'], ['td'], ['td'], ['td'], ['td']]
						]
					],
					documentNode
				)
			);

			const tableElement = documentNode.firstChild;
			const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
			chai.assert.isUndefined(gridModel.error);

			chai.assert.equal(gridModel.getHeight(), 4);
			chai.assert.equal(gridModel.getWidth(), 4);
			chai.assert.equal(gridModel.headerRowCount, 2);
		});
	});

	describe('Spanning cells', () => {
		describe('Column spanning cells', () => {
			it('can deserialize a 4x4 table with a column spanning cell on the first row', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['td', { colspan: '2' }], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

				chai.assert.equal(gridModel.getHeight(), 4);
				chai.assert.equal(gridModel.getWidth(), 4);
				chai.assert.equal(gridModel.headerRowCount, 0);

				const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
				const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
				chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
			});

			it('can deserialize a 4x4 table containing a column spanning cell on the first header row', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['th', { colspan: '2' }], ['th'], ['th']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

				chai.assert.equal(gridModel.getHeight(), 4);
				chai.assert.equal(gridModel.getWidth(), 4);
				chai.assert.equal(gridModel.headerRowCount, 1);

				const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
				const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
				chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
			});

			it('can deserialize a 4x4 table with a column spanning cell on the first row (tbody based)', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							[
								'tbody',
								['tr', ['td', { colspan: '2' }], ['td'], ['td']],
								['tr', ['td'], ['td'], ['td'], ['td']],
								['tr', ['td'], ['td'], ['td'], ['td']],
								['tr', ['td'], ['td'], ['td'], ['td']]
							]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

				chai.assert.equal(gridModel.getHeight(), 4);
				chai.assert.equal(gridModel.getWidth(), 4);
				chai.assert.equal(gridModel.headerRowCount, 0);

				const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
				const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
				chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
			});

			it('can deserialize a 4x4 table with a column spanning cell on the first header row (thead based)', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['thead', ['tr', ['th', { colspan: '2' }], ['th'], ['th']]],
							[
								'tbody',
								['tr', ['td'], ['td'], ['td'], ['td']],
								['tr', ['td'], ['td'], ['td'], ['td']],
								['tr', ['td'], ['td'], ['td'], ['td']]
							]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

				chai.assert.equal(gridModel.getHeight(), 4, 'height');
				chai.assert.equal(gridModel.getWidth(), 4, 'width');
				chai.assert.equal(gridModel.headerRowCount, 1, 'headerRowCount');

				const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
				const secondSpanningCell = gridModel.getCellAtCoordinates(0, 1);
				chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
			});

			it('throws when building a gridModel from a table containing incorrect colspans', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['td', { colspan: '2' }], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;

				chai.assert.property(
					tableDefinition.buildTableGridModel(tableElement, blueprint),
					'error'
				);
			});

			it('can deserialize a table with a row spanning cell (td) into a row without td cell', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['th'], ['th'], ['td', { rowspan: '2' }]],
							['tr', ['th'], ['th']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

				chai.assert.equal(gridModel.getHeight(), 2, 'height');
				chai.assert.equal(gridModel.getWidth(), 3, 'width');
				chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');

				const firstSpanningCell = gridModel.getCellAtCoordinates(0, 2);
				const secondSpanningCell = gridModel.getCellAtCoordinates(1, 2);
				chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
			});

			it('can deserialize a table with a row spanning cell (th) into empty rows', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['th', { rowspan: '3' }], ['th', { rowspan: '3' }]],
							['tr'],
							['tr'],
							['tr', ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

				chai.assert.equal(gridModel.getHeight(), 4, 'height');
				chai.assert.equal(gridModel.getWidth(), 2, 'width');
				chai.assert.equal(gridModel.headerRowCount, 3, 'headerRowCount');

				const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
				const secondSpanningCell = gridModel.getCellAtCoordinates(1, 0);
				const thirdSpanningCell = gridModel.getCellAtCoordinates(2, 0);
				chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
				chai.assert.deepEqual(secondSpanningCell.element, thirdSpanningCell.element);
			});
		});

		describe('Row spanning cells', () => {
			it('can deserialize a 4x4 table with a row spanning cell on the first row', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['td', { rowspan: '2' }], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

				chai.assert.equal(gridModel.getHeight(), 4, 'height');
				chai.assert.equal(gridModel.getWidth(), 4, 'width');
				chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');

				const firstSpanningCell = gridModel.getCellAtCoordinates(0, 0);
				const secondSpanningCell = gridModel.getCellAtCoordinates(1, 0);
				chai.assert.deepEqual(firstSpanningCell.element, secondSpanningCell.element);
			});

			it('can deserialize a 4x4 table with multiple row spanning cells on the first row', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							[
								'tr',
								['td', { rowspan: '2' }],
								['td', { rowspan: '2' }],
								['td', { rowspan: '2' }],
								['td', { rowspan: '2' }]
							],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

				// Normalization happens AFTER the first mutation
				chai.assert.equal(gridModel.getHeight(), 5, 'height');
				chai.assert.equal(gridModel.getWidth(), 4, 'width');
				chai.assert.equal(gridModel.headerRowCount, 0, 'headerRowCount');
			});

			it('throws when building a gridModel from a table containing incorrect rowspans', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['td', { rowspan: '3' }], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;

				chai.assert.property(
					tableDefinition.buildTableGridModel(tableElement, blueprint),
					'error'
				);
			});
		});

		describe('Row and column spanning cells', () => {
			it('can deserialize a 4x4 table with a rowspan and a colspan in the same cell', () => {
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['td', { colspan: '2', rowspan: '2' }], ['td'], ['td']],
							['tr', ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;
				const gridModel = tableDefinition.buildTableGridModel(tableElement, blueprint);
				chai.assert.isUndefined(gridModel.error);

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
				coreDocument.dom.mutate(() =>
					jsonMLMapper.parse(
						[
							'table',
							['tr', ['td', { colspan: '3', rowspan: '3' }], ['td'], ['td']],
							['tr', ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']],
							['tr', ['td'], ['td'], ['td'], ['td']]
						],
						documentNode
					)
				);

				const tableElement = documentNode.firstChild;

				chai.assert.property(
					tableDefinition.buildTableGridModel(tableElement, blueprint),
					'error'
				);
			});
		});
	});
});
