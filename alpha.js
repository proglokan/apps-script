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
