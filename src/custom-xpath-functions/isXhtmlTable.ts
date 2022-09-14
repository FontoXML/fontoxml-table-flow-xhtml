import type { DocumentedXPathFunction } from 'fontoxml-documentation-helpers/src/types';
import type { FontoNode } from 'fontoxml-dom-utils/src/types';
import type { XQDynamicContext } from 'fontoxml-selectors/src/types';
import isTableNodeInstanceOfTableDefinition from 'fontoxml-table-flow/src/isTableNodeInstanceOfTableDefinition';

import XhtmlTableDefinition from '../table-definition/XhtmlTableDefinition';

/**
 * @remarks
 * Returns whether the given node is an xhtml table node. If null or nothing is
 * passed, the function will return false.
 *
 * @fontosdk
 *
 * @param node - The node to check
 *
 * @returns Whether the passed node is an xhtml table.
 */
const fn: DocumentedXPathFunction<
	{
		namespaceURI: 'http://www.fontoxml.com/functions';
		localName: 'is-xhtml-table';
	},
	['node()?'],
	'xs:boolean'
> = [
	{
		namespaceURI: 'http://www.fontoxml.com/functions',
		localName: 'is-xhtml-table',
	},
	['node()?'],
	'xs:boolean',
	function (
		dynamicContext: XQDynamicContext,
		node: FontoNode<'readable'>
	): boolean {
		return (
			node &&
			isTableNodeInstanceOfTableDefinition(
				dynamicContext.domFacade,
				node,
				XhtmlTableDefinition
			)
		);
	},
];

export default fn;
