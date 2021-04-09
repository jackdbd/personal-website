(function iife() {
  // console.log('IIFE inline.js');
  const setTheme = (theme) => {
    document.documentElement.setAttribute('theme', theme);
    localStorage.setItem('theme', theme);
  };

  // see all theme attributes in inline.css
  const themeCycleMap = {
    default: 'choco',
    choco: 'teal-purple',
    'teal-purple': 'dark',
    dark: 'default'
  };

  const makeCycleTheme = (themeCycleMap) => {
    return function cycleTheme() {
      const currentTheme = localStorage.getItem('theme') || 'default';
      const nextTheme = themeCycleMap[currentTheme];
      setTheme(nextTheme);
    };
  };

  window.cycleTheme = makeCycleTheme(themeCycleMap);

  const theme = localStorage.getItem('theme') || 'default';
  setTheme(theme);
  // setTheme('default');
  // setTheme('dark');
})();
