import { useEffect } from 'react';

export function useTheme(theme: 'light' | 'dark', accentColor: string) {
  const applyThemeAttribute = (t: 'light' | 'dark') => {
    const root = document.documentElement; // <html>
    root.setAttribute('data-theme', t);
    root.classList.toggle('dark', t === 'dark');
  };

  const toggleTheme = () => {
    const newTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';

    // Persist
    const settings = JSON.parse(localStorage.getItem('flow-settings') || '{}');
    localStorage.setItem('flow-settings', JSON.stringify({ ...settings, theme: newTheme }));

    // Apply to DOM immediately for visual change
    applyThemeAttribute(newTheme);

    // IMPORTANT: also update the in-app state so components re-render and the icon flips
    try {
      const event = new CustomEvent('flow-theme-changed', { detail: { theme: newTheme } });
      window.dispatchEvent(event);
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    // Sync attribute/class on first mount
    applyThemeAttribute(theme);

    // Bridge to local storage state in App: listen and mutate storage-backed settings to force re-render
    const onThemeChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ theme: 'light' | 'dark' }>).detail;
      if (!detail) return;
      const settings = JSON.parse(localStorage.getItem('flow-settings') || '{}');
      localStorage.setItem('flow-settings', JSON.stringify({ ...settings, theme: detail.theme }));
      // Trigger a micro reflow hint so Tailwind class-based styles update smoothly
      document.body?.offsetHeight; // read to force style recalc
    };

    window.addEventListener('flow-theme-changed', onThemeChanged);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      window.removeEventListener('flow-theme-changed', onThemeChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    theme,
    accentColor,
    toggleTheme
  };
}