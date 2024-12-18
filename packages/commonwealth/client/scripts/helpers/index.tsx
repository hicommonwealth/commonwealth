import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import React from 'react';
import Account from '../models/Account';
import { IBlockInfo } from '../models/interfaces';
import { ThreadStage } from '../models/types';
import type { IApp } from '../state/index';

export async function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

export function threadStageToLabel(stage: string) {
  if (stage === ThreadStage.Discussion) {
    return 'Discussion';
  } else if (stage === ThreadStage.ProposalInReview) {
    return 'Pre-Voting';
  } else if (stage === ThreadStage.Voting) {
    return 'In Voting';
  } else if (stage === ThreadStage.Passed) {
    return 'Passed';
  } else if (stage === ThreadStage.Failed) {
    return 'Not Passed';
  } else {
    return stage;
  }
}

export function isDefaultStage(
  app: IApp,
  stage: string,
  customStages?: string[],
) {
  return (
    stage === ThreadStage.Discussion ||
    stage ===
      parseCustomStages(customStages || app?.chain?.meta?.custom_stages)[0]
  );
}

// Provides a default if community has no custom stages.
export function parseCustomStages(customStages?: string[]): string[] {
  return customStages && customStages.length > 0
    ? customStages
    : Object.values(ThreadStage);
}

/*
 * general links
 */

export function extractDomain(url) {
  const re = new RegExp('^(?:https?:)?(?://)?(?:www.)?([^:/]+)');
  // @ts-expect-error <StrictNullChecks/>
  return re.exec(url)[1];
}

/*
 * comparators
 */
export function byAscendingCreationDate(a, b) {
  return +a.createdAt - +b.createdAt;
}

export function isSameAccount(a: Account, b: Account) {
  return (
    a &&
    b &&
    a.community &&
    b.community &&
    a.community.id === b.community.id &&
    a.address === b.address
  );
}

/*
 * formatters
 */

export function pluralize(num: number, str: string) {
  if (str === 'day') {
    return `${num} ${str.slice(0, str.length - 1)}${num === 1 ? 'y' : 'ys'}`;
  } else if (str.endsWith('y')) {
    return `${num} ${str.slice(0, str.length - 1)}${num === 1 ? 'y' : 'ies'}`;
  } else if (str.endsWith('ss')) {
    return `${num} ${str}${num === 1 ? '' : 'es'}`;
  } else {
    return `${num} ${str}${num === 1 || str.endsWith('s') ? '' : 's'}`;
  }
}

export function pluralizeWithoutNumberPrefix(num: number, str: string) {
  if (str.endsWith('y')) {
    return `${str.slice(0, str.length - 1)}${num === 1 ? 'y' : 'ies'}`;
  } else if (str.endsWith('ss')) {
    return `${str}${num === 1 ? '' : 'es'}`;
  } else {
    return `${str}${num === 1 || str.endsWith('s') ? '' : 's'}`;
  }
}

export function formatLastUpdated(timestamp) {
  if (timestamp.isBefore(moment().subtract(365, 'days')))
    return timestamp.format('MMM D YYYY');
  const formatted = timestamp.fromNow(true);
  return `${formatted
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' months', 'mo')
    .replace(' month', 'mo')} ${formatted === 'now' ? '' : 'ago'}`;
}

export function formatTimestamp(timestamp) {
  if (timestamp.isBefore(moment().subtract(365, 'days')))
    return timestamp.format('MMM D YYYY');
  const formatted = timestamp.fromNow(true);
  return `${formatted
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' months', 'mo')
    .replace(' month', 'mo')}`;
}

// duplicated in adapters/currency.ts
export function formatNumberLong(num: number) {
  // format small numbers with decimals, large numbers with commas
  if (num === 0) return '0';
  if (num < 0.000001) return num.toFixed(20).replace(/0*$/, '');
  if (num < 0.001) return num.toString();
  const nf = new Intl.NumberFormat();
  return nf.format(num);
}

export function formatDuration(
  duration: moment.Duration,
  includeSeconds = true,
) {
  const days = Math.floor(duration.asDays());
  return [
    days ? `${days}d ` : '',
    days || duration.hours() ? `${duration.hours()}h ` : '',
    days || duration.minutes() ? `${duration.minutes()}m ` : '',
    includeSeconds ? `${duration.seconds()}s` : '',
  ].join('');
}

export function formatAddressShort(
  address: string,
  numberOfVisibleCharacters = 5,
  numberOfVisibleCharactersTail = 4,
) {
  if (
    address.length <
    numberOfVisibleCharacters + numberOfVisibleCharactersTail + 1
  ) {
    return address;
  }

  return `${address.slice(0, numberOfVisibleCharacters)}…${address.slice(
    -numberOfVisibleCharactersTail,
  )}`;
}

export function renderMultilineText(text: string) {
  if (!text) return;
  const paragraphs = text
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p !== '');
  return paragraphs.map((p, index) => <p key={index}>{p}</p>);
}

/*
 * blocknum helpers
 */

export function blocknumToTime(
  block: IBlockInfo,
  blocknum: number,
): moment.Moment {
  const currentBlocknum = block.height;
  const blocktime = block.duration;
  const lastBlockTime: moment.Moment = block.lastTime.clone();
  return lastBlockTime.add((blocknum - currentBlocknum) * blocktime, 'seconds');
}

export function blocknumToDuration(block: IBlockInfo, blocknum: number) {
  return moment
    .duration(blocknumToTime(block, blocknum).diff(moment()))
    .asMilliseconds();
}

// loads remote scripts from a URI, e.g. Twitter widgets
export const loadScript = (scriptURI) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptURI;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      reject();
    };
    document.head.appendChild(script);
  });
};

export const tokensToWei = (input: string, decimals: number): string => {
  const value = new BigNumber(input);
  if (value.isNaN()) {
    throw new Error('Invalid input');
  }
  const exp = new BigNumber(10).pow(decimals);
  const valueWei = value.multipliedBy(exp);
  return valueWei.toFixed();
};

export const weiToTokens = (input: string, decimals: number) => {
  // input will always be positive whole number
  const value = new BigNumber(input);
  if (value.isNaN()) {
    throw new Error('Invalid input');
  }
  const exp = new BigNumber(10).pow(decimals);
  const valueTokens = value.div(exp);
  return valueTokens.toFixed();
};

export const isCommandClick = (
  e: React.MouseEvent<HTMLDivElement, MouseEvent>,
) => {
  return e.metaKey || e.altKey || e.shiftKey || e.ctrlKey;
};

// Handle command click and normal clicks
export const handleRedirectClicks = (
  navigate: any,
  e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  redirectLink: string,
  activeChainId: string | null,
  callback: () => any,
) => {
  if (isCommandClick(e)) {
    if (activeChainId) {
      window.open(`/${activeChainId}`.concat(redirectLink), '_blank');
    } else {
      window.open(redirectLink, '_blank');
    }
    return;
  }

  navigate(redirectLink);
  if (callback) {
    callback();
  }
};

export const weightedVotingValueToLabel = (
  weightedVoting: TopicWeightedVoting,
) => {
  if (weightedVoting === TopicWeightedVoting.Stake) {
    return 'Community Stake';
  }

  if (weightedVoting === TopicWeightedVoting.ERC20) {
    return 'ERC20';
  }

  return '';
};
