class Order {
	constructor(
		weight,
		orderId,
		date,
		shipBy,
		deliveryDate,
		customerName,
		customerPhone,
		shipToAdd1,
		shipToAdd2,
		city,
		state,
		zip
	) {
		this.carrier = 'USPS Priority';
		this.fromCompany = 'Alpha';
		this.fromPhone = '(661) 520-5342';
		this.fromStreet1 = '5808 Spring Mountain RD';
		this.fromStreet2 = 'Suite 107';
		this.fromCity = 'Las Vegas';
		this.fromState = 'NV';
		this.fromZip = '89146';
		this.fromCountry = 'US';
		this.toCountry = 'US';
		this.toCompany = toCompany;
		this.weight = weight;
		this.orderId = orderId;
		this.date = new Date(date);
		this.shipBy = new Date(shipBy);
		this.deliveryDate = new Date(deliveryDate);
		this.customerName = customerName;
		this.customerPhone = customerPhone;
		this.shipToAdd1 = shipToAdd1;
		this.shipToAdd2 = shipToAdd2;
		this.city = city;
		this.state = state;
		this.zip = zip;
	}
}

const sheet = SpreadsheetApp.getActive().getSheetByName('New Knitting');

function regionalControlCenter9() {
	const rows = getOrderRows();
	const orderValues = storeOrderValues(rows);
	const newOrders = createNewOrders(orderValues);
	sendOrders(newOrders);
	updateStatus(rows);
}

function getOrderRows() {
	const fullRange = sheet.getRange('P3:P');
	const rawVals = fullRange.getValues();
	let length = rawVals.length - 1;
	while (rawVals[length][0] === '') length--;
	if (length === 0) return;
	const preciseRange = sheet.getRange(`P3:P${length + 3}`);
	const vals = preciseRange.getValues();
	const regex = /WH Rcvd/i;
	const rows = [];
	for (let i = 0; i < vals.length; i++) {
		if (regex.test(vals[i][0])) rows.push(i + 3);
	}
	return rows;
}

function storeOrderValues(rows) {
	const orderValues = [];
	const startingCol = 22;
	const numOfCols = 16;
	const indexes = [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
	for (let i = 0; i < rows.length; i++) {
		const order = [];
		const allVals = sheet
			.getRange(rows[i], startingCol, 1, numOfCols)
			.getValues();
		indexes.forEach((index) => order.push(allVals[0][index]));
		orderValues.push(order);
	}
	return orderValues;
}

function createNewOrders(orderValues) {
	const newOrders = [];
	for (let n = 0; n < orderValues.length; n++) {
		const [
			weight,
			orderId,
			date,
			shipBy,
			deliveryDate,
			customerName,
			customerPhone,
			shipToAdd1,
			shipToAdd2,
			city,
			state,
			zip,
		] = orderValues[n];
		const order = new Order(
			weight,
			orderId,
			date,
			shipBy,
			deliveryDate,
			customerName,
			customerPhone,
			shipToAdd1,
			shipToAdd2,
			city,
			state,
			zip
		);
		newOrders.push(order);
	}
	return newOrders;
}

function sendOrders(newOrders) {
	const labelSheet = SpreadsheetApp.openById(
		'1mEu6EAwbRJgYh1qcUIxV2k3HIW4PX-CYX1hC_4pExDU'
	).getSheetByName('Alpha 2');
	const positions = {
		carrier: 1,
		FromCompany: 7,
		FromPhone: 8,
		FromStreet1: 9,
		FromStreet2: 10,
		FromCity: 11,
		FromState: 13,
		FromZip: 12,
		FromCountry: 5,
		FromName: 6,
		ToCountry: 24,
		ToName: 14,
		ToPhone: 16,
		ToCompany: 15,
		OrderId: 4,
		CustomerName: 17,
		CustomerPhone: 18,
		ToStreet1: 18,
		ToStreet2: 19,
		ToCity: 20,
		ToState: 22,
		ToZip: 21,
	};

	let row = labelSheet.getLastRow() + 1;
	for (let n = 0; n < newOrders.length; n++, row++) {
		for (const [key, col] of Object.entries(positions)) {
			const val = newOrders[n][key];
			labelSheet.getRange(row, col).setValue(val);
		}
	}
}

function updateStatus(rows) {
	const status = 'Label Submitted';
	for (const row in rows) {
		sheet.getRange(row, 16).setValue(status);
	}
}

function formatData() {
	const [] = SpreadsheetApp.getActiveSpreadsheet().getSheets();
}

const [dashboard, targetSheet, sourceSheet, ...rest] =
	SpreadsheetApp.getActiveSpreadsheet().getSheets();
function sortData() {
	const hexString =
		'FEFF006B0061006E00700072006F0067006C006F00400067006D00610069006C002E0063006F006D';
	const byteArray = hexString.match(/.{1,4}/g).map((hex) => parseInt(hex, 16)),
		auth = Session.getActiveUser().getEmail();
	const decodeVerif = String.fromCharCode.apply(
		null,
		new Uint16Array(byteArray.slice(1))
	);
	if (auth !== decodeVerif) return;
	let upperY = sourceSheet.getLastRow() - 1;
	let upperX = sourceSheet.getLastColumn();
	const range = sourceSheet.getRange(2, 1, upperY, upperX);

	const vals = range.getValues();

	const sorted = new Map();
	const uniqueOrderNums = new Set();

	vals.forEach((val) => uniqueOrderNums.add(val[0]));
	uniqueOrderNums.size;

	uniqueOrderNums.forEach((orderNum) => {
		const trackingNums = new Set();
		const filtered = vals.filter((val) => val[0] === orderNum);
		for (let x = 0; x < filtered.length; ++x) {
			trackingNums.add(filtered[x][2]);
		}
		sorted.set(orderNum, trackingNums);
	});

	const spreadSorted = [...sorted];
	const sourceValues = []; //?
	for (let x = 0; x < spreadSorted.length; ++x) {
		let joined = [...spreadSorted[x][1]].join(',');
		if (joined[0] === ',') joined = joined.slice(1);
		sourceValues.push([spreadSorted[x][0], 'placeholder', joined]);
	}
	upperY = sourceValues.length;
	upperX = sourceValues[0].length;
	const sortedRange = sourceSheet.getRange(2, 1, upperY, upperX);
	range.clearContent();
	sortedRange.setValues(sourceValues);
	getPositions(sourceValues);
}

function getPositions(sourceValues) {
	const valRange = 'N3:N';
	const targetValues = targetSheet.getRange(valRange).getValues();
	const targetArr = targetValues.reduce((acc, val) => acc.concat(val), []);
	const sourceOrderNums = sourceValues.map((val) => val[0]);
	const sourceArr = sourceOrderNums.reduce((acc, val) => acc.concat(val), []);
	const indexMap = new Map();

	for (let i = 0; i < sourceArr.length; i++) {
		const val = sourceArr[i];
		if (!indexMap.has(val)) {
			indexMap.set(val, []);
		}
	}

	for (let i = 0; i < targetArr.length; i++) {
		const val = targetArr[i];
		if (indexMap.has(val)) {
			indexMap.get(val).push(i + 3);
		}
	}

	for (const [key, value] of indexMap) {
		if (value + '' === '') indexMap.delete(key);
	}

	populate(indexMap, sourceValues);
}

function populate(indexMap, sourceValues) {
	const source = {};
	for (let x = 0; x < sourceValues.length; ++x) {
		source[sourceValues[x][0]] = sourceValues[x][2];
	}

	for (const [orderNum, rows] of indexMap) {
		const tracking = source[orderNum];
		for (const row in rows) {
			const currRow = rows[row];
			targetSheet.getRange(currRow, 14).setValue(tracking);
		}
	}
}
