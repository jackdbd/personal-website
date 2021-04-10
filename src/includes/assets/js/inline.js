(function iife() {
  // The code below allows me to avoid this inline event handler. It works, but
  // it seems a bit slower.
  // onload="this.onload=null;this.rel='stylesheet'"
  const ELEMENT_ID = 'prism-stylesheet';

  function handleDOMContentLoaded(event) {
    const selector = document.getElementById(ELEMENT_ID);
    // the JS code in this file is inlined in the <head> of every page, but not
    // all HTML pages include the Prism.js stylesheet (to avoid making a HTTP
    // request where is not actually needed).
    if (!!selector) {
      selector.onload = null;
      selector.rel = 'stylesheet';
    }
  }

  document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
})();
