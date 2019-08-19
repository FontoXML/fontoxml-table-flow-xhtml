import operationsManager from 'fontoxml-operations/src/operationsManager.js';

export default function install() {
	operationsManager.addAlternativeOperation(
		'set-cell-horizontal-alignment-left',
		'xhtml-set-cell-horizontal-alignment-left'
	);
	operationsManager.addAlternativeOperation(
		'set-cell-horizontal-alignment-right',
		'xhtml-set-cell-horizontal-alignment-right'
	);
	operationsManager.addAlternativeOperation(
		'set-cell-horizontal-alignment-center',
		'xhtml-set-cell-horizontal-alignment-center'
	);
	operationsManager.addAlternativeOperation(
		'set-cell-horizontal-alignment-justify',
		'xhtml-set-cell-horizontal-alignment-justify'
	);
	operationsManager.addAlternativeOperation(
		'set-cell-vertical-alignment-top',
		'xhtml-set-cell-vertical-alignment-top'
	);
	operationsManager.addAlternativeOperation(
		'set-cell-vertical-alignment-bottom',
		'xhtml-set-cell-vertical-alignment-bottom'
	);
	operationsManager.addAlternativeOperation(
		'set-cell-vertical-alignment-middle',
		'xhtml-set-cell-vertical-alignment-center'
	);
}
