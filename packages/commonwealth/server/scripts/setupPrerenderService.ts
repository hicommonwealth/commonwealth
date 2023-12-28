import chromium from 'chromium';
import prerender from 'prerender';

const setupPrerenderServer = () => {
  const server = prerender({
    chromeLocation: chromium.path,
    port: 300,
  });

  server.use(prerender.sendPrerenderHeader());
  // server.use(prerender.blockResources());
  server.use(prerender.removeScriptTags());
  server.use(prerender.httpHeaders());

  server.start();
};

export default setupPrerenderServer;
