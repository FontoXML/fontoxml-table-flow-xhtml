import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint';
import documentsManager from 'fontoxml-documents/src/documentsManager';
import type { NodeId } from 'fontoxml-dom-identification/src/types';
import addTransform from 'fontoxml-operations/src/addTransform';
import operationsManager from 'fontoxml-operations/src/operationsManager';
import evaluateXPathToBoolean from 'fontoxml-selectors/src/evaluateXPathToBoolean';
import registerCustomXPathFunction from 'fontoxml-selectors/src/registerCustomXPathFunction';
import xq from 'fontoxml-selectors/src/xq';

import isXhtmlTable from './custom-xpath-functions/isXhtmlTable';

export default function install(): void {
	operationsManager.addAlternativeOperation(
		'set-cell-horizontal-alignment-left',
		'xhtml-set-cell-horizontal-alignment-left',
		0
	);
	operationsManager.addAlternativeOperation(
		'set-cell-horizontal-alignment-right',
		'xhtml-set-cell-horizontal-alignment-right',
		0
	);
	operationsManager.addAlternativeOperation(
		'set-cell-horizontal-alignment-center',
		'xhtml-set-cell-horizontal-alignment-center',
		0
	);
	operationsManager.addAlternativeOperation(
		'set-cell-horizontal-alignment-justify',
		'xhtml-set-cell-horizontal-alignment-justify',
		0
	);
	operationsManager.addAlternativeOperation(
		'set-cell-vertical-alignment-top',
		'xhtml-set-cell-vertical-alignment-top',
		0
	);
	operationsManager.addAlternativeOperation(
		'set-cell-vertical-alignment-bottom',
		'xhtml-set-cell-vertical-alignment-bottom',
		0
	);
	operationsManager.addAlternativeOperation(
		'set-cell-vertical-alignment-middle',
		'xhtml-set-cell-vertical-alignment-center',
		0
	);

	addTransform<{ contextNodeId: NodeId }>(
		'checkXhtmlTable',
		function (stepData) {
			// Obtain table node from context node ID
			const tableNode =
				stepData.contextNodeId &&
				documentsManager.getNodeById(stepData.contextNodeId);

			if (
				!(
					tableNode &&
					evaluateXPathToBoolean(
						xq`fonto:is-xhtml-table(.)`,
						tableNode,
						readOnlyBlueprint
					)
				)
			) {
				// If there is no node or the node is not an xhtml table,
				// disable the operation.
				stepData.operationState = { enabled: false, active: false };
			}
			return stepData;
		}
	);

	addTransform<{ cellNodeIds: NodeId[] }>(
		'checkXhtmlTableCell',
		function (stepData) {
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
						xq`ancestor::*[fonto:is-table(.)][1][fonto:is-xhtml-table(.)]`,
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
		}
	);

	registerCustomXPathFunction(...isXhtmlTable);
}
