import { describe, expect, test } from 'vitest';
import { safeTruncateBody } from '../src/utils';

describe('utils', () => {
  const spliceUserMentionIndex = 12;
  const spliceUrlIndex = 38;
  const testString = '012345 [@Tim](/profile/id/118532) https://www.google.com';

  describe('safeTruncateBody', () => {
    test('should not splice user mentions', () => {
      const res = safeTruncateBody(testString, spliceUserMentionIndex);
      expect(res).to.equal(testString.substring(0, 7));
    });

    test('should not splice urls', () => {
      const resHttps = safeTruncateBody(testString, spliceUrlIndex);
      expect(resHttps).to.equal(testString.substring(0, 34));

      const resHttp = safeTruncateBody(
        testString.replace('https', 'http'),
        spliceUrlIndex,
      );
      expect(resHttp).to.equal(testString.substring(0, 34));

      const resWww = safeTruncateBody(
        testString.replace('https://www.', 'www.'),
        spliceUrlIndex,
      );
      expect(resWww).to.equal(testString.substring(0, 34));
    });

    test('should not splice a body that is already short enough', () => {
      const res = safeTruncateBody(testString);
      expect(res).to.equal(testString);
    });

    test('should splice a body without urls or mentions', () => {
      const res = safeTruncateBody('123456789', 5);
      expect(res).to.equal('12345');
    });

    test('should return "..." when the body only contains a url that is too long', () => {
      const res = safeTruncateBody('https://www.google.com', 5);
      expect(res).to.equal('...');
    });

    test('should return "..." when the body only contains a user mention that is too long', () => {
      const res = safeTruncateBody('[@Tim](/profile/id/118532)', 5);
      expect(res).to.equal('...');
    });

    // Parsing mentions without whitespaces in between each is expensive so treat these as 'one word'
    test('should properly truncate a string with multiple profiles without spaces', () => {
      let res = safeTruncateBody(
        '[@Tim](/profile/id/118532)[@Tim](/profile/id/118532)',
        5,
      );
      expect(res).to.equal('...');

      res = safeTruncateBody(
        '[@Tim](/profile/id/118532)[@Tim](/profile/id/118532)[@Tim](/profile/id/118532)',
        28,
      );
      expect(res).to.equal('...');
    });

    test('should properly truncate a string with multiple matches', () => {
      const res = safeTruncateBody(
        '[@Tim](/profile/id/1) [@Tim2](/profile/id/2) [@Tim3](/profile/id/3)',
        63,
      );
      expect(res).to.equal('[@Tim](/profile/id/1) [@Tim2](/profile/id/2) ');
    });

    test('should truncate normally on whitespace', () => {
      const res = safeTruncateBody('1234 6789', 5);
      expect(res).to.equal('1234 ');
    });
  });
});
