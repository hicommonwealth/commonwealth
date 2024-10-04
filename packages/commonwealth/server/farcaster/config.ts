import { createFrames } from 'frames.js/express';

export const frames = createFrames({
  basePath: '/api/integration/farcaster/contests',
  // important for rendering jsx images properly
  imagesRoute: null,
});
