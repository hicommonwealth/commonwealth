import { createFrames } from 'frames.js/express';

export const frames = createFrames({
  basePath: '/api/integration/farcaster',
  // important for rendering jsx images properly
  imagesRoute: null,
});
