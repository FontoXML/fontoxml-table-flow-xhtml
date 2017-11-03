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
	}
});

```

To configure the markup labels and contextual operations, use the {@link configureProperties} function.
