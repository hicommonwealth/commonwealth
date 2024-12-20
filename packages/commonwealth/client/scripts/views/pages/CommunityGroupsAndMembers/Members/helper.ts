import { fallbackImages } from './constants';

export const getFallbackImage = (): string =>
  fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
