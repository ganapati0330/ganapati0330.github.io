'use strict';
// acorn 静的解析：未宣言変数参照、DOM ID 完全性
const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk');
const html = fs.readFileSync(__dirname + '/dist/index.html', 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script' });
const declared = new Set(['window', 'document', 'Math', 'Object', 'Array', 'Image', 'Number', 'String', 'JSON', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'navigator', 'screen', 'Event', 'ResizeObserver', 'console', 'confirm', 'AudioContext', 'undefined', 'Infinity', 'NaN', 'Date', 'Error', 'module', 'require', 'Boolean', 'parseInt', 'parseFloat', 'isNaN', 'Promise', 'localStorage', 'Int8Array', 'Path2D', 'fetch', 'performance', 'URL', 'Blob', 'Audio', 'ArrayBuffer', 'DataView', 'Int16Array', 'Float64Array', 'Float32Array', 'Uint8Array']);
// グローバル宣言収集
ast.body.forEach(n => {
  if (n.type === 'VariableDeclaration') n.declarations.forEach(d => collect(d.id));
  if (n.type === 'FunctionDeclaration') declared.add(n.id.name);
});
function collect(p) { if (p.type === 'Identifier') declared.add(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(x => collect(x.value)); else if (p.type === 'ArrayPattern') p.elements.forEach(x => x && collect(x)); }
// スコープ解析（簡易）：関数ごとの宣言を集めて参照チェック
const problems = [];
function analyze(fnNode, parentScope) {
  const scope = new Set(parentScope);
  if (fnNode.params) fnNode.params.forEach(p => collectInto(p, scope));
  if (fnNode.id && fnNode.type === 'FunctionExpression') scope.add(fnNode.id.name);
  // 巻き上げ：この関数内の var / function 宣言（ネスト関数を除く）
  walk.recursive(fnNode.body, null, {
    VariableDeclaration(n, st, c) { n.declarations.forEach(d => { collectInto(d.id, scope); if (d.init) c(d.init, st); }); },
    FunctionDeclaration(n) { scope.add(n.id.name); },
    FunctionExpression() {}, ArrowFunctionExpression() {},
    CatchClause(n, st, c) { if (n.param) collectInto(n.param, scope); c(n.body, st); }
  });
  // 参照チェック
  walk.recursive(fnNode.body, null, {
    Identifier(n) { if (!scope.has(n.name)) problems.push('undeclared: ' + n.name + ' @' + n.start); },
    MemberExpression(n, st, c) { c(n.object, st); if (n.computed) c(n.property, st); },
    Property(n, st, c) { if (n.computed) c(n.key, st); c(n.value, st); },
    FunctionDeclaration(n) { analyze(n, scope); },
    FunctionExpression(n) { analyze(n, scope); },
    ArrowFunctionExpression(n) { analyze(n, scope); },
    CatchClause(n, st, c) { c(n.body, st); },
    LabeledStatement(n, st, c) { c(n.body, st); },
    BreakStatement() {}, ContinueStatement() {}
  });
}
function collectInto(p, s) { if (p.type === 'Identifier') s.add(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(x => collectInto(x.value, s)); else if (p.type === 'ArrayPattern') p.elements.forEach(x => x && collectInto(x, s)); else if (p.type === 'AssignmentPattern') collectInto(p.left, s); else if (p.type === 'RestElement') collectInto(p.argument, s); }
analyze({ params: [], body: { type: 'Program', body: ast.body } }, declared);
// DOM ID
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]).concat([...code.matchAll(/id: '([A-Za-z]+)'/g)].map(m => m[1])).concat([...code.matchAll(/amtHtml\('([A-Za-z]+)'/g)].map(m => m[1])).concat([...code.matchAll(/offPickHtml\('([A-Za-z]+)'/g)].flatMap(m => [m[1], m[1] + 'P'])));
[...code.matchAll(/\$\('([A-Za-z0-9_]+)'\)/g)].forEach(m => { if (!ids.has(m[1])) problems.push('missing DOM id: ' + m[1]); });
[...code.matchAll(/\$\('([a-z]+)_' \+ d\)/g)].forEach(m => ['easy', 'normal', 'hard'].forEach(d => { if (!ids.has(m[1] + '_' + d)) problems.push('missing DOM id: ' + m[1] + '_' + d); }));
const uniq = [...new Set(problems)];
console.log(uniq.length ? uniq.join('\n') : 'lint OK');
process.exit(uniq.length ? 1 : 0);
