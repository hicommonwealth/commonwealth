import fs from 'fs';
import prerender from 'prerender';

const run = (server) => {
  server.use(prerender.sendPrerenderHeader());
  // server.use(prerender.blockResources());
  server.use(prerender.removeScriptTags());
  server.use(prerender.httpHeaders());

  server.start();
};

const setupPrerenderServer = () => {
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    if (fs.existsSync('/app/.apt/usr/bin/google-chrome')) {
      const server = prerender({
        chromeLocation: '/app/.apt/usr/bin/google-chrome',
        port: 3000,
      });
      return run(server);
    }
  } else if (isMac) {
    const server = prerender({
      chromeLocation: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
      port: 3000,
    });
    return run(server);
  }
  return run(prerender());
};


export default setupPrerenderServer;
