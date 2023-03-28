import type Blueprint from 'fontoxml-blueprints/src/Blueprint';
import { unsafeCollapseElement } from 'fontoxml-blueprints/src/blueprintMutations';
import evaluateXPathToNodes from 'fontoxml-selectors/src/evaluateXPathToNodes';
import type { XQExpression } from 'fontoxml-selectors/src/types';
import xq from 'fontoxml-selectors/src/xq';
import type {
	TableColumnContextObject,
	TableDataObject,
} from 'fontoxml-table-flow/src/types';

/**
 * Removes the colgroup element from a table but keeps the children.
 *
 * @param colGroupSelector - Selector for the colgroup element.
 */
export function createRemoveColgroupNodeStrategy(
	colGroupSelector: XQExpression
): (
	context: TableColumnContextObject,
	data: TableDataObject,
	blueprint: Blueprint
) => void {
	return (_context, data, blueprint) => {
		// Does nothing when there is no colgroup selector.
		if (!colGroupSelector) {
			return;
		}

		const colGroupElements = evaluateXPathToNodes(
			xq`child::*[${colGroupSelector}]`,
			data.tableNode,
			blueprint
		);

		colGroupElements.forEach((colGroupElement) => {
			// tableGridModelToXmlTable will do the validation afterwards.
			unsafeCollapseElement(data.tableNode, colGroupElement, blueprint);
		});
	};
}

const normalizeColumnSpecificationStrategies = {
	createRemoveColgroupNodeStrategy,
};

export default normalizeColumnSpecificationStrategies;
