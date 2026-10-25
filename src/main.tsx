import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global safeguard: Ensure all icons, SVGs, and visual UI glyphs strictly preserve their ligatures when pages are translated
if (typeof window !== 'undefined') {
  const protectIcons = () => {
    const iconElements = document.querySelectorAll<HTMLElement | SVGElement>(
      'span[class*="material-symbols"], span[class*="material-icons"], svg, [class*="lucide"], [class*="icon-"]'
    );
    iconElements.forEach((el) => {
      if (el.getAttribute('translate') !== 'no') {
        el.setAttribute('translate', 'no');
      }
      if (!el.classList.contains('notranslate')) {
        el.classList.add('notranslate');
      }
    });
  };

  let rafScheduled = false;
  const scheduleProtect = () => {
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(() => {
        protectIcons();
        rafScheduled = false;
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectIcons);
  } else {
    protectIcons();
  }

  const observer = new MutationObserver(() => {
    scheduleProtect();
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
}

createRoot(document.getElementById('root')!).render(<App />);

