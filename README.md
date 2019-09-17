---
category: add-on/fontoxml-table-flow-xhtml
---

# XHTML table support

Provide support for XHTML compatible tables.

This packages exposes a single {@link configureAsXhtmlTableElements} function for configuring XHTML table elements.

Use the configureAsXhtmlTableElements like this:

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
	useBorder: true,

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

	// Use createIconWidget to add column icons before rows or columns. Any widget can be added but only icon widget is supported.
	columnBefore: [
		createIconWidget('clock-o', {
			clickOperation: 'lcTime-value-edit',
			tooltipContent: 'Click here to edit the duration'
		})
	],

	rowBefore: [
		createIconWidget('dot-circle-o', {
			clickOperation: 'do-nothing'
		})
	],

	// To add insertion buttons which insert a column or a row at a specific place, default false.
	showInsertionWidget: true,

	// To add highlighting bars which highlight columns and rows, and provide operations popover, default false.
	showHighlightingWidget: true
});

```

To configure the markup labels and contextual operations, use the {@link configureProperties} function.

## Specification

Fonto supports a subset of the [XHTML 1.0 2nd edition](https://www.w3.org/TR/xhtml1/dtds.html) table specification. The
following parts are supported.

| Element    | Attributes                      |
|------------|---------------------------------|
| table      | border                          |
| caption    |                                 |
| (colgroup) |                                 |
| (col)      |                                 |
| thead      |                                 |
| (tfoot)    |                                 |
| tbody      |                                 |
| tr         |                                 |
| th         | rowspan, colspan, align, valign |
| td         | rowspan, colspan, align, valign |

## Implementation notes

- Fonto prefers to not use the `<tfoot>` element and instead create a `<tr>` as child of `<table>` or `<tbody>`.

- Fonto does not use `<col>` or `<colgroup>`, but will respect those elements if they already exist.
