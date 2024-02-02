import { expect } from 'chai';
import { sanitizeQuillText } from 'server/util/sanitizeQuillText';

const encode = (input: { ops: any }): string =>
  encodeURIComponent(JSON.stringify(input));

const decode = (input: string): { ops: any } =>
  JSON.parse(decodeURIComponent(input));

describe('sanitizeQuillText', () => {
  it('should sanitize text with invalid video embed (not whitelisted)', () => {
    const input = {
      ops: [
        { attributes: { list: 'bullet' }, insert: '\\n' },
        { insert: 'dwdwd' },
        { attributes: { header: 1 }, insert: '\\n' },
        { insert: '\\n\\n' },
        { attributes: { bold: true }, insert: 'Hey' },
        { insert: '\\n' },
        {
          insert: {
            video: 'https://yahoo.com/hodl',
          },
        },
      ],
    };

    const expectedResult = {
      ops: [
        { attributes: { list: 'bullet' }, insert: '\\n' },
        { insert: 'dwdwd' },
        { attributes: { header: 1 }, insert: '\\n' },
        { insert: '\\n\\n' },
        { attributes: { bold: true }, insert: 'Hey' },
        { insert: '\\n' },
        {
          insert: '',
        },
      ],
    };

    const actualResult = sanitizeQuillText(encode(input));

    expect(JSON.stringify(decode(actualResult))).to.equal(
      JSON.stringify(expectedResult),
    );
  });

  it('should sanitize text with invalid video embed (invalid URL)', () => {
    const input = {
      ops: [
        {
          insert: {
            video: 'abcd',
          },
        },
      ],
    };

    const expectedResult = {
      ops: [
        {
          insert: '',
        },
      ],
    };

    const actualResult = sanitizeQuillText(encode(input));

    expect(JSON.stringify(decode(actualResult))).to.equal(
      JSON.stringify(expectedResult),
    );
  });

  it('should sanitize text with valid youtube video embed', () => {
    const input = {
      ops: [
        {
          insert: {
            video: 'https://youtu.be/dQw4w9WgXcQ?si=000123&x=blahblahblah',
          },
        },
      ],
    };
    const expectedResult = {
      ops: [
        {
          insert: {
            video: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
          },
        },
      ],
    };
    const actualResult = sanitizeQuillText(encode(input));
    expect(JSON.stringify(decode(actualResult))).to.equal(
      JSON.stringify(expectedResult),
    );
  });

  it('should sanitize text with valid vimeo video embed', () => {
    const input = {
      ops: [
        {
          insert: {
            video: 'https://player.vimeo.com/video/123456789?tracker=blahblah',
          },
        },
      ],
    };
    const expectedResult = {
      ops: [
        {
          insert: {
            video: 'https://player.vimeo.com/video/123456789',
          },
        },
      ],
    };
    const actualResult = sanitizeQuillText(encode(input));
    expect(JSON.stringify(decode(actualResult))).to.equal(
      JSON.stringify(expectedResult),
    );
  });
});
