(function iife() {
  // console.log('IIFE inline.js');
  const DATA_ATTRIBUTE = 'data-theme';
  const LOCAL_STORAGE_THEME_KEY = 'theme';
  const DEFAULT_THEME = 'default';

  const setTheme = (theme) => {
    document.documentElement.setAttribute(DATA_ATTRIBUTE, theme);
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  };

  const makeCycleTheme = (m) => {
    return function cycleTheme() {
      const currentTheme =
        localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || DEFAULT_THEME;
      const nextTheme = m[currentTheme];
      setTheme(nextTheme);
    };
  };

  window.cycleTheme = makeCycleTheme({
    default: 'choco',
    choco: 'teal-purple',
    'teal-purple': 'dark',
    dark: 'default'
  });

  const initialTheme =
    localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || DEFAULT_THEME;
  setTheme(initialTheme);
  // setTheme('default');
  // setTheme('dark');
})();
