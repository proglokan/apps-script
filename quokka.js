// /*?.*/ → test code speed
const arrOfStrings = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const string = 'j';
const regex = new RegExp(string, 'i');
arrOfStrings.some((num) => regex.test(num)); //?
