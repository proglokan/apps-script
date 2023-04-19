'use strict';
class Order {
	// @param {Integer} row → row of order in dataSheet
	// @param {String | Integer} orderId → supplier orderId or tracking number
	// @param {String} productName → name of product
	// @param {String} sku → sku of product
	// @param {Integer} quantity → quantity of product in order
	// @param {String} secret → indicates the workbook the order came fromk
	constructor(productName, query, quantity, sku, row, secret) {
		this.productName = productName;
		this.query = query;
		this.quantity = quantity;
		this.sku = sku;
		this.row = row;
		this.secret = secret;
		this.weight = null;
		this.packageMap = null;
		this.fragile = null;
	}

	// @param {String} sku → sku of product
	getSku(sku) {
		const lastRow = skuSheet.getLastRow();
		const skuLog = skuSheet.getRange(1, 1, lastRow).getValues();
		const skuLogStr = skuLog.join(',');
		const regex = new RegExp(sku, 'g');
		if (regex.test(skuLogStr)) {
			const skuLogArr = skuLogStr.split(',');
			let skuData,
				currIndex = 0;
			while (skuData === undefined) {
				if (regex.test(skuLogArr[currIndex])) skuData = skuLogArr[currIndex];
				currIndex++;
			}
			const skuInfo = skuData.split('|');
			this.weight = skuInfo[1];
			this.packageMap = skuInfo[2];
			this.fragile = skuInfo[3] === 'true';
		}
	}
}

const [consoleSheet, dataSheet, querySheet, skuSheet, processedSheet, ...rest] =
	SpreadsheetApp.getActive().getSheets();

// @result {UI} → shows the status of the `Row` column for each workbook, green is sorted, red is not
function checkRowIndexColumn() {
	const extWorkbooks = consoleSheet
		.getRange(2, 1, consoleSheet.getLastRow() - 1, 2)
		.getValues();

	const statuses = {
		ordered: [],
		mixed: [],
	};

	let colPosition;
	for (const workbook of extWorkbooks) {
		const name = workbook[0];
		const id = workbook[1];
		const sheet = SpreadsheetApp.openById(id).getSheetByName('Mar 2023');
		if (!sheet) continue;
		const headersRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
		const headers = headersRange.getValues()[0];
		const col = headers.indexOf('Row') + 1;
		colPosition = col;
		const rowIndexRange = sheet.getRange(1, col, sheet.getLastRow());
		const rowIndexes = rowIndexRange
			.getValues()
			.filter(Number)
			.join(',')
			.split(',');
		const vals = rowIndexes.map((val) => +val);
		const isSorted = vals.every((v, i, a) => !i || a[i - 1] <= v);
		if (isSorted) {
			statuses.ordered.push(name);
			continue;
		}
		statuses.mixed.push(name);
	}

	const template = HtmlService.createTemplateFromFile('row-check');
	template.statuses = statuses;
	const html = template.evaluate().setWidth(1000).setHeight(800);
	const ui = SpreadsheetApp.getUi();
	ui.showModelessDialog(html, `Row #${colPosition} statuses`);
}

// @result {Data} → pulls data from all external workbooks and puts it into the dataSheet
function pullData() {
	const extWorkbooks = consoleSheet.getRange(2, 2, 1, 2).getValues();

	// range area
	const ranges = {
		initial: 'N3:N',
		rows: null,
		supplierValues: 'N3:O',
		orderValues: 'AP3:AR',
		rowValues: 'AV3:AV',
	};

	for (const sheet of extWorkbooks) {
		const [id, secret] = sheet;
		Logger.log(id);
		const currSheet = SpreadsheetApp.openById(id).getSheetByName('Mar 2023');
		const initialData = currSheet.getRange(ranges.initial).getValues();
		let length = initialData.length - 1;
		while (length > 0 && initialData[length][0] === '') length--;
		if (length === 0) continue;
		ranges.rows = length;
		const supplierValues = currSheet
			.getRange(ranges.supplierValues)
			.getValues();
		const orderValues = currSheet.getRange(ranges.orderValues).getValues();
		const rowValues = currSheet.getRange(ranges.rowValues).getValues();
		const concatenatedValues = [];
		for (let n = 0; n < ranges.rows; n++) {
			concatenatedValues[n] = supplierValues[n].concat(
				orderValues[n].concat(rowValues[n])
			);
		}

		const lastRow = dataSheet.getLastRow() + 1;

		dataSheet
			.getRange(
				lastRow,
				1,
				concatenatedValues.length,
				concatenatedValues[0].length
			)
			.setValues(concatenatedValues)
			.setBackground(secret);
	}
}

// @result {Process} → prep data for checklist process
function regionalControlCenter9() {
	const orders = getOrders();
	const query = getNextQuery();
	const instances = searchOrdersMatrix(orders, query);
	const data = getInstanceData(instances);
	const newOrders = createNewOrders(data, query);
	displayChecklist(newOrders);
}

// @return {Matrix} orders → row of matrix = [supplierID, tracking, ...others]
function getOrders() {
	const lastRow = dataSheet.getLastRow();
	const lastCol = dataSheet.getLastColumn();
	const orders = dataSheet.getRange(2, 1, lastRow, lastCol).getValues();
	return orders;
}

// @return {String} query → supplier Id, tracking, etc.
function getNextQuery() {
	return querySheet.getRange(querySheet.getLastRow(), 1).getValue();
}

// @param {Matrix} orders → row of matrix = [supplierID, tracking, ...others]
// @param {String||Integer} query → supplier Id, tracking, etc.
// @return {Array} instances → array of every row index that contains the query
function searchOrdersMatrix(orders, query) {
	query = query.toString();
	const regex = new RegExp(query, 'i');
	const instances = [];

	for (let n = 0; n < orders.length; n++) {
		const row = orders[n].join('');
		const rowMatches = regex.test(row);
		if (rowMatches) instances.push(n + 2);
	}

	return instances;
}

// @param {Array} instances → array of row indexes
// @return {Array} data → matrix of order data to be used to construct new order objects
function getInstanceData(instances) {
	const data = [];
	// range area
	const columnIndexes = [3, 4, 5, 6];

	for (let n = 0; n < instances.length; n++) {
		const newData = [];
		const rowIndex = instances[n];
		for (const columnIndex of columnIndexes) {
			const val = dataSheet.getRange(rowIndex, columnIndex).getValue();
			newData.push(val);
		}
		const secret = dataSheet.getRange(rowIndex, 1).getBackground();
		newData.push(secret);
		data.push(newData);
	}
	return data;
}

// @param {Array} data → matrix of order data to be used to construct new order objects
// @return {Array} ordersObj → array of order objects
function createNewOrders(data, query) {
	const ordersObj = [];
	for (let n = 0; n < data.length; n++) {
		const [productName, quantity, sku, row, secret] = data[n];
		const order = new Order(productName, query, quantity, sku, row, secret);
		order.getSku(sku);
		ordersObj.push(order);
	}

	return ordersObj;
}

// @result {UI} → displays checklist for order processing
function displayChecklist(orders) {
	const template = HtmlService.createTemplateFromFile('checklist');
	template.orders = orders;
	const html = template.evaluate().setWidth(955).setHeight(1000);
	const ui = SpreadsheetApp.getUi();
	ui.showModelessDialog(html, 'Order Checklist');
}

function nextQuery() {
	querySheet.getRange(querySheet.getLastRow(), 1).setValue('');
	regionalControlCenter9();
}

// @result {Process} → handle data after checklist is submitted
function midgard(order, skuNeedsStored) {
	if (skuNeedsStored) storeSku(order.sku);
	order.fee = getFee(order.weight, order.packageMap);
	const finalizedOrder = initFinalVals(order);
	storeOrder(finalizedOrder);
}

// @param {Object} sku → formatted sku information: SKU|Weight|PackageMap|Fragile
// @result {Data} → stores sku in sku log
function storeSku(sku) {
	const lastRow = skuSheet.getLastRow();
	skuSheet.getRange(lastRow + 1, 1).setValue(sku);
}

// @param {String} weight → weight of order, either a single number or two numbers formatting as 'X+Y'
// @param {String} packageMap → package map of order, either a envelope or box type
// @return {Object} fee → object containing processing and packaging fees
function getFee(weight, packageMap) {
	if (isNaN(+weight)) {
		const weightVals = weight.split('+');
		weight = +weightVals[0] + +weightVals[1];
	}

	const fee = {
		processing: null,
		packaging: null,
		shipping: null,
	};

	fee.shipping = 6;

	const shippingWeight = Math.round(weight / 16);

	if (shippingWeight > 8) fee.shipping = 10.5;

	switch (true) {
		case weight <= 80:
			fee.processing = 3;
			break;
		case weight > 80 && weight <= 128:
			fee.processing = 3.25;
			break;
		case weight > 128 && weight <= 176:
			fee.processing = 3.5;
			break;
		case weight > 176 && weight <= 400:
			fee.processing = 4.5;
			break;
		case weight > 400 && weight <= 576:
			fee.processing = 5;
			break;
		case weight > 576 && weight <= 800:
			fee.processing = 5.5;
			break;
	}

	const packingMaterials = {
		env: '000 3 BB3 5 BB5 7 BB7 BB9 BB24 7x7x7 10x10x10 12x12x12 12x8x8 18x12x8 asis',
		box: {
			'18x18x16': 2.75,
			'18x18x24': 3.25,
			'24x24x24': 4.75,
		},
	};

	const regex = new RegExp(packageMap, 'i');
	if (regex.test(packingMaterials.env)) {
		fee.packaging = 1;
		return fee;
	}

	for (const box in packingMaterials.box) {
		if (regex.test(box)) {
			fee.packaging = packingMaterials.box[box];
			return fee;
		}
	}
}

// @param {Object} order → order object created from checklist submission
// @return {Object} finalizedOrder → order object with finalized values
function initFinalVals(order) {
	const newDate = new Date();
	const date = newDate.toLocaleDateString();
	const time = newDate.toLocaleTimeString();
	const status = 'WH Rcvd';
	let weight = order.weight;

	const finalizedOrder = {
		secret: order.secret,
		row: order.row,
		weight: weight,
		processingFee: order.fee.processing,
		packagingFee: order.fee.packaging,
		shippingFee: order.fee.shipping,
		date: date,
		time: time,
		status: status,
	};
	return finalizedOrder;
}

// @param {Object} finalizedOrder → order object with finalized values
// @result {Data} → stores finalized order in order log, formatted as row>weight>processingFee>packagingFee>date>time>status
function storeOrder(finalizedOrder) {
	const columnGuide = {
		'#ffffff': 13,
		'#fefefe': 2,
		'#fdfdfd': 3,
		'#fcfcfc': 4,
		'#fbfbfb': 5,
		'#fafafa': 6,
		'#f9f9f9': 7,
		'#f8f8f8': 8,
		'#f7f7f7': 9,
		'#f6f6f6': 10,
		'#f5f5f5': 11,
		'#f4f4f4': 12,
		'#f3f3f3': 1,
	};
	const {
		secret,
		row,
		weight,
		processingFee,
		packagingFee,
		shippingFee,
		date,
		time,
		status,
	} = finalizedOrder;
	const column = columnGuide[secret];
	const joinOrder = `${row}>${weight}>${processingFee}>${packagingFee}>${shippingFee}>${date}>${time}>${status}`;
	const lastRowInCol =
		processedSheet.getRange(1, column, 300).getValues().filter(String).length +
		1;
	const range = processedSheet.getRange(lastRowInCol, column);
	range.setValue(joinOrder);
	SpreadsheetApp.getActive().toast(
		`Stored at row: ${lastRowInCol} col: ${column}`
	);
	regionalControlCenter9();
}

// @result {Process} → handle data after warehouse is finished, returns information to every applicable workbook
function endOfDay() {
	const workbookEntries = instantiateWorkbooks();
	const orderMatrix = createOrderMatrix(workbookEntries);
	allocateOrders(orderMatrix);
}

// @return {Object} workbookEntries → object with secret as key and workbook id as value
function instantiateWorkbooks() {
	const workbookEntries = {};
	const rows = consoleSheet.getLastRow();
	const range = consoleSheet.getRange(2, 2, rows - 1, 2);
	const workbookData = range.getValues();
	for (const workbook of workbookData) {
		const id = workbook[0];
		const secret = workbook[1];
		workbookEntries[secret] = id;
	}
	console.log(workbookEntries);
	return workbookEntries;
}

// @param {Object} workbookEntries → object with secret as key and workbook id as value
// @return {Matrix} orderMatrix → matrix of maps where every key is a workbook id and every value is [[order1], [order2], ...
function createOrderMatrix(workbookEntries) {
	const columns = processedSheet.getLastColumn();
	const orderMatrix = [];
	for (let n = 1; n <= columns; n++) {
		const secret = processedSheet.getRange(1, n).getBackground();
		const id = workbookEntries[secret];
		const range = processedSheet.getRange(2, n, 300, 1);
		const rawVals = range.getValues();
		const vals = rawVals.filter(String);
		const map = new Map();
		map.set(id, vals);
		orderMatrix.push(map);
	}
	return orderMatrix;
}

// @param {Matrix} orderMatrix → matrix of maps where every key is a workbook id and every value is [[order1], [order2], ...
// @result {Data} → stores finalized & parsed order info in every applicable workbook
function allocateOrders(orderMatrix) {
	// range area
	const col = {
		status: 19,
		weight1: 25,
		weight2: 26,
		date: 61,
		time: 62,
		processingFee: null,
		packagingFee: null,
	};
	for (const map of orderMatrix) {
		for (const [id, vals] of map) {
			const sheet = SpreadsheetApp.openById(id).getSheetByName('Mar 2023');
			vals.forEach((val) => {
				const orderInfo = val[0].split('>');
				let [
					row,
					weight1,
					processingFee,
					packagingFee,
					shippingFee,
					date,
					time,
					status,
				] = orderInfo;
				let weight2 = null;
				if (isNaN(+weight1)) {
					[weight1, weight2] = weight1.split('+');
					weight2 = Math.ceil(+weight2 / 16);
				}
				weight1 = Math.ceil(+weight1 / 16);
				const orderKVP = {
					row,
					weight1,
					weight2,
					// processingFee,
					// packagingFee,
					// shippingFee,
					date,
					time,
					status,
				};
				for (const key in orderKVP) {
					if (key === 'row') continue;
					sheet.getRange(orderKVP.row, col[key]).setValue(orderKVP[key]);
				}
				Logger.log(val);
			});
		}
	}
}
