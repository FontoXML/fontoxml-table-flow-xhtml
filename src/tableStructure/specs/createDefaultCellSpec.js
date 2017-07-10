define([
], function (
) {
	'use strict';

	return function createDefaultCellspec (_rowIndex, _columnIndex, amountOfColumns) {
		// For a default cell specification we directly set a % width with a proportional (*) marker.
		var width = 100 / amountOfColumns;

		return {
			rows: '1',
			cols: '1',
			width: width + '*'
		};

	};
});
