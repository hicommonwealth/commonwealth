import { default as m } from 'mithril';
import { default as moment } from 'moment-twitter';

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
      e.preventDefault();
      e.stopPropagation();
      m.route.set(target);
    },
  };
  if (extraAttrs) Object.assign(attrs, extraAttrs);
  return m(selector, attrs, children);
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
      'xlink:href': '/static/img/feather-sprite.svg#' + icon
    }),
  ]);
}

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

export function orderAccountsByAddress(a, b) {
  return a.address < b.address ? -1 :
    a.address > b.address ? 1 : 0;
}

export function isSameAccount(a, b) {
  return a && b && a.chain && b.chain && a.chain.id === b.chain.id && a.address === b.address;
}

/*
 * formatters
 */
export function pluralize(num : number, str : string) {
  if (str.endsWith('y')) {
    return num + ' ' + str.slice(0, str.length - 1) + ((num === 1) ? 'y' : 'ies');
  } else if (str.endsWith('ss')) {
    return num + ' ' + str + (num === 1 ? '' : 'es');
  } else {
    return num + ' ' + str + ((num === 1 || str.endsWith('s')) ? '' : 's');
  }
}

export function slugify(str : string) {
  // remove any character that isn't a alphanumeric character or a
  // space, and then replace any sequence of spaces with dashes
  return str.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}

export function formatAsTitleCase(str : string) {
  return str.toLowerCase().split(' ').map((word) => {
    return word.replace(word[0], word[0].toUpperCase());
  }).join(' ');
}

// duplicated in adapters/currency.ts
export function formatNumberLong(num : number) {
  // format small numbers with decimals, large numbers with commas
  if (num === 0) return '0';
  if (num < 0.000001) return num.toFixed(20).replace(/0*$/, '');
  if (num < 0.001) return num.toString();
  const nf = new Intl.NumberFormat();
  return nf.format(num);
}

export function formatPercentShort(num : number) {
  if (num === 0) return '0%';
  if (num === 1) return '100%';
  if (num > 1) return '100%+';
  return (num * 100).toFixed(1) + '%';
}

export function formatDuration(duration : moment.Duration) {
  const days = Math.floor(duration.asDays());
  return [
    (days) ? (days + 'd ') : '',
    (days || duration.hours()) ? (duration.hours() + 'h ') : '',
    (days || duration.minutes()) ? (duration.minutes()  + 'm ') : '',
    duration.seconds() + 's',
  ].join('');
}

export function formatAddressShort(addr : string) {
  if (!addr) return;
  if (addr.length < 16) return addr;
  return addr.slice(0, 5) + '…' + addr.slice(addr.length - 3);
}

export function formatProposalHashShort(hash : string) {
  if (!hash) return;
  return hash.slice(0, 8);
}

export function renderMultilineText(text : string) {
  if (!text) return;
  const paragraphs = text.split('\n')
    .map((p) => p.trim())
    .filter((p) => p !== '');
  return paragraphs
    .map((p) => m('p', p));
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
