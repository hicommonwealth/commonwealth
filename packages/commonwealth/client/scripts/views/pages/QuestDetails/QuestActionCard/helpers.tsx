import { pluralize } from 'helpers';
import React from 'react';

export const actionCopies = {
  title: {
    ['CommunityCreated']: 'Create a community',
    ['CommunityJoined']: 'Join a community',
    ['ThreadCreated']: 'Create a thread',
    ['ThreadUpvoted']: 'Upvote a thread',
    ['CommentCreated']: 'Create a comment',
    ['CommentUpvoted']: 'Upvote a comment',
    ['WalletLinked']: 'Link a new wallet',
    ['SSOLinked']: 'Link a new social (SSO)',
    ['TweetEngagement']: 'Engage on Tweet',
    ['CommonDiscordServerJoined']: "Join Common's Discord Community",
  },
  pre_reqs: {
    ['CommunityCreated']: () => '',
    ['CommunityJoined']: () => '',
    ['ThreadCreated']: () => '',
    ['ThreadUpvoted']: () => '',
    ['CommentCreated']: () => '',
    ['CommentUpvoted']: () => '',
    ['WalletLinked']: () => '',
    ['SSOLinked']: () => '',
    ['TweetEngagement']: (displayFor: 'user' | 'admin' = 'user') =>
      `Requires Twitter/X profile linked to ${displayFor === 'admin' ? "user's" : 'your'} Common profile.`,
    ['CommonDiscordServerJoined']: (displayFor: 'user' | 'admin' = 'user') =>
      `Requires Discord SSO sign-in/linked-to ${displayFor === 'admin' ? 'user' : 'your'} account.`,
  },
  explainer: {
    ['CommunityCreated']: () => '',
    ['CommunityJoined']: () => '',
    ['ThreadCreated']: () => '',
    ['ThreadUpvoted']: () => '',
    ['CommentCreated']: () => '',
    ['CommentUpvoted']: () => '',
    ['WalletLinked']: () => '',
    ['SSOLinked']: () => '',
    ['TweetEngagement']: (likes: number, retweets: number, replies: number) => (
      <>
        XP rewarded to participants after any of these tweet metrics are met.
        <br />
        {likes > 0 ? `${pluralize(likes, 'Like')}, ` : ''}
        {retweets > 0 ? `${pluralize(retweets, 'Retweet')}, ` : ''}
        {replies > 0 ? `${pluralize(replies, 'Replies')}` : ''}.
      </>
    ),
    ['CommonDiscordServerJoined']: '',
  },
  shares: {
    ['CommunityCreated']: 'referrer',
    ['CommunityJoined']: 'referrer',
    ['ThreadCreated']: '',
    ['ThreadUpvoted']: '',
    ['CommentCreated']: '',
    ['CommentUpvoted']: 'comment creator',
    ['WalletLinked']: '',
    ['SSOLinked']: '',
    ['UserMentioned']: '',
    ['TweetEngagement']: '',
    ['CommonDiscordServerJoined']: '',
  },
};
