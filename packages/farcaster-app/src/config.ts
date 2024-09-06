import { createFrames } from 'frames.js/express';

export const frames = createFrames({
  basePath: '/',
  // important for rendering jsx images properly
  imagesRoute: null,
});
