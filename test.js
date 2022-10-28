function a(...args) {
  console.log({ b });
  console.log(...args);
}

const b = 'b';
const c = 'c';
const d = 'd';
const e = 'e';
const f = 'f';

a(b, d, d, e, f);
