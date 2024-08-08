import { createFrames } from 'frames.js/express';

export const frames = createFrames({
  basePath: '/api/farcaster',
  // important for rendering jsx images properly
  imagesRoute: null,
  // middleware: [
  //   farcasterHubContext({
  //     // remove if you aren't using @frames.js/debugger or you just don't want to use the debugger hub
  //     ...(process.env.NODE_ENV === 'production'
  //       ? {}
  //       : {
  //           hubHttpUrl: 'http://localhost:3010/hub',
  //         }),
  //   }),
  // ],
});
