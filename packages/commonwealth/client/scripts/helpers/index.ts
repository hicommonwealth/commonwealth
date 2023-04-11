import type { ClassComponent } from 'mithrilInterop';
import { render } from 'mithrilInterop';
import BigNumber from 'bignumber.js';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { ThreadStage } from 'models';
import type { IChainAdapter, Account } from 'models';
import moment from 'moment';
import app from 'state';
import type { Coin } from 'adapters/currency';

export async function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

export function threadStageToLabel(stage: ThreadStage) {
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

export function parseCustomStages(str) {
  // Parse customStages into a `string[]` and then cast to ThreadStage[]
  // If parsing fails, return an empty array.
  let arr;
  try {
    arr = Array.from(JSON.parse(str));
  } catch (e) {
    return [];
  }
  return arr
    .map((s) => s?.toString())
    .filter((s) => s) as unknown as ThreadStage[];
}

/*
 * mithril link helper
 */
export function externalLink(selector, target, children, setRouteCb) {
  return render(
    selector,
    {
      href: target,
      target: '_blank',
      rel: 'noopener noreferrer',
      onClick: (e) => {
        if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
        if (target.startsWith(`${document.location.origin}/`)) {
          // don't open a new window if the link is on Commonwealth
          e.preventDefault();
          e.stopPropagation();
          setRouteCb?.(target);
        }
      },
    },
    children
  );
}

// This function should not be used anymore for links.
// Instead, <Link/> component from react-router is advised.
// It is adjusted, not rewritten, as there are non-jsx components
// that still use this method.ł
export function link(
  selector: string,
  target: string,
  children,
  setRoute: ClassComponent['setRoute'],
  extraAttrs?: object,
  saveScrollPositionAs?: string,
  beforeRouteSet?: () => void,
  afterRouteSet?: () => void
) {
  const attrs = {
    href: target,
    onClick: (e) => {
      if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
      if (e.target.target === '_blank') return;

      e.preventDefault();
      e.stopPropagation();

      if (saveScrollPositionAs) {
        localStorage[saveScrollPositionAs] = window.scrollY;
      }
      if (beforeRouteSet) beforeRouteSet();
      const routeArgs: [string, any?] =
        window.location.href.split('?')[0] === target.split('?')[0]
          ? [target, { replace: true }]
          : [target];
      if (afterRouteSet) {
        (async () => {
          await setRoute(...routeArgs);
          afterRouteSet();
        })();
      } else {
        setRoute(...routeArgs);
      }
    },
  };
  if (extraAttrs) Object.assign(attrs, extraAttrs);
  return render(selector, attrs, children);
}

/*
 * general links
 */

export function extractDomain(url) {
  const re = new RegExp('^(?:https?:)?(?://)?(?:www.)?([^:/]+)');
  return re.exec(url)[1];
}

export function removeUrlPrefix(url) {
  return url.replace(/^https?:\/\//, '');
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

export function byDescendingUpdatedDate(a, b) {
  return (+b.updatedAt || +b.createdAt) - (+a.updatedAt || +a.createdAt);
}

export function byAscendingUpdatedDate(a, b) {
  return (+a.updatedAt || +a.createdAt) - (+b.updatedAt || +b.createdAt);
}

export function orderAccountsByAddress(a, b) {
  return a.address < b.address ? -1 : a.address > b.address ? 1 : 0;
}

export function isSameAccount(a, b) {
  return (
    a &&
    b &&
    a.chain &&
    b.chain &&
    a.chain.id === b.chain.id &&
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
  includeSeconds = true
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

export function formatAddressShort(address: string) {
  if (address.length < 10) return address;
  return `${address.slice(0, 5)}…${address.slice(-5, -1)}`;
}

export function renderMultilineText(text: string) {
  if (!text) return;
  const paragraphs = text
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p !== '');
  return paragraphs.map((p, index) => render('p', { key: index }, p));
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
  e: React.MouseEvent<HTMLDivElement, MouseEvent>
) => {
  return e.metaKey || e.altKey || e.shiftKey || e.ctrlKey;
};

// Handle command click and normal clicks
export const handleRedirectClicks = (
  navigate: any,
  e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  redirectLink: string,
  activeChainId: string | null,
  callback: () => any
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
  } else if (chain.base === ChainBase.CosmosSDK) {
    decimals = 6;
  }

  return decimals;
}

export const setDarkMode = (state: boolean) => {
  const stateStr = state ? 'on' : 'off';
  localStorage.setItem('dark-mode-state', stateStr);
  state
    ? document.getElementsByTagName('html')[0].classList.add('invert')
    : document.getElementsByTagName('html')[0].classList.remove('invert');
};
