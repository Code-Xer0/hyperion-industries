import { createContext, useContext, useState, useEffect } from 'react';
import { hyperionMarkForTheme } from '../utils/brand';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('theme');
    if (requested === 'light' || requested === 'dark') return requested;
    const saved = localStorage.getItem('hi_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const isLightMode = theme === 'light';
  const brandMark = hyperionMarkForTheme(isLightMode);

  useEffect(() => {
    localStorage.setItem('hi_theme', theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.body.classList.toggle('theme-light', isLightMode);
    document.body.classList.toggle('theme-dark', !isLightMode);

    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = isLightMode ? '/favicon-light.svg' : '/favicon-dark.svg';
  }, [theme, isLightMode]);

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, isLightMode, brandMark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
