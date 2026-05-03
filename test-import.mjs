console.log('before import');
const { parse } = await import('@babel/parser');
console.log('parser:', typeof parse);
const tr = await import('@babel/traverse');
console.log('traverse keys:', Object.keys(tr).slice(0, 5));
const types = await import('@babel/types');
console.log('types isJSXElement:', typeof types.isJSXElement);
