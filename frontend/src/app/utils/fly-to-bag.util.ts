// Hace "volar" una miniatura de la foto del producto hasta el ícono de la
// bolsa en el nav, y le da un pequeño salto al llegar. Devuelve una promesa
// que se resuelve cuando termina (o de inmediato si no hay nada que animar),
// para que quien llama abra el carrito después y no tape el vuelo.
export function flyToBag(source: HTMLElement | null | undefined): Promise<void> {
  const bag = document.querySelector<HTMLElement>('.nav-cart');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!source || !bag || reduced || typeof source.animate !== 'function') {
    return Promise.resolve();
  }

  const from = source.getBoundingClientRect();
  const to = bag.getBoundingClientRect();
  if (!from.width || !to.width) return Promise.resolve();

  const size = Math.min(from.width, from.height, 160);
  const ghost = document.createElement('div');
  ghost.className = 'bag-ghost';
  const img = source.querySelector('img');
  if (img?.currentSrc || img?.src) ghost.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  Object.assign(ghost.style, {
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
  });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const end = 18 / size;

  const flight = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 60}px) scale(0.55)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${end})`, opacity: 0.2 },
    ],
    { duration: 780, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' },
  );

  return flight.finished
    .catch(() => undefined)
    .then(() => {
      ghost.remove();
      bag.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
        { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      );
    });
}
