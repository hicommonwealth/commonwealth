import { ChainBase, ChainNetwork } from '@hicommonwealth/core';
import type { Coin } from 'adapters/currency';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import React from 'react';
import app from 'state';
import Account from '../models/Account';
import IChainAdapter from '../models/IChainAdapter';
import { ThreadStage } from '../models/types';

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

export function isDefaultStage(stage: string) {
  return (
    stage === ThreadStage.Discussion ||
    stage === parseCustomStages(app.chain.meta.customStages)[0]
  );
}

// Provides a default if community has no custom stages.
export function parseCustomStages(customStages?: string[]): string[] {
  return customStages ?? Object.values(ThreadStage);
}

/*
 * general links
 */

export function extractDomain(url) {
  const re = new RegExp('^(?:https?:)?(?://)?(?:www.)?([^:/]+)');
  return re.exec(url)[1];
}

/*
 * comparators
 */
export function byDescendingCreationDate(a, b) {
  return +b.createdAt - +a.createdAt;
}

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

export function articlize(str: string) {
  if (str.trimLeft().match(/^[aeiouAEIOU]/)) {
    return `an ${str.trimLeft()}`;
  } else {
    return `a ${str.trimLeft()}`;
  }
}

export function formatAsTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.replace(word[0], word[0].toUpperCase());
    })
    .join(' ');
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

export function formatTimestampAsDate(timestamp: moment.Moment) {
  if (timestamp.isBefore(moment().startOf('year')))
    return timestamp.format('MMM D YYYY');
  else return timestamp.format('MMM D');
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

export function formatPercentShort(num: number) {
  if (num === 0) return '0%';
  if (num === 1) return '100%';
  if (num > 1) return '100%+';
  return `${(num * 100).toFixed(1)}%`;
}

/* Choose Total Digits to Display*/
export function formatPercent(num: number, digits: number) {
  if (num === 0) return '0%';
  if (num === 1) return '100%';
  if (num > 1) return '100%+';
  return `${(num * 100).toFixed(digits)}%`;
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

export function formatProposalHashShort(hash: string) {
  if (!hash) return;
  return `${hash.slice(0, 8)}…`;
}

export function formatAddressShort(
  address: string,
  numberOfVisibleCharacters = 5,
  numberOfVisibleCharactersTail = 4,
) {
  if (address.length < 10) return address;
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

export function blocknumToTime(blocknum: number): moment.Moment {
  const currentBlocknum = app.chain.block.height;
  const blocktime = app.chain.block.duration;
  const lastBlockTime: moment.Moment = app.chain.block.lastTime.clone();
  return lastBlockTime.add((blocknum - currentBlocknum) * blocktime, 'seconds');
}

export function blocknumToDuration(blocknum: number) {
  return moment
    .duration(blocknumToTime(blocknum).diff(moment()))
    .asMilliseconds();
}

export function blockperiodToDuration(blocknum: number) {
  return moment.duration(blocknum * app.chain.block.duration, 'seconds');
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

// Returns a default chain for a chainbase
export function baseToNetwork(n: ChainBase): ChainNetwork {
  switch (n) {
    case ChainBase.CosmosSDK:
      return ChainNetwork.Osmosis;
    case ChainBase.Substrate:
      return ChainNetwork.Edgeware;
    case ChainBase.Ethereum:
      return ChainNetwork.Ethereum;
    case ChainBase.NEAR:
      return ChainNetwork.NEAR;
    case ChainBase.Solana:
      return ChainNetwork.Solana;
    default:
      return null;
  }
}

// Decimals For Tokens
export function getDecimals(chain: IChainAdapter<Coin, Account>): number {
  let decimals;
  if (chain.meta.id === 'evmos') {
    // Custom for evmos
    decimals = 18;
  } else if (chain && chain.meta) {
    decimals = chain.meta.decimals;
  } else if (chain.network === ChainNetwork.ERC721) {
    decimals = 0;
  } else if (chain.network === ChainNetwork.ERC1155) {
    decimals = 0;
  } else if (chain.base === ChainBase.CosmosSDK) {
    decimals = 6;
  }

  return decimals;
}

export const shortenIdentifier = (identifer: string, substrLength = 3) => {
  // Check if the string is longer than 6 characters
  if (identifer.length > substrLength * 2) {
    // Extract the first three and last three characters
    const start = identifer.substring(0, substrLength);
    const end = identifer.substring(identifer.length - substrLength);
    // Return the formatted string
    return `${start}...${end}`;
  } else {
    // Return the original string if it's 6 characters or shorter
    return identifer;
  }
};
