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

	// Widget area before columns. Any widget can be used, but only the {@link iconWidget} is supported here. Optional, defaults to an empty array.
	columnBefore: [
		createIconWidget('clock-o', {
			clickOperation: 'lcTime-value-edit',
			tooltipContent: 'Click here to edit the duration'
		})
	],

	// Widget are before rows. Any widget can be used, but only the {@link iconWidget} is supported here. Optional, defaults to an empty array.
	rowBefore: [
		createIconWidget('dot-circle-o', {
			clickOperation: 'do-nothing'
		})
	],

	// This will show buttons that insert a new column or row. Optional, defaults to false.
	showInsertionWidget: true,

	// This will show areas that can be hovered over to hightlight a column or row and that can be clicked to show a operations popover. Optional, defaults to false.
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
| colgroup*  |                                 |
| col*       |                                 |
| thead      |                                 |
| tfoot*     |                                 |
| tbody      |                                 |
| tr         |                                 |
| th         | rowspan, colspan, align, valign |
| td         | rowspan, colspan, align, valign |

\* **Note** that this add-on supports tables that contain `col`, `colgroup`, and `tfoot` elements. However, these elements are _ignored_ by this add-on and these elements _will not_ be inserted into new tables.
