import { safeTruncateBody } from '@hicommonwealth/model';
import { expect } from 'chai';
import { describe, test } from 'vitest';

const spliceUserMentionIndex = 12;
const spliceUrlIndex = 38;
const testString = '012345 [@Tim](/profile/id/118532) https://www.google.com';

describe.only('safeTruncateBody', () => {
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
});
