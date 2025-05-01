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
    ['DiscordServerJoined']: 'Join Discord Community',
    ['MembershipsRefreshed']: 'Join a Group',
    ['XpChainEventCreated']: 'Engage on Blockchain',
    ['LaunchpadTokenCreated']: 'Launch a Token on Common',
    ['LaunchpadTokenTraded']: 'Trade a Launchpad Token on Common',
  },
  pre_reqs: {
    ['SignUpFlowCompleted']: () => '',
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
    ['DiscordServerJoined']: (displayFor: 'user' | 'admin' = 'user') =>
      `Requires Discord SSO sign-in/linked-to ${displayFor === 'admin' ? 'user' : 'your'} account.`,
    ['MembershipsRefreshed']: () => '',
    ['XpChainEventCreated']: () => '',
    ['LaunchpadTokenCreated']: () => '',
    ['LaunchpadTokenTraded']: () => '',
  },
  explainer: {
    ['SignUpFlowCompleted']: () => '',
    ['CommunityCreated']: (chainName?: string) =>
      chainName ? `● Must be created on the ${chainName} chain.` : '',
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
    ['DiscordServerJoined']: () => '',
    ['MembershipsRefreshed']: () => '',
    // eslint-disable-next-line react/no-multi-comp
    ['XpChainEventCreated']: (
      contractAddress: string,
      ethChainId: number | string,
    ) => (
      <div>
        <ul>
          <li>
            ● Any user address who&apos;s transaction emits the event on the
            ethereum chain: {ethChainId} and contract: {contractAddress}, will
            receive Aura.
          </li>
          <li>
            ● Aura goes to the initiator of the transaction, and not the
            receiver/target of it.
          </li>
        </ul>
      </div>
    ),
    ['LaunchpadTokenCreated']: () => '',
    // eslint-disable-next-line react/no-multi-comp
    ['LaunchpadTokenTraded']: (
      amountMultipler: string | number,
      ethAmount?: string | number,
    ) => (
      <div>
        <ul>
          <li>
            ● This action rewards aura based on your trade volume ex: You trade
            1 ETH tokens worth, you get 1 Aura.
          </li>
          <li>
            ● This action has an aura multipler of {amountMultipler}x. You trade
            1 ETH tokens worth, you get {amountMultipler} Aura.
          </li>
          {ethAmount && (
            <li>
              ● Aura is only awarded after a miminum {ethAmount} ETH worth of
              launchpad token is traded.
            </li>
          )}
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
    ['DiscordServerJoined']: '',
    ['MembershipsRefreshed']: '',
    ['XpChainEventCreated']: '',
    ['LaunchpadTokenCreated']: '',
    ['LaunchpadTokenTraded']: '',
  },
};
