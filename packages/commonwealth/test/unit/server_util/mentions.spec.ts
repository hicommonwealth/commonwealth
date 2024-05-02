import { expect } from 'chai';
import {
  findMentionDiff,
  parseUserMentions,
  uniqueMentions,
} from '../../../server/util/parseUserMentions';

describe('User mention utils', () => {
  it('parseUserMentions', () => {
    let userMentions = parseUserMentions('[@user](/profile/id/10)');
    expect(userMentions).deep.equal([{ profileId: '10', profileName: 'user' }]);

    userMentions = parseUserMentions(
      'random text [@user](/profile/id/10) random text [@user2](/profile/id/11)',
    );
    expect(userMentions).deep.equal([
      { profileId: '10', profileName: 'user' },
      {
        profileId: '11',
        profileName: 'user2',
      },
    ]);

    userMentions = parseUserMentions(
      '[@u*()ser!](/profile/id/10)[@us%^er2!](/profile/id/11)',
    );
    expect(userMentions).deep.equal([
      { profileId: '10', profileName: 'u*()ser!' },
      {
        profileId: '11',
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

  it('findMentionDiff', () => {
    const userMentionsBefore = [{ profileId: '10', profileName: 'user' }];
    const newUserMention = { profileId: '11', profileName: 'user2' };
    const mentionDiff = findMentionDiff(userMentionsBefore, [
      ...userMentionsBefore,
      newUserMention,
    ]);

    expect(mentionDiff).deep.equal([newUserMention]);
  });

  it('uniqueMentions', () => {
    const userMentions = [{ profileId: '10', profileName: 'user' }];

    expect(
      uniqueMentions([...userMentions, ...userMentions, ...userMentions]),
    ).deep.equal(userMentions);
  });
});
