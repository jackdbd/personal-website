(function iife() {
  // console.log('IIFE scroll.js');

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
})();

// When the user clicks on the button, scroll to the top of the document
const topFunction = () => {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  // document.documentElement.scrollIntoView();
};
