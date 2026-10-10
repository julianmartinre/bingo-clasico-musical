/* Paginación musical con mediciones reales; la vista previa y la impresión
   usan los mismos nodos y dimensiones. Sin librerías ni fuentes externas. */
'use strict';
const BingoMusicPrint = (() => {
  function el(tag, className, text) {
    const node = document.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function shell(card, set, drawn = [], withGrid = true) {
    const node = el('article', 'music-ticket'); node.dataset.code = card.code;
    const header = el('header', 'music-ticket-heading');
    header.append(el('span', '', `BINGO MUSICAL · ${set.name}`), el('strong', '', `Cartón N.º ${card.code}`));
    node.append(header, el('div', 'music-part', 'Bingo completo'), el('div', 'music-entries'));
    if (withGrid && set.cardLayout === 'grid-3x9') {
      const grid = el('div', 'music-grid'); grid.setAttribute('aria-label', 'Cartón de 3 filas y 9 columnas');
      for (const values of card.musicMatrix) for (const n of values) {
        const cell = el('div', `music-grid-cell${n === null ? ' blank' : drawn.includes(n) ? ' matched' : ''}`);
        if (n !== null) {
          const label = `${n}. ${set.songs[n - 1]}`;
          cell.dataset.number = n; cell.title = label;
          cell.append(el('span', 'music-cell-label', label));
        }
        else cell.setAttribute('aria-label', 'Casilla vacía');
        grid.append(cell);
      }
      const scroll = el('div', 'music-grid-scroll'); scroll.append(grid);
      node.insertBefore(scroll, node.lastChild);
    }
    return node;
  }
  function row(n, title, matched = false, continuation = false) {
    const node = el('div', `music-entry${matched ? ' matched' : ''}`); node.dataset.number = n;
    node.append(el('strong', 'music-number', `${n}${continuation ? ' ↳' : ''}`), el('span', 'music-title', title));
    return node;
  }
  function ticket(card, set, drawn = []) {
    const node = shell(card, set, drawn);
    if (set.cardLayout === 'grid-3x9') node.querySelector('.music-entries').remove();
    else card.numbers.forEach(n => node.lastChild.append(row(n, set.songs[n - 1], drawn.includes(n))));
    return node;
  }
  function pages(set) {
    const measure = el('div', 'music-measure'); measure.setAttribute('aria-hidden', 'true'); document.body.append(measure);
    const result = [];
    let page;
    const newPage = () => { page = el('section', 'music-page'); measure.append(page); result.push(page); };
    const fits = node => node.getBoundingClientRect().bottom <= page.getBoundingClientRect().bottom - 2;
    try {
      newPage();
      for (const card of set.cards) {
        // Un cartón que cabe en una hoja se mantiene entero: solo los que
        // superan la altura de una página requieren partes de continuación.
        const complete = ticket(card, set);
        page.append(complete);
        if (fits(complete)) continue;
        complete.remove();
        if (page.children.length) newPage();
        page.append(complete);
        if (fits(complete)) continue;
        complete.remove();
        const parts = [];
        let part = shell(card, set); page.append(part); parts.push(part);
        const nextPart = () => { newPage(); part = shell(card, set, [], false); page.append(part); parts.push(part); };
        for (const n of card.numbers) {
          let text = set.songs[n - 1], continued = false;
          while (text.length) {
            let entry = row(n, text, false, continued); part.lastChild.append(entry);
            if (fits(part)) break;
            entry.remove();
            // Preferir mover una canción entera a la página siguiente.
            if (part.lastChild.children.length) { nextPart(); continue; }
            if (page.children.length > 1) {
              part.remove(); parts.pop(); nextPart(); continue;
            }
            // Un título excepcionalmente largo también puede continuar.
            const characters = Array.from(text);
            let low = 1, high = characters.length, best = 0;
            entry = row(n, '', false, continued); part.lastChild.append(entry);
            while (low <= high) {
              const middle = Math.floor((low + high) / 2);
              entry.lastChild.textContent = characters.slice(0, middle).join('');
              if (fits(part)) { best = middle; low = middle + 1; } else high = middle - 1;
            }
            if (!best) throw new Error('No hay espacio imprimible para el encabezado del cartón.');
            entry.lastChild.textContent = characters.slice(0, best).join('');
            text = characters.slice(best).join(''); continued = true;
            if (text.length) nextPart();
          }
        }
        parts.forEach((node, index) => { node.querySelector('.music-part').textContent = parts.length > 1 ? `Bingo completo · Parte ${index + 1} de ${parts.length}${index ? ' · Continuación' : ''}` : 'Bingo completo'; });
      }
      result.forEach(node => node.remove());
      return result;
    } finally { measure.remove(); }
  }
  return { ticket, pages };
})();
