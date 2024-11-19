import {
  findMentionDiff,
  parseUserMentions,
  uniqueMentions,
} from '@hicommonwealth/model';

import { describe, expect, test } from 'vitest';

describe('User mention utils', () => {
  test('parseUserMentions', () => {
    let userMentions = parseUserMentions('[@user](/profile/id/10)');
    expect(userMentions).deep.equal([{ userId: '10', profileName: 'user' }]);

    userMentions = parseUserMentions(
      'random text [@user](/profile/id/10) random text [@user2](/profile/id/11)',
    );
    expect(userMentions).deep.equal([
      { userId: '10', profileName: 'user' },
      {
        userId: '11',
        profileName: 'user2',
      },
    ]);

    userMentions = parseUserMentions(
      '[@u*()ser!](/profile/id/10)[@us%^er2!](/profile/id/11)',
    );
    expect(userMentions).deep.equal([
      { userId: '10', profileName: 'u*()ser!' },
      {
        userId: '11',
        profileName: 'us%^er2!',
      },
    ]);

    // malformed
    userMentions = parseUserMentions('@[user](/profile/id/10');
    expect(userMentions).deep.equal([]);

    // Malformed: Missing opening square bracket
    userMentions = parseUserMentions('@user](/profile/id/10)');
    expect(userMentions).deep.equal([]);

    // Malformed: Missing closing square bracket
    userMentions = parseUserMentions('[@user(/profile/id/10)');
    expect(userMentions).deep.equal([]);

    // Malformed: Empty profile link
    userMentions = parseUserMentions('[@user]');
    expect(userMentions).deep.equal([]);

    userMentions = parseUserMentions('[@[name]](/profile/id/10)');
    expect(userMentions).deep.equal([]);
  });

  test('findMentionDiff', () => {
    const userMentionsBefore = [{ userId: '10', profileName: 'user' }];
    const newUserMention = { userId: '11', profileName: 'user2' };
    const mentionDiff = findMentionDiff(userMentionsBefore, [
      ...userMentionsBefore,
      newUserMention,
    ]);

    expect(mentionDiff).deep.equal([newUserMention]);
  });

  test('uniqueMentions', () => {
    const userMentions = [{ userId: '10', profileName: 'user' }];

    expect(
      uniqueMentions([...userMentions, ...userMentions, ...userMentions]),
    ).deep.equal(userMentions);
  });
});
