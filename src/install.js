import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint.js';
import documentsManager from 'fontoxml-documents/src/documentsManager.js';
import namespaceManager from 'fontoxml-dom-namespaces/src/namespaceManager.js';
import addTransform from 'fontoxml-operations/src/addTransform.js';
import operationsManager from 'fontoxml-operations/src/operationsManager.js';
import evaluateXPathToBoolean from 'fontoxml-selectors/src/evaluateXPathToBoolean.js';
import registerCustomXPathFunction from 'fontoxml-selectors/src/registerCustomXPathFunction.js';
import tableDefinitionManager from 'fontoxml-table-flow/src/tableDefinitionManager.js';

import XhtmlTableDefinition from './table-definition/XhtmlTableDefinition.js';

const FONTO_FUNCTIONS = namespaceManager.getNamespaceUri(null, 'fonto');

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

	addTransform('checkXhtmlTable', function(stepData) {
		// Obtain table node from context node ID
		const tableNode =
			stepData.contextNodeId && documentsManager.getNodeById(stepData.contextNodeId);

		if (
			!(
				tableNode &&
				evaluateXPathToBoolean('fonto:is-xhtml-table(.)', tableNode, readOnlyBlueprint)
			)
		) {
			// If there is no node or the node is not an xhtml table,
			// disable the operation.
			stepData.operationState = { enabled: false, active: false };
		}
		return stepData;
	});

	addTransform('checkXhtmlTableCell', function(stepData) {
		// Whilst we pass all cellNodeIds as parameter, we are only going to use the first one,
		// because we only need one cell to do the check.
		const cellNode =
			stepData.cellNodeIds &&
			stepData.cellNodeIds.length &&
			documentsManager.getNodeById(stepData.cellNodeIds[0]);

		if (
			!(
				cellNode &&
				// Check whether first table ancestor is an xhtml table or not
				evaluateXPathToBoolean(
					'ancestor::*[fonto:is-table(.)][1][fonto:is-xhtml-table(.)]',
					cellNode,
					readOnlyBlueprint
				)
			)
		) {
			// If there is no node or the node is not an xhtml table cell,
			// disable the operation.
			stepData.operationState = { enabled: false, active: false };
		}
		return stepData;
	});

	/**
	 * Returns whether the given node is an xhtml table node. If null or nothing is passed, the
	 * function will return false.
	 *
	 * @name fonto:is-xhtml-table
	 *
	 * @category xpath
	 *
	 * @param  {node()}  [node]
	 *
	 * @return {xs:boolean}  Whether the passed node is an xhtml table.
	 */
	registerCustomXPathFunction(
		{ namespaceURI: FONTO_FUNCTIONS, localName: 'is-xhtml-table' },
		['node()?'],
		'xs:boolean',
		(dynamicContext, node) => {
			if (!node) {
				return false;
			}

			const tableDefinition = tableDefinitionManager.getTableDefinitionForNode(
				node,
				dynamicContext.domFacade
			);

			return !!(
				tableDefinition &&
				tableDefinition instanceof XhtmlTableDefinition &&
				tableDefinition.isTable(node, dynamicContext.domFacade)
			);
		}
	);
}
