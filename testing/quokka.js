'use strict';
const object = {
	name: 'John',
	age: 32,
};

const objectToString = JSON.stringify(object).replace(/"|{|}/g, '').split(',').join('\n').replace(/:/g, ' → ');
console.log(objectToString);
