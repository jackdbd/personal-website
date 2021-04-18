(function iife() {
  const server = 'https://analytics.projects.giacomodebidda.com';
  const options = {
    detailed: true,
    ignoreLocalhost: true,
    ignoreOwnVisits: true
  };
  const domainId = 'b02966d8-54f5-4faf-a867-250290c0b113';

  let ackeeInstance = ackeeTracker.create(server, options);
  // store ackeeInstance globally, so event handlers can POST events to Ackee.
  window.ackeeInstance = ackeeInstance;

  // Probably it's not that useful to store the visit object globally.
  // https://github.com/electerious/ackee-tracker#recorddomainid-attributes-callback
  ackeeInstance.record(domainId);
})();
