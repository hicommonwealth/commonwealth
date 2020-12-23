import m from 'mithril';
import moment from 'moment-twitter';

import app from 'state';

export async function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

/*
 * mithril link helper
 */
export function externalLink(selector, target, children) {
  return m(selector, {
    href: target,
    target: '_blank',
    rel: 'noopener noreferrer'
  }, children);
}

export function link(selector: string, target: string, children, extraAttrs?: object) {
  const attrs = {
    href: target,
    onclick: (e) => {
      if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
      if (e.target.target === '_blank') return;
      e.preventDefault();
      e.stopPropagation();
      if (window.location.href.split('?')[0] === target.split('?')[0]) {
        m.route.set(target, {}, { replace: true });
      } else {
        m.route.set(target);
      }
    },
  };
  if (extraAttrs) Object.assign(attrs, extraAttrs);
  return m(selector, attrs, children);
}

/*
 * general links
 */

export function extractDomain(url) {
  const re = new RegExp('^(?:https?:)?(?://)?(?:www.)?([^:/]+)');
  return re.exec(url)[1];
}

/*
 * icons
 */
export function featherIcon(icon, size, stroke, color) {
  return m('svg.feather-icon', {
    'width': size,
    'height': size,
    'fill': 'none',
    'stroke': color,
    'stroke-width': stroke,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }, [
    m('use', {
      'xlink:href': `/static/img/feather-sprite.svg#${icon}`
    }),
  ]);
}

export const SwitchIcon = {
  view: (vnode) => {
    return m('svg.SwitchIcon', {
      width: '10px',
      height: '24px',
      viewBox: '0 0 10 24',
    }, [
      m('g', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }, [
        m('polyline', {
          stroke: '#979797',
          points: '1 5 5 1 9 5'
        }),
        m('polyline', {
          stroke: '#979797',
          transform: 'translate(5.000000, 21.000000) scale(1, -1) translate(-5.000000, -21.000000) ',
          points: '1 23 5 19 9 23'
        })
      ]),
    ]);
  }
};

export const symbols = {
  times: '\u00d7',
  middot: '\u00b7',
  checkmark: '\u2714',
  rsaquo: '\u203a',
  lsaquo: '\u2039',
  raquo: '\u00bb',
  laquo: '\u00ab',
  copy: '\u00a9',
  exclamation: '\u26a0\ufe0f',
  triangle: '\u25be',
};

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
  return (+b.updatedAt || +b.createdAt) - (+a.updatedAt || +a.createdAt)
}

export function byAscendingUpdatedDate(a, b) {
  return (+a.updatedAt || +a.createdAt) - (+b.updatedAt || +b.createdAt)
}

export function orderAccountsByAddress(a, b) {
  return a.address < b.address ? -1
    : a.address > b.address ? 1 : 0;
}

export function isSameAccount(a, b) {
  return a && b && a.chain && b.chain && a.chain.id === b.chain.id && a.address === b.address;
}

/*
 * formatters
 */
export function pluralize(num: number, str: string) {
  if (str.endsWith('y')) {
    return `${num} ${str.slice(0, str.length - 1)}${(num === 1) ? 'y' : 'ies'}`;
  } else if (str.endsWith('ss')) {
    return `${num} ${str}${num === 1 ? '' : 'es'}`;
  } else {
    return `${num} ${str}${(num === 1 || str.endsWith('s')) ? '' : 's'}`;
  }
}

export function articlize(str: string) {
  if (str.trimLeft().match(/^[aeiouAEIOU]/)) {
    return `an ${str.trimLeft()}`;
  } else {
    return `a ${str.trimLeft()}`;
  }
}

export function slugify(str: string) {
  // remove any character that isn't a alphanumeric character or a
  // space, and then replace any sequence of spaces with dashes
  return str.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}

export function formatAsTitleCase(str: string) {
  return str.toLowerCase().split(' ').map((word) => {
    return word.replace(word[0], word[0].toUpperCase());
  }).join(' ');
}

export function formatLastUpdated(timestamp) {
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(30, 'days'))) return timestamp.format('MMM D');
  const formatted = timestamp.fromNow(true);
  if (formatted.indexOf(' month') !== -1) {
    return timestamp.format('MMM D');
  } else {
    return formatted
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(' hours', 'h')
      .replace(' hour', 'h');
  }
};

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

export function formatDuration(duration: moment.Duration, includeSeconds = true) {
  const days = Math.floor(duration.asDays());
  return [
    (days) ? (`${days}d `) : '',
    (days || duration.hours()) ? (`${duration.hours()}h `) : '',
    (days || duration.minutes()) ? (`${duration.minutes()}m `) : '',
    (includeSeconds) ? `${duration.seconds()}s` : '',
  ].join('');
}

export function formatProposalHashShort(hash: string) {
  if (!hash) return;
  return `${hash.slice(0, 8)}…`;
}

export function renderMultilineText(text: string) {
  if (!text) return;
  const paragraphs = text.split('\n')
    .map((p) => p.trim())
    .filter((p) => p !== '');
  return paragraphs
    .map((p) => m('p', p));
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
  return moment.duration(blocknumToTime(blocknum).diff(moment()));
}

export function blockperiodToDuration(blocknum: number) {
  return moment.duration(blocknum * app.chain.block.duration, 'seconds');
}

export class BlocktimeHelper {
  private _durations = [];
  private _durationwindow;
  private _previousblocktime: moment.Moment;
  private _lastblocktime;
  private _blocktime;

  constructor(durationwindow: number = 5) {
    this._durationwindow = durationwindow;
  }

  get lastblocktime() {
    return this._lastblocktime;
  }

  get blocktime() {
    return this._blocktime;
  }

  public stamp(timestamp: moment.Moment) {
    this._previousblocktime = this._lastblocktime;
    this._lastblocktime = timestamp;
    if (!this._previousblocktime) {
      return;
    }

    // apply moving average to figure out blocktimes
    const lastblockduration = moment.duration(timestamp.diff(this._previousblocktime)).asSeconds();
    this._durations.push(lastblockduration);
    if (this._durations.length > this._durationwindow) {
      this._durations.shift();
    }
    const durations = this._durations.slice();
    durations.sort();

    // take the median duration
    const newblocktime = Math.round(durations[Math.floor(durations.length / 2)]);
    if (newblocktime > 0 && newblocktime !== this._blocktime) {
      this._blocktime = newblocktime;
      console.log(`blocktime: ${this._blocktime}`);
      m.redraw();
    }
  }
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
