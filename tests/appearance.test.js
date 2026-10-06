const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/appearance.js'), 'utf8');
function boot(saved, broken = false, match = true) {
  const root = { dataset: {}, style: {} }, meta = {}, media = { matches: true, addEventListener: (_, fn) => media.change = fn };
  const context = { document: { documentElement: root, querySelector: () => meta }, localStorage: { getItem() { if (broken) throw Error(); return saved; }, setItem() { if (broken) throw Error(); } }, window: {} };
  if (match) context.window.matchMedia = () => media;
  vm.runInNewContext(source, context);
  return { api: context.window.BingoAppearance, root, media };
}
test('preferencias válidas, datos corruptos y sistema ausente', () => {
  const a = boot(JSON.stringify({ version: 1, mode: 'light', palette: 'plum' }));
  assert.equal(a.root.dataset.mode, 'light'); assert.equal(a.root.dataset.palette, 'plum');
  for (const invalid of ['{', '{}', 'null', '{"version":9,"mode":"dark","palette":"ocean"}']) {
    const b = boot(invalid); assert.equal(b.api.get().mode, 'system'); assert.equal(b.root.dataset.palette, 'forest');
  }
  assert.equal(boot(null, false, false).root.dataset.mode, 'light');
});
test('fallos de almacenamiento mantienen la selección en memoria', () => {
  const a = boot(null, true); assert.equal(a.root.dataset.mode, 'dark');
  assert.equal(a.api.set({ mode: 'light', palette: 'ocean' }), false);
  assert.equal(a.root.dataset.mode, 'light'); assert.equal(a.api.get().palette, 'ocean');
});
test('cambios del sistema respetan modo explícito y paleta', () => {
  const a = boot(null); a.api.set({ mode: 'system', palette: 'plum' });
  a.media.matches = false; a.media.change(); assert.equal(a.root.dataset.mode, 'light');
  a.api.set({ mode: 'dark', palette: 'plum' }); a.media.change();
  assert.equal(a.root.dataset.mode, 'dark'); assert.equal(a.root.dataset.palette, 'plum');
});
