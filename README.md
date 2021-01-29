---
category: add-on/fontoxml-table-flow-xhtml
---

# XHTML table support

This add-on adds support for XHTML tables to a Fonto editor.

This add-on exposes one function called {@link configureAsXhtmlTableElements}. This function configures all XHTML table elements. This eliminates the need for configuring any of the XHTML table elements separately.

The `configureAsXhtmlTableElements` function should be used in a configureSxModule file, like this:

```
configureAsXhtmlTableElements(sxModule, {
	// Priority of the selectors used to select the table elements (optional)
	priority: 2,

	// True if a th element should be used for defining a header. When this option and the useThead
	// options aren't set, th elements will be used by default.
	useTh: true,

	// True if a thead element should be used for defining a header. When only this option is set,
	// only thead elements will be used for defining a header.
	useThead: true,

	// True if a tbody element should be used.
	useTbody: true,

	// False if the borders attribute should not be used
	useBorders: true,

	// True if the table should include <col> elements by default
	shouldCreateColumnSpecificationNodes: false,

	// The namespace uri for the table element and its descendant elements (optional)
	table: {
		namespaceURI: 'http://some-uri.com/'
	},

	// The default text container for the td element (optional)
	td: {
		defaultTextContainer: 'p'
	},

	// The default text container for the th element (optional)
	th: {
		defaultTextContainer: 'p'
	},

	// This widgets are before columns.All widgets are supported. Optional, defaults to an empty array.
	columnBefore: [
		createIconWidget('clock-o', {
			clickOperation: 'lcTime-value-edit',
			tooltipContent: 'Click here to edit the duration'
		})
	],

	// This widget is before each row. Any widget can be used, but only the {@link iconWidget} is supported here. Optional, defaults to an empty array.
	rowBefore: [
		createIconWidget('dot-circle-o', {
			clickOperation: 'do-nothing'
		})
	],

	// This will show buttons that insert a new column or row. Optional, defaults to false.
	showInsertionWidget: true,

	// This will show areas that can be hovered over to hightlight a column or row and that can be clicked to show a operations popover. Optional, defaults to false.
	showHighlightingWidget: true

	// This XPath expression determines whether or not a table has the ability to be collapsed. Optional, defaults to 'false()'.
	// $rowCount and $columnCount helper variables can also optionally be used in the XPath expression to make it easier to configure
	// when the table should collapse i.e. '$rowCount > 5' which will allow tables with rows more than 5 to be able to be collapsed/uncollapsed
	isCollapsibleQuery: 'false()'

	// This XPath expression determines whether a table that has the ability to be collapsed should start off as collapsed on initial load. Optional, defaults to 'true()'.
	// $rowCount and $columnCount helper variables can also optionally be used in the XPath expression to make it easier to configure
	// when the table should start off as collapsed i.e. '$rowCount > 10' means that tables that have more than 10 rows will initially start off as collapsed
	// Note: This query is only evaluated on tables which have the ability to be collapsed using isCollapsibleQuery
	isInitiallyCollapsedQuery: 'true()'
});

```

To configure the markup labels and contextual operations, use the {@link configureProperties} function.

The cell element menu button widgets are added based on the existence of contextual operations on cell level. Make sure that only cell-specific operations are added to the cell widget, so that users are only given options relevant to them.
Example on how you can add this element menu on the widget:

```
configureProperties(sxModule, 'self::td', {
	contextualOperations: [
		{ name: 'contextual-set-total-cell', hideIn: ['context-menu'] }
	]
});
```



## Specification

Fonto supports a subset of the [XHTML 1.0 2nd edition](https://www.w3.org/TR/xhtml1/dtds.html) table specification. The
following parts are supported.

| Element    | Attributes                      |
|------------|---------------------------------|
| table      | border                          |
| caption    |                                 |
| colgroup*  |                                 |
| col*       |                                 |
| thead      |                                 |
| tfoot*     |                                 |
| tbody      |                                 |
| tr         |                                 |
| th         | rowspan, colspan, align, valign |
| td         | rowspan, colspan, align, valign |

\* **Note** that this add-on supports tables that contain `col`, `colgroup`, and `tfoot` elements. However, these elements are _ignored_ by this add-on and these elements _will not_ be inserted into new tables.

# Contributing

This package can serve as a base for custom versions of XHTML tables. It can be forked by checking
it out directly in the `packages` folder of an editor. When making a fork, consider keeping it
up-to-date with new Fonto Editor versions when they release. Please refer to [our documentation on
open-source add-ons](https://documentation.fontoxml.com/latest/add-ons-03165378ea7b#id-2cd061ac-8db3-1afa-57db-c07876d3bd11)
for possible approaches to maintaining and integrating (forks of) this add-on.

The code in this package is complex and is continously optimized for performance. We would like to
maintain any changes and extensions that you make to this package. We highly appreciate pull
requests for bug fixes, changes, or extensions to this package, as long as they are stable enough
and they are in line with the XHTML standard.
