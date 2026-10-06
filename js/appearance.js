/* Preferencias visuales independientes de las partidas. Se ejecuta antes del CSS. */
(() => {
  'use strict';
  const key = 'bingo-clasico-musical:appearance:v1';
  const valid = value => value && value.version === 1 && ['system', 'light', 'dark'].includes(value.mode) && ['forest', 'ocean', 'plum'].includes(value.palette);
  let preference = { version: 1, mode: 'system', palette: 'forest' }, media;
  try { const saved = JSON.parse(localStorage.getItem(key)); if (valid(saved)) preference = saved; } catch (_) { /* El juego funciona sin almacenamiento visual. */ }
  try { media = window.matchMedia('(prefers-color-scheme: dark)'); } catch (_) { /* Claro si no hay consulta del sistema. */ }
  function apply() {
    const mode = preference.mode === 'system' ? (media && media.matches ? 'dark' : 'light') : preference.mode;
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.dataset.palette = preference.palette;
    root.style.colorScheme = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = mode === 'dark' ? '#171d20' : '#f5f3ec';
  }
  window.BingoAppearance = {
    get: () => ({ ...preference }),
    set(value) {
      const next = { version: 1, mode: value.mode, palette: value.palette };
      if (!valid(next)) return false;
      preference = next;
      apply();
      try { localStorage.setItem(key, JSON.stringify(preference)); return true; } catch (_) { return false; }
    }
  };
  apply();
  const systemChanged = () => { if (preference.mode === 'system') apply(); };
  if (media && media.addEventListener) media.addEventListener('change', systemChanged);
  else if (media && media.addListener) media.addListener(systemChanged);
})();
