define([
	'fontoxml-table-flow'
], function (
	tableFlow
) {
	'use strict';

	var ColumnSpecification = tableFlow.ColumnSpecification;

	return function createDefaultColspec (columnIndex) {
		return new ColumnSpecification(
				// alignment
				null,
				// columnName
				'column-' + columnIndex,
				// columnNumber
				columnIndex,
				// columnSeparator
				true,
				// columnWidth
				'1*',
				// rowSeparator
				true,
				// unitOfWidth
				'*',
				// isProportion
				null,
				// oldColumnName
				null
			);
	};
});
