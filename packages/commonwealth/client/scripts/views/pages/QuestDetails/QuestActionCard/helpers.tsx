import { pluralize } from 'helpers';
import React from 'react';

export const actionCopies = {
  title: {
    ['SignUpFlowCompleted']: 'Sign in to Common',
    ['CommunityCreated']: 'Create a community',
    ['CommunityJoined']: 'Join a community',
    ['ThreadCreated']: 'Create a thread',
    ['ThreadUpvoted']: 'Upvote a thread',
    ['CommentCreated']: 'Create a comment',
    ['CommentUpvoted']: 'Upvote a comment',
    ['WalletLinked']: 'Link a new wallet',
    ['SSOLinked']: 'Link a new social (SSO)',
    ['TweetEngagement']: 'Engage on Tweet',
  },
  pre_reqs: {
    ['SignUpFlowCompleted']: '',
    ['CommunityCreated']: () => '',
    ['CommunityJoined']: () => '',
    ['ThreadCreated']: () => '',
    ['ThreadUpvoted']: () => '',
    ['CommentCreated']: () => '',
    ['CommentUpvoted']: () => '',
    ['WalletLinked']: () => '',
    ['SSOLinked']: () => '',
    ['TweetEngagement']: (displayFor: 'user' | 'admin' = 'user') =>
      `Requires Twitter/X linked to ${displayFor === 'admin' ? 'user' : 'your'} profile.`,
  },
  explainer: {
    ['SignUpFlowCompleted']: '',
    ['CommunityCreated']: () => '',
    ['CommunityJoined']: () => '',
    ['ThreadCreated']: () => '',
    ['ThreadUpvoted']: () => '',
    ['CommentCreated']: () => '',
    ['CommentUpvoted']: () => '',
    ['WalletLinked']: () => '',
    ['SSOLinked']: () => '',
    ['TweetEngagement']: (likes: number, retweets: number, replies: number) => (
      <div>
        <ul>
          <li>
            ● XP rewarded to participants after any of these tweet metrics are
            met -{' '}
            {[
              likes > 0 ? `${pluralize(likes, 'Like')}` : '',
              retweets > 0 ? `${pluralize(retweets, 'Retweet')}` : '',
              replies > 0 ? `${pluralize(replies, 'Reply')}` : '',
            ]
              .filter(Boolean)
              .join(', ')}
            .
          </li>
          <li>
            ● This action is not bound by the max Aura limit for this quest.
          </li>
          <li>
            ● Aura is awarded to the first engagements of the tweet regardless
            of when the quest starts.
          </li>
        </ul>
      </div>
    ),
  },
  shares: {
    ['SignUpFlowCompleted']: '',
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
  },
};
