import { useEffect, useRef } from 'react';
import { initSurfaceFx } from '../../utils/pointerFx';
import './PageShell.css';

export default function PageShell({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const disposeSurfaceFx = initSurfaceFx(document);
    const el = ref.current;
    let firstFrame;
    let secondFrame;
    if (el) {
      el.classList.add('page-enter');
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          el.classList.remove('page-enter');
          el.classList.add('page-active');
        });
      });
    }

    return () => {
      if (firstFrame) cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      disposeSurfaceFx();
    };
  }, []);

  return (
    <main ref={ref} className={`page-shell ${className}`}>
      {children}
    </main>
  );
}
