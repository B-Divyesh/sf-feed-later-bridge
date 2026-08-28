import './style.css';
import { browser } from 'wxt/browser';
import { loadState } from '../../src/storage';

const summary = document.querySelector<HTMLParagraphElement>('#summary')!;
void loadState().then((state) => {
  const waiting = state.items.filter((item) => item.status === 'queued').length;
  summary.textContent = state.items.length ? `${waiting} waiting · ${state.items.length - waiting} finished` : 'Connect an RSS or Atom saved-items feed to begin.';
});
document.querySelector<HTMLButtonElement>('#open')!.addEventListener('click', () => { void browser.runtime.openOptionsPage(); });
