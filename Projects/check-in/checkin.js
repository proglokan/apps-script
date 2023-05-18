'use strict';

class Order {
	// @param {Integer} row → row of order in dataSheet
	// @param {String | Integer} orderId → supplier orderId or tracking number
	// @param {String} productName → name of product
	// @param {String} sku → sku of product
	// @param {Integer} quantity → quantity of product in order
	// @param {String} secret → indicates the workbook the order came from
	constructor(
		poNum,
		customerName,
		customerPhone,
		addressOne,
		addressTwo,
		city,
		state,
		zip,
		itemDescription,
		quantity,
		sku,
		inboundNotes,
		units,
		inboundPO,
		inboundOrderID,
		inboundTracking,
		outboundStatus,
		outboundLabel,
		pointer,
		secret,
		query
	) {
		this.poNum = poNum;
		this.customerName = customerName;
		this.customerPhone = customerPhone;
		this.addressOne = addressOne;
		this.addressTwo = addressTwo;
		this.city = city;
		this.state = state;
		this.zip = zip;
		this.itemDescription = itemDescription;
		this.quantity = quantity;
		this.sku = sku;
		this.inboundNotes = inboundNotes;
		this.units = units;
		this.inboundPO = inboundPO;
		this.inboundOrderID = inboundOrderID;
		this.inboundTracking = inboundTracking;
		this.outboundStatus = outboundStatus;
		this.outboundLabel = outboundLabel;
		this.pointer = pointer;
		this.secret = secret;
		this.query = query;
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

const [clientDataSheet, dataSheet, querySheet, skuSheet, processedSheet, ...rest] = SpreadsheetApp.getActive().getSheets();

function getExternalWorkbookData() {
	return clientDataSheet.getRange(2, 2, clientDataSheet.getLastRow() - 1, 2).getValues();
}

function startOfDay() {
	const workbookData = getExternalWorkbookData();
	const workbookStatuses = getWorkbookStatuses(workbookData);
	const errorInWorkbooks = checkWorkbookStatuses(workbookStatuses);
	if (errorInWorkbooks) {
		displayWorkbookStatus(workbookStatuses);
		return;
	}

	getAndPostData(workbookData);
}

function getWorkbookStatuses(workbookData) {
	const statuses = {
		ordered: [],
		unordered: [],
	};

	for (const workbook of workbookData) {
		const [id, secret] = workbook;
		const sheet = SpreadsheetApp.openById(id).getSheetByName('Order Management');
		const headers = getHeaders(id, sheet);
		const col = headers.get('Pointer');
		const upperY = sheet.getLastRow();
		const rowPointersRange = sheet.getRange(2, col, upperY, 1);

		const rowPointersStrings = rowPointersRange.getValues().filter(Number).join(',').split(',');

		const rowPointers = rowPointersStrings.map((pointer) => +pointer);

		const isSorted = rowPointers.every((val, index, arr) => !index || arr[index - 1] <= val);
		if (isSorted) {
			statuses.ordered.push(secret);
			continue;
		}
		statuses.unordered.push(secret);
	}

	if (statuses.unordered.length) return statuses;
	return false;
}

function checkWorkbookStatuses(workbookStatuses) {
	if (!workbookStatuses) return false;
	if (workbookStatuses.unordered.length) return true;
}

function displayWorkbookStatus(workbookStatuses) {
	const template = HtmlService.createTemplateFromFile('workbook-status');
	template.workbookStatuses = workbookStatuses;
	const html = template.evaluate().setWidth(400).setHeight(400);
	const ui = SpreadsheetApp.getUi();
	ui.showModelessDialog(html, 'Workbook Statuses');
}

// @result {Data} → pulls data from all external workbooks and puts it into the dataSheet
function getAndPostData(workbookData) {
	const [id, secret] = workbookData[0];

	const headers = getHeaders(id, null);
	const titles = [
		'PO#',
		'Customer Name',
		'Customer Phone Number',
		'Ship to Address 1',
		'Ship to Address 2',
		'City',
		'State',
		'Zip',
		'Item Description',
		'Qty',
		'SKU',
		'Inbound Notes',
		'Units',
		'Inbound PO',
		'Inbound Order ID',
		'Inbound Tracking(s)',
		'Outbound Status',
		'Outbound Label(s)',
		'Pointer',
	];

	for (const sheet of workbookData) {
		const [id, secret] = sheet;
		const currSheet = SpreadsheetApp.openById(id).getSheetByName('Order Management');

		const upperX = currSheet.getLastColumn();
		const upperY = currSheet.getLastRow();
		const range = currSheet.getRange(2, 1, upperY, upperX);
		const values = range.getValues();
		for (const value of values) value.unshift('spacer');
		const outboundIndex = headers.get('Outbound Status');

		const targetRows = values.filter(
			(row) => row[outboundIndex] === 'Outbound Pending' || row[outboundIndex] === 'Stop Shipment' || row[outboundIndex] === 'Label Ready'
		);

		const targetValues = targetRows.map((row) => {
			return titles.map((title) => {
				return row[headers.get(title)];
			});
		});

		postData(targetValues, secret);
	}
}

function postData(targetValues, secret) {
	const upperX = targetValues[0].length;
	const upperY = targetValues.length;
	const startingRow = dataSheet.getLastRow() + 1;
	const valuesRange = dataSheet.getRange(startingRow, 1, upperY, upperX);
	valuesRange.setValues(targetValues).setBackground(secret);
}

// @result {Process} → prep data for checklist process
function regionalControlCenter9(headers = null) {
	const orders = getOrders();
	const query = getNextQuery();
	const instances = searchOrdersMatrix(orders, query);
	const data = getInstanceData(instances);
	const newOrders = createNewOrders(data, query);
	displayChecklist(newOrders);
}

function getHeaders(id, sheet) {
	if (!sheet) sheet = SpreadsheetApp.openById(id).getSheetByName('Order Management');
	const upperX = sheet.getLastColumn();

	const headersRow = sheet.getRange(1, 1, 1, upperX).getValues()[0];
	headersRow.unshift('spacer');

	const headers = new Map();

	headersRow.forEach((header, index) => {
		headers.set(header, index);
	});

	return headers;
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
// @return {Array} data → each position represents a column from 1 to upperX, last position is secret
function getInstanceData(instances) {
	const data = [];

	const columnIndexes = () => {
		const upperX = dataSheet.getLastColumn();
		const indexes = [];
		for (let x = 1; x <= upperX; ++x) indexes.push(n);
		return indexes;
	};

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
		const [
			poNum,
			customerName,
			customerPhone,
			addressOne,
			addressTwo,
			city,
			state,
			zip,
			itemDescription,
			quantity,
			sku,
			inboundNotes,
			units,
			inboundPO,
			inboundOrderID,
			inboundTracking,
			outboundStatus,
			outboundLabel,
			pointer,
			secret,
		] = data[n];

		const order = new Order(
			poNum,
			customerName,
			customerPhone,
			addressOne,
			addressTwo,
			city,
			state,
			zip,
			itemDescription,
			quantity,
			sku,
			inboundNotes,
			units,
			inboundPO,
			inboundOrderID,
			inboundTracking,
			outboundStatus,
			outboundLabel,
			pointer,
			secret,
			query
		);

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
// DEV NOTE: store every processed order in a single column in the order log, then use store secret to determine where to store the order
function storeOrder(finalizedOrder) {
	const columnPositions = () => {
		const upperX = clientDataSheet.getLastColumn();
		const upperY = clientDataSheet.getLastRow();
		const clientDataRange = clientDataSheet.getRange(2, upperX, upperY + 1, 1);
		const clientData = clientDataRange.getValues().join(',').split(',');
		const indexes = formattedClientData.map((secret, index) => index + 2);
		const columnPositions = {};
		for (let x = 0; x < indexes.length; x++) {
			const secret = clientData[x];
			const index = indexes[x];
			columnPositions[secret] = index;
		}
		return columnPositions;
	};

	const { secret, row, weight, processingFee, packagingFee, shippingFee, date, time, status } = finalizedOrder;

	const column = columnPositions[secret];
	const joinOrder = `${row}>${weight}>${processingFee}>${packagingFee}>${shippingFee}>${date}>${time}>${status}`;
	const lastRowInCol = processedSheet.getRange(1, column, 300).getValues().filter(String).length + 1;
	const range = processedSheet.getRange(lastRowInCol, column);
	range.setValue(joinOrder);
	SpreadsheetApp.getActive().toast(`Stored at row: ${lastRowInCol} col: ${column}`);
	regionalControlCenter9();
}

// @result {Data} → handle data after warehouse is finished, returns information to every applicable workbook
function endOfDay() {
	const workbookEntries = instantiateWorkbooks();
	const orderMatrix = createOrderMatrix(workbookEntries);
	allocateOrders(orderMatrix);
}

// @return {Object} workbookEntries → object with secret as key and workbook id as value
function instantiateWorkbooks() {
	const workbookEntries = {};
	const rows = clientDataSheet.getLastRow();
	const range = clientDataSheet.getRange(2, 2, rows - 1, 2);
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
				let [row, weight1, processingFee, packagingFee, shippingFee, date, time, status] = orderInfo;
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

function handleStoppedShipment(inventoryData) {
	const { productName, units } = inventoryData;
	const upperY = inventorySheet.getLastRow();
	const dataRange = inventorySheet.getRange(2, 1, upperY, 1);
	const data = dataRange.getValues();

	const regex = new RegExp(productName, 'i');

	let row = null,
		index = 0;

	while (row === null) {
		const cell = data[index][0];
		const productNameExists = regex.test(cell);
		if (productNameExists) row = index + 2;
	}

	const unitsRange = inventorySheet.getRange(row, 2);
	const unitsInStock = unitsRange.getValue();
	const newUnits = +unitsInStock + +units;
	unitsRange.setValue(newUnits);
	regionalControlCenter9();
}
