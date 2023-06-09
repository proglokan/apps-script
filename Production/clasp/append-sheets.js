function appendSheets() {
	const strToNum = {
		a: 1,
		b: 2,
		c: 3,
		d: 4,
		e: 5,
		f: 6,
		g: 7,
		h: 8,
		i: 9,
		j: 10,
		k: 11,
		l: 12,
		m: 13,
		n: 14,
		o: 15,
		p: 16,
		q: 17,
		r: 18,
		s: 19,
		t: 20,
		u: 21,
		v: 22,
		w: 23,
		x: 24,
		y: 25,
		z: 26,
		aa: 27,
		ab: 28,
		ac: 29,
		ad: 30,
		ae: 31,
		af: 32,
		ag: 33,
		ah: 34,
		ai: 35,
		aj: 36,
		ak: 37,
		al: 38,
		am: 39,
		an: 40,
		ao: 41,
		ap: 42,
		aq: 43,
		ar: 44,
		as: 45,
		at: 46,
		au: 47,
		av: 48,
		aw: 49,
		ax: 50,
		ay: 51,
		az: 52,
		ba: 53,
		bb: 54,
		bc: 55,
		bd: 56,
		be: 57,
		bf: 58,
		bg: 59,
		bh: 60,
		bi: 61,
		bj: 62,
		bk: 63,
		bl: 64,
		bm: 65,
		bn: 66,
		bo: 67,
		bp: 68,
		bq: 69,
		br: 70,
		bs: 71,
		bt: 72,
		bu: 73,
		bv: 74,
		bw: 75,
		bx: 76,
		by: 77,
		bz: 78,
		ca: 79,
		cb: 80,
		cc: 81,
		cd: 82,
		ce: 83,
		cf: 84,
		cg: 85,
		ch: 86,
		ci: 87,
		cj: 88,
		ck: 89,
		cl: 90,
		cm: 91,
		cn: 92,
		co: 93,
		cp: 94,
		cq: 95,
		cr: 96,
		cs: 97,
		ct: 98,
		cu: 99,
		cv: 100,
		cw: 101,
		cx: 102,
		cy: 103,
		cz: 104,
	};

	const extWorkbooks = consoleSheet
		.getRange(2, 2, consoleSheet.getLastRow() - 1)
		.getValues();
	const changes = new Map();

	// const stringToEval = getFromSomething();
  
  changes.set('PO #', 'ad');
  changes.set('PGT Shipping Paid', 'ac');
  changes.set('PGT Prep Fee', 'ac');
	changes.set('PGT Shipped Date', 'aa');
	changes.set('Tracking #2', 'w');
	changes.set('Shipping Provider', 't');
	changes.set('Shipping Service', 't');
	changes.set('Shipping Fee', 'c');

	for (const id of extWorkbooks) {
		const sheet = SpreadsheetApp.openById(id[0]).getSheetByName('Mar 2023');
		for (const [title, after] of changes) {
			sheet.insertColumnAfter(strToNum[after]);
			sheet.getRange(1, strToNum[after] + 1).setValue(title);
		}
    sheet.setName('Order Management');
	}
}
