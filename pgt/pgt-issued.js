function pgt() {
	const sheet =
		SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Mar 2023');
	const range = 'AB3:AA';
	const rawVals = sheet.getRange(range).getValues();

	const links = rawVals
		.map((val, index) => {
			if (val[0] !== 'PGT Issued') {
				return null;
			}
			val = [val[1], index + 3];
			return val;
		})
		.filter(Boolean);

	const template = HtmlService.createTemplateFromFile('pgts.html');
	template.links = links;
	const html = template.evaluate().setWidth(955).setHeight(1000);
	const ui = SpreadsheetApp.getUi();
	ui.showModelessDialog(html, 'PGTs');
}

function updatePGTs(printedLinks) {
	for (const row of printedLinks) {
		sheet.getRange(row, 28).setValue('PGT Sent');
	}
}
