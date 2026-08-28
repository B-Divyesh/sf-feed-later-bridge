document.documentElement.classList.add('js');

for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}
