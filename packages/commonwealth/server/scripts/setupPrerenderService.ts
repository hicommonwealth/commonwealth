import fs from 'fs';
import prerender from 'prerender';
import prerenderCache from 'prerender-memory-cache';

const run = (server) => {
  server.use(prerender.sendPrerenderHeader());
  // server.use(prerender.blockResources());
  server.use(prerender.removeScriptTags());
  server.use(prerender.httpHeaders());
  server.use(prerenderCache);
  server.start();
};

const setupPrerenderServer = () => {
  console.log('\n\n>>>>>>>>>>>>>>>>>> SETTING UP PRERENDER SERVER!!!\n\n');
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    if (fs.existsSync('/app/.apt/usr/bin/google-chrome')) {
      console.log('\n\nUSING LINUX GOOGLE CHROME!!!\n\n');
      const server = prerender({
        chromeLocation: '/app/.apt/usr/bin/google-chrome',
        port: 3000,
      });
      return run(server);
    }
  } else if (isMac) {
    const server = prerender({
      chromeLocation:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      port: 3000,
    });
    return run(server);
  }
  return run(prerender());
};

export default setupPrerenderServer;
