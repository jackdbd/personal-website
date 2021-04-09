(function iife() {
  console.log('IIFE inline.js');
  const setTheme = (theme) => {
    document.documentElement.setAttribute('theme', theme);
    localStorage.setItem('theme', theme);
  };

  const makeCycleTheme = (m) => {
    return function cycleTheme() {
      const currentTheme = localStorage.getItem('theme') || 'default';
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

  const initialTheme = localStorage.getItem('theme') || 'default';
  setTheme(initialTheme);
  // setTheme('default');
  // setTheme('dark');
})();
