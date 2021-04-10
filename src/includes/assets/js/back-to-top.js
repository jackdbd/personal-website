(function iife() {
  const ELEMENT_ID = 'back-to-top';
  const SCROLL_FACTOR = 50.0; // arbitrary value
  console.log('IIFE back-to-top.js', document.getElementById(ELEMENT_ID));

  document.addEventListener('DOMContentLoaded', function (event) {
    console.log('🚀 DOMContentLoaded', event);
    const selector = document.getElementById(ELEMENT_ID);

    const handleScroll = () => {
      const threshold = document.documentElement.scrollHeight / SCROLL_FACTOR;
      if (
        document.body.scrollTop > threshold ||
        document.documentElement.scrollTop > threshold
      ) {
        selector.style.display = 'block';
      } else {
        selector.style.display = 'none';
      }
    };

    // When the user clicks on the button, scroll to the top of the document
    const handleClick = () => {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
      // document.documentElement.scrollIntoView();
    };

    console.log(
      'IIFE back-to-top.js after DOMContentLoaded',
      document.getElementById(ELEMENT_ID)
    );

    selector.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
  });
})();
