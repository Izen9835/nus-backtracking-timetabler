// random tests on Javascript syntax things
// (still learning Js)

var test = {
    'obj1': 12,
    'obj2': 13,

};

for (var obj in test) {
    console.log(obj);
}

var bruh = 'lecture';

test[bruh] = [];
test[bruh] += 1;
test[bruh] += 1;
test[bruh] += 1;


for (var obj in test) {
    console.log(obj, test[obj]);
}

console.log(test.hasOwnProperty(bruh));
console.log(test.hasOwnProperty('sdfs'));

var bro = 'fadsf';

test[bro] = [1, 2, 3];
test[bro].push(4);
for (var obj in test) {
    console.log(obj, test[obj]);
}

