;(function iife() {
  const ELEMENT_ID = 'prism-stylesheet'

  // The event handler here allows me to avoid having an inline event handler.
  // I don't want any inline Javascript on this site. Infact I allow no inline
  // JS in the script-src-attr directive of my Content-Security-Policy.
  function handleDOMContentLoaded() {
    const selector = document.getElementById(ELEMENT_ID)
    // The JS code in this file is inlined in the <head> of every page, but not
    // all HTML pages include the Prism.js stylesheet (to avoid making a HTTP
    // request where it's not actually needed). That's why the selector might be
    // absent on the page.
    if (!!selector) {
      selector.onload = null
      selector.rel = 'stylesheet'
    }
  }

  document.addEventListener('DOMContentLoaded', handleDOMContentLoaded)
})()
