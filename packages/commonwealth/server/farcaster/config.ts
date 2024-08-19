import { createFrames } from 'frames.js/express';

export const frames = createFrames({
  basePath: '/api/farcaster',
  // important for rendering jsx images properly
  imagesRoute: null,
});
