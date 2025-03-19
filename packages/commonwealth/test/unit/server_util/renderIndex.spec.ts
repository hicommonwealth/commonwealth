import { promises as fs } from 'fs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderIndex } from '../../../server/util/renderIndex';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock('@hicommonwealth/model', () => ({
  config: {
    CONTESTS: {
      FARCASTER_MANIFEST_DOMAIN: 'example.com',
    },
  },
}));

describe('renderIndex', () => {
  const mockTemplatePath = '/mock/index.html';
  const mockTemplateContent = `
    <html>
      <head>
        <meta
          name="fc:frame"
          content='{
          "version": "next",
          "imageUrl": "https://{{FARCASTER_MANIFEST_DOMAIN}}/brand_assets/common-white.png",
          "button":{
            "title": "Check out Common app",
            "action": {
              "type": "launch_frame",
              "name": "Common",
              "url": "https://{{FARCASTER_MANIFEST_DOMAIN}}",
              "splashImageUrl": "https://{{FARCASTER_MANIFEST_DOMAIN}}/brand_assets/common-white.png",
              "splashBackgroundColor": "#3EB489"
            }
          }
        }'
        />
      </head>
      <body></body>
    </html>
  `;
  const expectedRenderedTemplate = `
    <html>
      <head>
        <meta
          name="fc:frame"
          content='{
          "version": "next",
          "imageUrl": "https://example.com/brand_assets/common-white.png",
          "button":{
            "title": "Check out Common app",
            "action": {
              "type": "launch_frame",
              "name": "Common",
              "url": "https://example.com",
              "splashImageUrl": "https://example.com/brand_assets/common-white.png",
              "splashBackgroundColor": "#3EB489"
            }
          }
        }'
        />
      </head>
      <body></body>
    </html>
  `;

  beforeEach(() => {
    (fs.readFile as any).mockResolvedValue(mockTemplateContent);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('should render template with correct data', async () => {
    const result = await renderIndex(mockTemplatePath);
    expect(result).toBe(expectedRenderedTemplate);
  });

  test('should use cached result on subsequent calls', async () => {
    const result1 = await renderIndex(mockTemplatePath);
    const result2 = await renderIndex(mockTemplatePath);
    expect(result1).toBe(result2);
  });
});
