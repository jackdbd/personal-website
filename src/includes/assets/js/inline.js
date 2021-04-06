const toggleNavbar = (
  collapsibleID = 'navbar-menu',
  openMenuIconID = 'open-menu-icon',
  closeMenuIconID = 'close-menu-icon'
) => {
  [collapsibleID, openMenuIconID, closeMenuIconID].forEach((id) => {
    document.getElementById(id).classList.toggle('hidden');
    document.getElementById(id).classList.toggle('block');
  });
};

const hideNavbar = (
  collapsibleID = 'navbar-menu',
  openMenuIconID = 'open-menu-icon',
  closeMenuIconID = 'close-menu-icon'
) => {
  document.getElementById(collapsibleID).classList.add('hidden');
  document.getElementById(collapsibleID).classList.remove('block');
  document.getElementById(closeMenuIconID).classList.add('hidden');
  document.getElementById(closeMenuIconID).classList.remove('block');

  document.getElementById(openMenuIconID).classList.remove('hidden');
  document.getElementById(openMenuIconID).classList.add('block');
};

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideNavbar();
  }
});

const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('data-theme', theme);
};

const makeCycleTheme = (themeCycleMap) => {
  return function cycleTheme() {
    const currentTheme = localStorage.getItem('data-theme') || 'default';
    const nextTheme = themeCycleMap[currentTheme];
    setTheme(nextTheme);
  };
};

const scrollFunction = () => {
  const threshold = document.documentElement.scrollHeight / 50.0;
  if (
    document.body.scrollTop > threshold ||
    document.documentElement.scrollTop > threshold
  ) {
    document.getElementById('scroll-to-top').style.display = 'block';
  } else {
    document.getElementById('scroll-to-top').style.display = 'none';
  }
};

window.onscroll = function () {
  scrollFunction();
};

// When the user clicks on the button, scroll to the top of the document
const topFunction = () => {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  // document.documentElement.scrollIntoView();
};

(function iife() {
  // console.log('IIFE');
  // see all data-theme attributes in inline.css
  const themeCycleMap = {
    default: 'choco',
    choco: 'teal-purple',
    'teal-purple': 'dark',
    dark: 'default'
  };
  window.cycleTheme = makeCycleTheme(themeCycleMap);
  const theme = localStorage.getItem('data-theme') || 'default';
  setTheme(theme);
  // setTheme('default');
  // setTheme('dark');
})();
