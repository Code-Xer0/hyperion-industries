import { useEffect, useRef } from 'react';
import './PageShell.css';

export default function PageShell({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const el = ref.current;
    if (el) {
      el.classList.add('page-enter');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.remove('page-enter');
          el.classList.add('page-active');
        });
      });
    }
  }, []);

  return (
    <main ref={ref} className={`page-shell ${className}`}>
      {children}
    </main>
  );
}
