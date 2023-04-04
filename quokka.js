const newMap = new Map();
const code =
	'newMap.set("a", 1);newMap.set("b", 2);newMap.set("c", 3);newMap.set("d", 4);for (const [key, value] of newMap) {console.log(`${key}: ${value}`);}';
eval(code);
console.log(newMap);
