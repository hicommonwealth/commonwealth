import { WalletId } from '@hicommonwealth/shared';
import { pluralize } from 'helpers';
import React, { ReactNode } from 'react';

const binanceWalletCopy = (
  <div>
    <strong>IMPORTANT:</strong> Sign up MUST BE DONE VIA THE BINANCE MOBILE APP{' '}
    — Download:{' '}
    <a
      href="https://play.google.com/store/apps/details?id=com.binance.dev&hl=en&pli=1"
      target="_blank"
      rel="noreferrer"
    >
      Android
    </a>{' '}
    |{' '}
    <a
      href="https://apps.apple.com/kn/app/binance-buy-bitcoin-crypto/id1436799971"
      target="_blank"
      rel="noreferrer"
    >
      iOS
    </a>{' '}
    — View{' '}
    <a
      // eslint-disable-next-line max-len
      href="https://docs.common.xyz/commonwealth/commonaura/commonaura/season-2/season-2-week-1/system-quest-4-or-binance-wallet"
      target="_blank"
      rel="noreferrer"
    >
      demo docs
    </a>
    <br />
    Steps to complete:
    <ol>
      <li>1. Open Binance Wallet app</li>
      <li>2. Create your account or sign in</li>
      <li>3. Click on wallet tab</li>
      <li>4. Visit Common</li>
      <li>5. Complete the signup/signin process to earn Aura</li>
    </ol>
    <br />
    Visit Binance to explore more onchain:{' '}
    <a href="https://www.binance.com/en/web3">
      https://www.binance.com/en/web3
    </a>
  </div>
);

const gateWalletCopy = (
  <div>
    View{' '}
    <a
      href="https://docs.common.xyz/commonwealth/commonaura/commonaura/season-2/season-2-week-1/system-quest-6-or-gate-wallet"
      target="_blank"
      rel="noreferrer"
    >
      demo docs
    </a>
    <br />
    Steps to complete:
    <ol>
      <li>1. Open Gate Wallet</li>
      <li>2. Create your account or sign in</li>
      <li>3. Click on wallet tab</li>
      <li>4. Visit Common</li>
      <li>5. Complete the signup/signin process to earn Aura</li>
    </ol>
    <br />
    Visit Gate to explore more onchain:{' '}
    <a href="https://www.gate.io">
      https://www.gate.io
    </a>
  </div>
);

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
    ['LaunchpadTokenRecordCreated']: 'Launch a Token on Common',
    ['LaunchpadTokenTraded']: 'Trade a Launchpad Token on Common',
    ['LaunchpadTokenGraduated']: 'Graduate a Launchpad Token',
    ['ContestEnded']: 'Engage on a Contest till completion',
    ['CommunityGoalReached']: 'Complete the community goal',
    ['RecurringContestManagerDeployed']: 'Create a Recurring Contest',
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
    ['LaunchpadTokenRecordCreated']: () => '',
    ['LaunchpadTokenTraded']: () => '',
    ['LaunchpadTokenGraduated']: () => '',
    ['ContestEnded']: '',
    ['CommunityGoalReached']: () => '',
    ['RecurringContestManagerDeployed']: '',
  },
  explainer: {
    // eslint-disable-next-line react/no-multi-comp
    ['SignUpFlowCompleted']: (walletId?: WalletId) =>
      walletId === WalletId.Binance
        ? binanceWalletCopy
        : walletId === WalletId.Gate
          ? gateWalletCopy
          : ``,
    ['CommunityCreated']: (chainName?: string) =>
      chainName ? `● Must be created on the ${chainName} chain.` : '',
    ['CommunityJoined']: () => '',
    ['ThreadCreated']: () => '',
    ['ThreadUpvoted']: () => '',
    ['CommentCreated']: () => '',
    ['CommentUpvoted']: () => '',
    // eslint-disable-next-line react/no-multi-comp
    ['WalletLinked']: (walletId?: WalletId) =>
      walletId === WalletId.Binance
        ? binanceWalletCopy
        : walletId === WalletId.Gate
          ? gateWalletCopy
          : ``,
    // eslint-disable-next-line react/no-multi-comp
    ['SSOLinked']: (ssoType?: string) =>
      ssoType ? (
        <div>
          <ul>
            <li>
              ● Link <span className="capitalize">{ssoType}</span> SSO to your
              account.
            </li>
          </ul>
        </div>
      ) : (
        ''
      ),
    // eslint-disable-next-line react/no-multi-comp
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
    // eslint-disable-next-line react/no-multi-comp
    ['LaunchpadTokenRecordCreated']: () => (
      <div>
        <ul>
          <li>● Active address requires ETH on Base to launch a token</li>
        </ul>
      </div>
    ),
    ['LaunchpadTokenGraduated']: () => '',
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
          <li>
            ● No Aura is awarded if your trade amount multiplied by the aura
            multiplier does not equal at least 1 Aura.
          </li>
          <li>● Active address requires ETH on Base to launch a token</li>
        </ul>
      </div>
    ),
    // eslint-disable-next-line react/no-multi-comp
    ['CommunityGoalReached']: (type: ReactNode, target: ReactNode) => (
      <div>
        <ul>
          <li>
            ● Reach {target} {type} before quest ends.
          </li>
        </ul>
      </div>
    ),
    // eslint-disable-next-line react/no-multi-comp
    ['RecurringContestManagerDeployed']: () => (
      <div>
        <ul>
          <li>● Contest must be funded with a prize pool</li>
          <li>● Aura is awarded when the contest is successfully deployed</li>
          <li>● Only the contest creator receives Aura for this action</li>
        </ul>
      </div>
    ),
    // eslint-disable-next-line react/no-multi-comp
    ['ContestEnded']: () => (
      <div>
        <ul>
          <li>● Contest must be funded with a prize pool</li>
          <li>● Aura is awarded when the contest is successfully deployed</li>
          <li>● Only the contest creator receives Aura for this action</li>
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
    ['LaunchpadTokenRecordCreated']: '',
    ['LaunchpadTokenGraduated']: '',
    ['LaunchpadTokenTraded']: '',
    ['ContestEnded']: '',
    ['CommunityGoalReached']: '',
    ['RecurringContestManagerDeployed']: '',
  },
};
