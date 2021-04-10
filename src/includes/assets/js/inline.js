(function iife() {
  // console.log('IIFE inline.js');

  // The code below would allow me to avoid this inline event handler that I am
  // using for a Prism.js theme stylesheet. It works, but it seems slower than
  // the inline event handler.
  // onload="this.onload=null;this.rel='stylesheet'"
  const ELEMENT_ID = 'prism-stylesheet';

  function handleDOMContentLoaded(event) {
    const selector = document.getElementById(ELEMENT_ID);
    selector.onload = null;
    selector.rel = 'stylesheet';
  }

  // document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
})();
