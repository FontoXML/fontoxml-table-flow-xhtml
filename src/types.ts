import type { DefaultTextContainerConfiguration } from 'fontoxml-base-flow/src/types';
import type { XPathTest } from 'fontoxml-selectors/src/types';
import type { TableCellStylingTranslationQuery } from 'fontoxml-table-flow/src/types';

/**
 * @remarks
 * The options accepted by {@link configureAsXhtmlTableElements}. Please see
 * {@link TableElementsSharedOptions} for more information on the other
 * options accepted by this function.
 *
 * @fontosdk importable
 */
export type TableElementsXhtmlOptions = {
	/**
	 * @remarks
	 * Set to true if th should be used.
	 *
	 * @fontosdk
	 */
	useTh?: boolean;
	/**
	 * @remarks
	 * Set to true if thead should be used.
	 *
	 * @fontosdk
	 */
	useThead?: boolean;
	/**
	 * @remarks
	 * Set to true if tbody should be used.
	 *
	 * @fontosdk
	 */
	useTbody?: boolean;
	/**
	 * @remarks
	 *
	 * Set to false if the borders attribute should not be used.
	 *
	 * This sets whether the `borders` attribute should be read from and written to. The available
	 * values for the `borders` attribute are `1`, which shows the borders of the table, and `0`,
	 * which hides them.
	 *
	 * This is `true` by default, meaning the `borders` attribute will be read from. If it is set to
	 * `false`, all the borders will be rendered but they will not be editable.
	 *
	 * @fontosdk
	 */
	useBorders?: boolean;
	/**
	 * @remarks
	 * Set to true if the table should include <col> elements by default.
	 *
	 * @fontosdk
	 */
	shouldCreateColumnSpecificationNodes?: boolean;
	/**
	 * @remarks
	 *
	 *
	 * @fontosdk
	 */
	table?: {
		/**
		 * @remarks
		 * An optional additional selector for the table
		 * which will be used to refine whether a table
		 * element should be considered as an xhtml
		 * table.
		 *
		 * @fontosdk
		 */
		tableFilterSelector?: XPathTest;
		/**
		 * @remarks
		 * The namespace URI for this table.
		 *
		 * @fontosdk
		 */
		namespaceURI?: string | null;
	};
	/**
	 * @remarks
	 * Configuration options for the td element.
	 *
	 * @fontosdk
	 */
	td?: {
		/**
		 * @remarks
		 * The default text container for the td element.
		 *
		 * @fontosdk
		 */
		defaultTextContainer?:
			| DefaultTextContainerConfiguration
			| string
			| null
			| undefined;
	};
	/**
	 * @remarks
	 * Configuration options for the th element.
	 *
	 * @fontosdk
	 */
	th?: {
		/**
		 * @remarks
		 * The default text container for the th element.
		 *
		 * @fontosdk
		 */
		defaultTextContainer?:
			| DefaultTextContainerConfiguration
			| string
			| null
			| undefined;
	};
	/**
	 * @remarks
	 * An {@link XPathQuery} that should return the styling for a cell (as the
	 * {@link TableCellStylingOptions} object). For more details see
	 * {@link TableCellStylingTranslationQuery}.
	 *
	 * @fontosdk
	 */
	cellStylingTranslationQuery?: TableCellStylingTranslationQuery;

	/**
	 * @remarks
	 * Describes how columns widths should be serialized in the XML. Can
	 * either be 'percentual' (making the sizes look like '25%'), 'relative' (which
	 * makes them look like '2*') or 'none', which disables columns widhts
	 * altogether.
	 *
	 * @fontosdk
	 */
	columnWidthType?: 'none' | 'percentual' | 'relative';
};
