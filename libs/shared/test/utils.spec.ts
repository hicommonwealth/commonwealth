import { describe, expect, test } from 'vitest';
import { safeTruncateBody, serializeBigIntObj } from '../src/utils';

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

  describe('serializeBigIntObj', () => {
    test('should serialize BigInts', () => {
      expect(
        serializeBigIntObj({
          a: 1n,
          b: 2n,
          c: 3n,
        }),
      ).to.deep.equal({
        a: '1',
        b: '2',
        c: '3',
      });
    });

    test('should not serialize Dates', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      expect(
        serializeBigIntObj({
          date,
        }),
      ).to.deep.equal({
        date,
      });
    });

    test('should serialize nested objects', () => {
      const date = new Date();
      expect(
        serializeBigIntObj({
          nested: {
            a: 1n,
            b: date,
          },
        }),
      ).to.deep.equal({
        nested: {
          a: '1',
          b: date,
        },
      });
    });

    test('should serialize arrays', () => {
      const date = new Date();
      expect(
        serializeBigIntObj({
          array: [1n, 2n, 3n, date, 1, '2', true, null],
        }),
      ).to.deep.equal({
        array: ['1', '2', '3', date, 1, '2', true, null],
      });
    });

    test('should serialize mixed types', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      expect(
        serializeBigIntObj({
          a: 1n,
          b: 'string',
          c: date,
          d: null,
          e: true,
        }),
      ).to.deep.equal({
        a: '1',
        b: 'string',
        c: date,
        d: null,
        e: true,
      });
    });

    test('should handle empty objects', () => {
      expect(serializeBigIntObj({})).to.deep.equal({});
    });

    test('should not serialize custom class instances', () => {
      class CustomClass {
        constructor(
          public value: bigint,
          public name: string,
        ) {}
      }
      const instance = new CustomClass(123n, 'example');

      expect(
        serializeBigIntObj({
          customInstance: instance,
        }),
      ).to.deep.equal({
        customInstance: instance,
      });
    });
  });
});
