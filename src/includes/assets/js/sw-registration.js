// I am not sure whether to inline this script or load it asynchronously (with
// either `async` or `defer`).
if ('serviceWorker' in navigator) {
  const onSuccess = (reg) => {
    console.log('SW registration succeeded.', reg);
  };
  const onError = (err) => {
    console.error('SW registration failed ', err);
  };
  navigator.serviceWorker.register('/sw.js').then(onSuccess).catch(onError);
}
