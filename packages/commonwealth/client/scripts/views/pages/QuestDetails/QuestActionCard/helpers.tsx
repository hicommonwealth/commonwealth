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
    ['CommonDiscordServerJoined']: "Join Common's Discord Community",
    ['MembershipsRefreshed']: 'Join a Group',
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
      `Requires Twitter/X profile linked to ${displayFor === 'admin' ? "user's" : 'your'} Common profile.`,
    ['CommonDiscordServerJoined']: (displayFor: 'user' | 'admin' = 'user') =>
      `Requires Discord SSO sign-in/linked-to ${displayFor === 'admin' ? 'user' : 'your'} account.`,
    ['MembershipsRefreshed']: '',
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
            ● Aura is awarded when any engagement metric (like, retweet, reply)
            hits its target. Current Target:{' '}
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
            ● Instant Aura is granted to all participants for a specific
            engagement type (e.g., likes) once its target is reached before the
            quest ends.
          </li>
          <li>
            ● If the quest ends before any target is hit, participants earn Aura
            for all their actions — e.g., if you liked, retweeted, and replied,
            you get Aura for all three.
          </li>
          <li>
            ● You can earn Aura for each type of engagement once (like, retweet,
            and reply).
          </li>
          <li>● No max Aura limit applies to this quest.</li>
          <li>
            ● Aura is awarded to the first engagements on the tweet, regardless
            of when the quest began.
          </li>
        </ul>
      </div>
    ),
    ['CommonDiscordServerJoined']: '',
    ['MembershipsRefreshed']: '',
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
    ['CommonDiscordServerJoined']: '',
    ['MembershipsRefreshed']: '',
  },
};
