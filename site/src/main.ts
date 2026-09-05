document.documentElement.classList.add('js');

for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', link.hash);
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (target instanceof HTMLElement) target.focus({ preventScroll: true });
  });
}
