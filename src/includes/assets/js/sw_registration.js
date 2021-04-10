// I am not sure whether to include this script in the <body> or in the <head>
if ('serviceWorker' in navigator) {
  const onSuccess = (reg) => {
    // console.log('SW registration succeeded.', reg);
  };
  const onError = (err) => {
    console.error('SW registration failed ', error);
  };
  navigator.serviceWorker.register('/sw.js').then(onSuccess).catch(onError);
}
