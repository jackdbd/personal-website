(function iife() {
  const ELEMENT_ID = 'back-to-top';
  const SCROLL_FACTOR = 50.0; // arbitrary value

  document.addEventListener('DOMContentLoaded', function () {
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

      if ('ackeeInstance' in window) {
        window.ackeeInstance.action('db5f1b0d-b3c9-49c9-b9f5-81a7581546f4', {
          key: 'Click',
          value: '1'
        });
      }
    };

    selector.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
  });
})();
