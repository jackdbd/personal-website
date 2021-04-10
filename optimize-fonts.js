const subfont = require('subfont');

// `${root}/404.html`,
// `${root}/posts/better-git-commits/index.html`,
// `${root}/posts/12-years-of-fires-in-sardinia/index.html`,
// `${root}/projects/index.html`
// `${root}/success/index.html`

const optimizeFonts = async () => {
  const root = '_site';
  const config = {
    debug: true,
    //   dryRun: true,
    inPlace: true,
    inputFiles: [
      `${root}/index.html`,
      `${root}/about/index.html`,
      `${root}/contact/index.html`
    ],
    root
  };
  try {
    const assetGraph = await subfont(config, console);
    const htmlAssets = assetGraph.findAssets({
      isInitial: true,
      type: 'Html'
    });
    // console.log('htmlAssets', htmlAssets);
  } catch (err) {
    console.error('Failed during font subsetting', err);
  }
};

// optimizeFonts();
module.exports = optimizeFonts;
