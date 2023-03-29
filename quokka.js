// /*?.*/ → test code speed

const arr = [];
for (let n = 0; n < 1000; ++n) {
	arr.push(Math.floor(Math.random() * 10000));
}

for (let n = 0; n < 100; ++n) {
	const evenNums = arr.filter((num) => num % 2 === 0); //?.
}

for (let n = 0; n < 100; ++n) {
	const evenNums = [];
	for (let x = 0; x < arr.length; ++x) {
		if (!(arr[x] % 2)) evenNums.push(arr[x]); //?.
	}
}

for (let n = 0; n < 100; ++n) {
	let sum = arr.reduce((acc, num) => acc + num, 0); //?.
}

for (let n = 0; n < 100; ++n) {
	let sum = 0;
	for (let x = 0; x < arr.length; ++x) {
		sum += arr[x]; //?.
	}
}
