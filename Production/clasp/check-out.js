function checkOut() {
	const workbooks = storeWorkbooks();
	const barcode = getBarcode();
	const parsedBarcode = parseBarcode(barcode, workbooks);
	const labels = getLabels(parsedBarcode);
	displayLabels(labels);
}

function storeWorkbooks() {
	const externalWorkbooks = consoleSheet
		.getRange(2, 2, consoleSheet.getLastRow() - 1, 2)
		.getValues();
	const workbookInfo = {};
	for (const row of externalWorkbooks) {
		workbookInfo[row[1]] = row[0];
	}
	return workbookInfo;
}

function getBarcode() {
	const ui = SpreadsheetApp.getUi();
	const barcodeVal = ui
		.prompt('Enter Barcode', ui.ButtonSet.OK_CANCEL)
		.getResponseText();
	return barcodeVal;
}

function parseBarcode(barcode, workbooks) {
	const [ secret, row, labelCount ] = barcode.split('>');
	const id = workbooks[secret];
	return { id, row, labelCount };
}

function getLabels(parsedBarcode) {
	const { id, row, labelCount } = parsedBarcode;
	const labels = {};
	const sheet = SpreadsheetApp.openById(id).getSheetByName('Mar 2023');
	const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
	const startingCol = headers[0].indexOf('Shipping Label 1') + 1;
	const range = sheet.getRange(row, startingCol, 1, 2);
  const statusRange = sheet.getRange(row, 19);
  statusRange.setValue('Not scanned yet');
  sheet.getRange(row, 20).setValue(new Date().toLocaleDateString());
	const values = range.getValues();
  labels.firstLabel = values[0][0];
	if (+labelCount < 2) {
    labels.secondLabel = null;
    return labels;
  }
	labels.secondLabel = values[0][1];
	return labels;
}

function displayLabels(labels) {
	const template = HtmlService.createTemplateFromFile('labels');
	template.labels = labels;
	const html = template.evaluate().setWidth(400).setHeight(400);
	const ui = SpreadsheetApp.getUi();
	ui.showModelessDialog(html, 'Labels');
}
