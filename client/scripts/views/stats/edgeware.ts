/* eslint-disable no-mixed-operators */
import 'stats/edgeware.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import Chart from 'chart.js';
import mixpanel from 'mixpanel-browser';
import { Button, Input } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import Tabs from 'views/components/widgets/tabs';
import {
  isHex, formatDate, formatNumber, formatNumberRound,
  MAINNET_LOCKDROP, ROPSTEN_LOCKDROP, getParticipationSummary,
} from './stats_helpers';


const ETHERSCAN_ADDR_URL = 'https://etherscan.io/address/';

const generalizedLocks = [{
  address: '0x94bd4150e41c717b7e7564484693073239715376',
  amount: '671.6943575',
  approved: true,
}, {
  address: '0xdB0E7d784D6A7ca2CBDA6CE26ac3b1Bd348C06F8',
  amount: '6925',
  approved: true,
}, {
  address: '0x3BfC20f0B9aFcAcE800D73D2191166FF16540258',
  amount: '306276.2724',
  approved: true,
}];

const glTotal = generalizedLocks.reduce((a, b) => a + parseInt(b.amount, 10), 0);

const adjustForGL = (effETH) => {
  return effETH + glTotal * 0.8; // generalized lock is equivalent to a 5x signal
};

const colorWheel = [
  '#f37020', '#f68e1f', '#ffc212', '#ffcd56', '#00a88f',
  '#0191cd', '#0256a6', '#7044a0', '#a64499', '#ff3d64',
];
const getColors = (num) => num > colorWheel.length
  ? colorWheel.concat(getColors(num - colorWheel.length))
  : colorWheel.slice(0, num);

// page global state stored here
const state = {
  network: 'mainnet',
  loading: true,
  noData: false,
  participationSummary: null,
  addressSummary: null,
};

function lookupAddrs(lockAddrs) {
  $('#LOCKDROP_PARTICIPANT_ADDRESS').val(_.uniq(lockAddrs).join(','));
  $('#LOCK_LOOKUP_BTN').trigger('click');
  $('html, body').animate({
    scrollTop: $('#LOCKDROP_PARTICIPANT_ADDRESS').offset().top - 200
  }, 500);
}

// sets the state to "loading" and updates data from backend
async function triggerUpdateData() {
  console.log(`fetching data for ${state.network}`);
  state.loading = true;
  m.redraw();
  try {
    state.participationSummary = await getParticipationSummary(state.network);
  } catch (e) {
    console.error(e);
    state.participationSummary = undefined;
  }

  state.loading = false;
  if (!state.participationSummary) {
    console.log('No data');
    state.noData = true;
  }
  m.redraw();
}

const Pie = {
  view: (vnode) => {
    if (!vnode.attrs.getData || !vnode.attrs.id) return;
    return m('.chart', [
      m('canvas', {
        id: vnode.attrs.id,
        oncreate: (canvas) => {
          const { data, title, unit } = vnode.attrs.getData();
          // disable-next-line:no-string-literal
          const ctx = canvas.dom['getContext']('2d');
          vnode.state.chart = new Chart(ctx, {
            type: 'pie',
            data,
            options: {
              animation: { duration: 0 },
              responsive: true,
              legend: { reverse: true, position: 'bottom' },
              title: { display: true, text: title, fontSize: 14 },
              tooltips: {
                callbacks: {
                  label: (tooltipItem, data2) => {
                    const dataset = data2.datasets[tooltipItem.datasetIndex];
                    const item = dataset.data[tooltipItem.index];
                    return dataset.formatter ? dataset.formatter(item, tooltipItem.index) : item.toString();
                  }
                }
              }
            }
          });

          $(vnode.dom).click((event) => {
            const elements = vnode.state.chart.getElementAtEvent(event);
            if (elements.length !== 1) return;
            const elementIndex = elements[0]._index;
            const dataset = vnode.state.chart.data.datasets[0];
            if (dataset.onclick) dataset.onclick(elements[0]._index);
          });
        }
      })
    ]);
  }
};

const Line = {
  view: (vnode) => {
    if (!vnode.attrs.getData || !vnode.attrs.id) return;
    return m('.chart', [
      m('canvas', {
        id: vnode.attrs.id,
        oncreate: (canvas) => {
          const { data, title } = vnode.attrs.getData();
          // tslint:disable-next-line:no-string-literal
          const ctx = canvas.dom['getContext']('2d');
          vnode.state.chart = new Chart(ctx, {
            type: 'scatter',
            data,
            options: {
              responsive: true,
              title: { display: true, text: title, fontSize: 14 },
              tooltips: {
                callbacks: {
                  label: (tooltipItem, data2) => {
                    const dataset = data2.datasets[tooltipItem.datasetIndex];
                    const item = dataset.data[tooltipItem.index];
                    return dataset.formatter ? dataset.formatter(item) : item.toString();
                  }
                }
              },
              // performance optimizations
              animation: { duration: 0 },
              hover: { animationDuration: 0 },
              responsiveAnimationDuration: 0,
              elements: { line: { tension: 0 } },
            }
          });
        }
      })
    ]);
  }
};

const EdgewareStatsPage = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'Edgeware Stats Page' });
  },
  view: (vnode) => {
    return m('.EdgewareStatsPage', {
      oncreate: () => triggerUpdateData()
    }, [
      m('.container.body-container', [
        m('h3', 'Lockdrop Participation Statistics'),
        m('.disclaimer', [
          m('p', [
            'NOTE: This page is provided for informational purposes only; no data shown on ',
            'this page should be construed as final or a commitment to deliver any amount or ',
            'allocation of EDG. Signaled funds may be recognized as a 3-month lock under the ',
            'generalized lock policy. No individual participating account will be assigned more ',
            'than 20% of EDG.',
          ]),
        ]),
        m(Tabs, [{
          name: 'Stats',
          content: [
            m('.top-line-summary.row', [
              m('.col-sm-4', [
                m('h3', 'Total Locked'),
                m('p', state.participationSummary
                  ? `${formatNumberRound(state.participationSummary.totalETHLocked)} ETH` : '--'),
              ]),
              m('.col-sm-4', [
                m('h3', 'Total Signaled'),
                m('p', state.participationSummary
                  ? `${formatNumberRound(state.participationSummary.totalETHSignaled)} ETH` : '--'),
              ]),
              m('.col-sm-4', [
                m('h3', 'Last lock or signal'),
                m('p', state.participationSummary ? [
                  moment(state.participationSummary.lastBlockTime * 1000).twitterLong(true),
                  ` (Block ${formatNumberRound(state.participationSummary.lastBlock.number)})`
                ] : '--'),
              ]),
            ]),
            m('.charts', !state.participationSummary ? [
              state.loading && m('.chart-loading', m('span.icon-spinner2.animate-spin')),
              state.noData && m('.chart-loading', [
                m('p', 'No data - You may be over the API limit.'),
                m('p', 'Wait 15 seconds and try again.'),
              ]),
            ] : [
              m(Line, {
                id: 'NUM_PARTICIPANTS_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  return {
                    title: 'Number of participation events',
                    data: {
                      datasets: [{
                        label: 'Total events',
                        backgroundColor: '#ff6383',
                        borderColor: '#ff6383',
                        borderWidth: 1,
                        pointRadius: 1,
                        data: summary.participantsByBlock,
                        fill: false,
                        formatter: (d) => [`${d.y} ${d.y === 1 ? 'participant' : 'participants'}`,
                          `${formatDate(new Date(summary.blocknumToTime[d.x]))} (approx.)`],
                      }, {
                        label: 'Lock events',
                        backgroundColor: '#ff9f40',
                        borderColor: '#ff9f40',
                        borderWidth: 1,
                        pointRadius: 1,
                        data: summary.lockEventsByBlock,
                        fill: false,
                        formatter: (d) => [`${d.y} ${d.y === 1 ? 'participant' : 'participants'}`,
                          `${formatDate(new Date(summary.blocknumToTime[d.x]))} (approx.)`],
                      }, {
                        label: 'Signal events',
                        backgroundColor: '#ffcd56',
                        borderColor: '#ffcd56',
                        borderWidth: 1,
                        pointRadius: 1,
                        data: summary.signalEventsByBlock,
                        fill: false,
                        formatter: (d) => [`${d.y} ${d.y === 1 ? 'participant' : 'participants'}`,
                          `${formatDate(new Date(summary.blocknumToTime[d.x]))} (approx.)`],
                      }]
                    }
                  };
                }
              }),
              m(Line, {
                id: 'ETH_LOCKED_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  return {
                    title: 'ETH Locked',
                    data: {
                      datasets: [{
                        label: 'ETH locked',
                        backgroundColor: '#ff9f40',
                        borderColor: '#ff9f40',
                        borderWidth: 1,
                        pointRadius: 1,
                        data: summary.ethLockedByBlock,
                        fill: false,
                        formatter: (d) => [`${d.y.toFixed(2)} ETH`,
                          `${formatDate(new Date(summary.blocknumToTime[d.x]))} (approx.)`],
                      }]
                    }
                  };
                }
              }),
              m(Pie, {
                id: 'ETH_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  const ethDistribution = [ summary.totalETHLocked3mo,
                    summary.totalETHLocked6mo,
                    summary.totalETHLocked12mo,
                    summary.totalETHSignaled ].reverse();
                  const ethDistributionLabels = [
                    `Locked 3mo: ${formatNumber(summary.totalETHLocked3mo)} ETH`,
                    `Locked 6mo: ${formatNumber(summary.totalETHLocked6mo)} ETH`,
                    `Locked 12mo: ${formatNumber(summary.totalETHLocked12mo)} ETH`,
                    `Signaled: ${formatNumber(summary.totalETHSignaled)} ETH`,
                  ].reverse();
                  return {
                    title: 'ETH locked or signaled',
                    data: {
                      datasets: [{
                        data: ethDistribution,
                        backgroundColor: colorWheel.slice(0, 3).concat(['#ff6383']).reverse(),
                        borderWidth: 1,
                        formatter: (d, index) => [`${formatNumber(d)} ETH`],
                      }],
                      labels: ethDistributionLabels,
                    }
                  };
                }
              }),
              m(Pie, {
                id: 'EFFECTIVE_ETH_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  const totalEffectiveETH = summary.totalEffectiveETHLocked + summary.totalEffectiveETHSignaled;
                  const lockersEDG = 4500000000 * summary.totalEffectiveETHLocked / totalEffectiveETH;
                  const signalersEDG = 4500000000 * summary.totalEffectiveETHSignaled / totalEffectiveETH;
                  const otherEDG = 500000000;
                  const totalEDG = 5000000000;
                  const edgDistribution = [ lockersEDG, signalersEDG, otherEDG ].reverse();
                  const edgDistributionLabels = [
                    `Lockers: ${(100 * lockersEDG / totalEDG).toFixed(1)}%`,
                    `Signalers: ${(100 * signalersEDG / totalEDG).toFixed(1)}%`,
                    `Other: ${(100 * otherEDG / totalEDG).toFixed(1)}%`,
                  ].reverse();
                  return {
                    title: 'EDG distribution',
                    data: {
                      datasets: [{
                        data: edgDistribution,
                        backgroundColor: colorWheel.slice(0, 3).reverse(),
                        borderWidth: 1,
                        formatter: (d, index) => [`${formatNumber(d)} EDG`],
                      }],
                      labels: edgDistributionLabels,
                    }
                  };
                }
              }),
              m(Pie, {
                id: 'LOCK_DISTRIBUTION_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  const lockDistribution = Object.keys(summary.locks)
                    .map((addr) => ({
                      lockAddrs: summary.locks[addr].lockAddrs,
                      value: summary.locks[addr].lockAmt,
                    }))
                    .sort((a, b) => a.value - b.value);
                  const totalLockedETH = lockDistribution.map((d) => d.value).reduce(((a, b) => a + b), 0);
                  return {
                    title: `Lockers - ${formatNumberRound(totalLockedETH)} ETH (${lockDistribution.length} addresses)`,
                    data: {
                      datasets: [{
                        data: lockDistribution.map((d) => d.value),
                        backgroundColor: getColors(lockDistribution.length).reverse(),
                        borderWidth: 1,
                        formatter: (d, index) => [`${formatNumber(d)} ETH`],
                        onclick: (index) => lookupAddrs(lockDistribution[index].lockAddrs)
                      }],
                    },
                  };
                },
              }),
              m(Pie, {
                id: 'EFFECTIVE_LOCKS_DISTRIBUTION_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  const effectiveLocksDistribution = Object.keys(summary.locks)
                    .map((addr) => {
                      return {
                        lockAddrs: summary.edgAddrToETHLocks[addr],
                        value: summary.locks[addr].effectiveValue,
                      };
                    })
                    .sort((a, b) => a.value - b.value);
                  return {
                    title: `Lockers Effective ETH - ${formatNumberRound(summary.totalEffectiveETHLocked)} ETH`,
                    data: {
                      datasets: [{
                        data: effectiveLocksDistribution.map((d) => d.value),
                        backgroundColor: getColors(effectiveLocksDistribution.length).reverse(),
                        borderWidth: 1,
                        formatter: (d, index) => {
                          const pct = d / adjustForGL(summary.totalEffectiveETHLocked
                                                      + summary.totalEffectiveETHSignaled) * 0.9 * 100;
                          return [`${formatNumber(d)} ETH`,
                            `${pct.toFixed(4)}%`];
                        },
                        onclick: (index) => lookupAddrs(effectiveLocksDistribution[index].lockAddrs),
                      }],
                    }
                  };
                },
              }),

              m(Pie, {
                id: 'VALIDATING_LOCK_DISTRIBUTION_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  const validatingDistribution = Object.keys(summary.validatingLocks)
                    .map((addr) => ({
                      lockAddrs: summary.validatingLocks[addr].lockAddrs,
                      value: summary.validatingLocks[addr].lockAmt,
                    }))
                    .sort((a, b) => a.value - b.value);
                  const totalValidatingLockedETH = validatingDistribution.map((d) => d.value)
                    .reduce(((a, b) => a + b), 0);
                  return {
                    title: 'Validating Lockers - '
                      + `${formatNumberRound(totalValidatingLockedETH)} ETH `
                      + `(${validatingDistribution.length} addresses)`,
                    data: {
                      datasets: [{
                        data: validatingDistribution.map((d) => d.value),
                        backgroundColor: getColors(validatingDistribution.length).reverse(),
                        borderWidth: 1,
                        formatter: (d, index) => [`${formatNumber(d)} ETH`],
                        onclick: (index) => lookupAddrs(validatingDistribution[index].lockAddrs),
                      }],
                    }
                  };
                },
              }),
              m(Pie, {
                id: 'EFFECTIVE_VALIDATING_LOCK_DISTRIBUTION_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  const effectiveValDistribution = Object.keys(summary.validatingLocks)
                    .map((addr) => ({
                      lockAddrs: summary.validatingLocks[addr].lockAddrs,
                      value: summary.validatingLocks[addr].effectiveValue,
                    }))
                    .sort((a, b) => a.value - b.value);
                  const totalValidatorEffectiveETH = effectiveValDistribution.map((d) => d.value)
                    .reduce(((a, b) => a + b), 0);
                  return {
                    title: `Validating Lockers Effective ETH - ${formatNumberRound(totalValidatorEffectiveETH)} ETH`,
                    data: {
                      datasets: [{
                        data: effectiveValDistribution.map((d) => d.value),
                        backgroundColor: getColors(effectiveValDistribution.length).reverse(),
                        borderWidth: 1,
                        formatter: (d, index) => {
                          const pct = d / adjustForGL(summary.totalEffectiveETHLocked
                                                      + summary.totalEffectiveETHSignaled) * 0.9 * 100;
                          return [`${formatNumber(d)} ETH`,
                            `${pct.toFixed(4)}%`];
                        },
                        onclick: (index) => lookupAddrs(effectiveValDistribution[index].lockAddrs),
                      }],
                    }
                  };
                }
              }),
              m(Pie, {
                id: 'SIGNAL_DISTRIBUTION_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  const signalDistribution = Object.keys(summary.signals)
                    .map((addr) => ({
                      signalAddrs: summary.signals[addr].signalAddrs,
                      value: summary.signals[addr].signalAmt,
                    }))
                    .sort((a, b) => a.value - b.value);
                  const totalSignaledETH = signalDistribution.map((d) => d.value).reduce(((a, b) => a + b), 0);
                  return {
                    title: 'Signalers - '
                      + `${formatNumberRound(totalSignaledETH)} ETH (${signalDistribution.length} addresses)`,
                    data: {
                      datasets: [{
                        data: signalDistribution.map((d) => d.value),
                        backgroundColor: getColors(signalDistribution.length).reverse(),
                        borderWidth: 1,
                        formatter: (d, index) => [`${formatNumber(d)} ETH`],
                        onclick: (index) => lookupAddrs(signalDistribution[index].signalAddrs),
                      }],
                    }
                  };
                },
              }),
              m(Pie, {
                id: 'EFFECTIVE_SIGNAL_DISTRIBUTION_CHART',
                getData: () => {
                  const summary = state.participationSummary;
                  const effectiveSignalDistribution = Object.keys(summary.signals)
                    .map((addr) => ({
                      signalAddrs: summary.signals[addr].signalAddrs,
                      value: summary.signals[addr].effectiveValue,
                    }))
                    .sort((a, b) => a.value - b.value);
                  return {
                    title: 'Signalers Effective ETH - '
                      + `${formatNumberRound(summary.totalEffectiveETHSignaled)} ETH`,
                    data: {
                      datasets: [{
                        data: effectiveSignalDistribution.map((d) => d.value),
                        backgroundColor: getColors(effectiveSignalDistribution.length).reverse(),
                        borderWidth: 1,
                        formatter: (d, index) => {
                          const pct = d / adjustForGL(summary.totalEffectiveETHLocked
                                                      + summary.totalEffectiveETHSignaled) * 0.9 * 100;
                          return [`${formatNumber(d)} ETH`,
                            `${pct.toFixed(4)}%`];
                        },
                        onclick: (index) => lookupAddrs(effectiveSignalDistribution[index].signalAddrs),
                      }],
                    }
                  };
                },
              }),
              m('.signaling-disclaimer', [
                '*Signaling balances (and thus final percentages) may have changed over the course of the lockdrop.',
              ]),
              m('.gl-disclaimer', [
                `Total generalized locks: ${formatNumberRound(glTotal)} ETH`,
              ]),
              m('.gl-disclaimer', [
                `Additional effective ETH attributable to generalized locks: ${formatNumberRound(glTotal * 0.8)} ETH`,
              ]),
              m('.clear'),
            ]),
            m('.form-field', [
              m('.form-left', [
                m('.caption', [
                  'Select lockdrop contract'
                ]),
                m(Input, {
                  id: 'LOCKDROP_CONTRACT_ADDRESS',
                  type: 'text',
                  fluid: true,
                  value: state.network === 'mainnet'
                    ? MAINNET_LOCKDROP
                    : ROPSTEN_LOCKDROP,
                  readonly: 'readonly'
                }),
                m('.network-selector', [
                  m('label', [
                    m('input', {
                      type: 'radio',
                      name: 'network',
                      value: 'mainnet',
                      oninput: (e) => {
                        if (e.target.checked) {
                          state.network = 'mainnet';
                          state.participationSummary = null;
                          triggerUpdateData();
                        }
                        m.redraw();
                      },
                      oncreate: (vvnode) => {
                        // tslint:disable-next-line:no-string-literal
                        vvnode.dom['checked'] = true;
                      },
                    }),
                    'Mainnet'
                  ]),
                  m('label', [
                    m('input', {
                      type: 'radio',
                      name: 'network',
                      value: 'ropsten',
                      oninput: (e) => {
                        if (e.target.checked) {
                          state.network = 'ropsten';
                          state.participationSummary = null;
                          triggerUpdateData();
                        }
                        m.redraw();
                      },
                    }),
                    'Ropsten',
                  ]),
                ]),
              ]),
              m('.explanation', [
                'You can view the latest transactions on ',
                m('a#ETHERSCAN_LINK', {
                  href: state.network === 'mainnet'
                    ? `https://etherscan.io/address/${MAINNET_LOCKDROP}`
                    : `https://ropsten.etherscan.io/address/${ROPSTEN_LOCKDROP}`,
                  target: '_blank'
                }, 'Etherscan'),
                '.'
              ]),
            ]),
            m('.form-field', [
              m('.form-left', [
                m('.caption', 'Look up participant by address(es)'),
                m(Input, {
                  id: 'LOCKDROP_PARTICIPANT_ADDRESS',
                  type: 'text',
                  fluid: true,
                  placeholder: 'Enter an ETH address: 0x1234...'
                })
              ]),
              m('.explanation', 'This will fetch all locks and signal actions from the input address'),
            ]),
            m('.buttons', [
              m(Button, {
                id: 'LOCK_LOOKUP_BTN',
                intent: 'primary',
                disabled: vnode.state.lookupLoading,
                onclick: async (e) => {
                  e.preventDefault();
                  const addrText = `${$('#LOCKDROP_PARTICIPANT_ADDRESS').val()}`;
                  if (!addrText || !addrText.split) return;
                  const addrs = addrText.split(',').map((a) => a.trim());
                  for (const addr of addrs) {
                    // split the address
                    if (!isHex(addr)) {
                      alert('You must input a valid hex encoded Ethereum address');
                      return;
                    } else if ((addr.length !== 42 && addr.indexOf('0x') !== -1)
                               || (addr.length !== 40 && addr.indexOf('0x') === -1)) {
                      alert('You must input a valid length Ethereum address');
                      return;
                    }
                  }
                  const formattedAddrs = addrs.map((a) => a.length === 40 ? `0x${a}` : a);
                  state.addressSummary = null;
                  vnode.state.lookupLoading = true;
                  vnode.state.lookupCount = formattedAddrs.length;
                  let resultEvents = [];
                  for (let i = 0; i < formattedAddrs.length; i++) {
                    const addr = formattedAddrs[i];
                    const lockEvents = state.participationSummary.ethAddrToLockEvent[addr];
                    const signalEvents = state.participationSummary.ethAddrToSignalEvent[addr];
                    if (lockEvents) resultEvents = [ ...resultEvents, ...lockEvents[0] ];
                    if (signalEvents) resultEvents = [ ...resultEvents, ...signalEvents[0] ];
                  }
                  state.addressSummary = { events: resultEvents };
                  vnode.state.lookupLoading = false;
                  m.redraw();
                },
                label: vnode.state.lookupLoading
                  ? `Looking up ${pluralize(vnode.state.lookupCount, 'address')}...`
                  : 'Lookup'
              }),
            ]),
            state.addressSummary && m('.lock-lookup-results', [
              m('h3', `Found ${pluralize(state.addressSummary.events.length, 'participation event')}`),
              m('ul', {
                oncreate: (vvnode) => {
                  $('html, body').animate({
                    scrollTop: $(vvnode.dom).offset().top - 200
                  }, 500);
                }
              }, state.addressSummary.events.map((event) => {
                const etherscanNet = state.network === 'mainnet' ? 'https://etherscan.io/'
                  : 'https://ropsten.etherscan.io/';
                return m('li', [
                  (event.type === 'signal')
                    ? m('h3', 'Signaled')
                    : m('h3', [
                      `Locked ${formatNumber(event.eth)} ETH - `,
                      event.returnValues.term.toString() === '0' && '3 months',
                      event.returnValues.term.toString() === '1' && '6 months',
                      event.returnValues.term.toString() === '2' && '12 months',
                    ]),
                  (event.type === 'signal') && m('p', [
                    'Tx Hash: ',
                    m('a', {
                      href: `${etherscanNet}tx/${event.data.transactionHash}`,
                      target: '_blank'
                    }, event.data.transactionHash),
                  ]),
                  event.type === 'signal' ? [
                    m('p', [
                      'Signaling Address: ',
                      m('a', {
                        href: `${etherscanNet}address/${event.contractAddr}`,
                        target: '_blank',
                      }, event.contractAddr),
                    ]),
                    m('p', 'EDG Public Key: '
                      + `${event.returnValues.edgewareAddr.slice(2).match(/.{1,64}/g).map((key) => `0x${key}`)[0]}`),
                    m('p', `ETH counted from signal: ${formatNumber(event.eth)}`),
                  ] : [
                    m('p', [
                      'Owner Address: ',
                      m('a', {
                        href: `${etherscanNet}address/${event.owner}`,
                        target: '_blank',
                      }, event.owner),
                    ]),
                    m('p', [
                      'Lockdrop User Contract Address: ',
                      m('a', {
                        href: `${etherscanNet}address/${event.returnValues.lockAddr}`,
                        target: '_blank',
                      }, event.returnValues.lockAddr),
                    ]),
                    m('p', 'EDG Public Key: '
                      + `${event.returnValues.edgewareAddr.slice(2).match(/.{1,64}/g).map((key) => `0x${key}`)[0]}`),
                    m('p', [
                      'Unlocks In: ',
                      Math.round(event.unlockTimeMinutes),
                      ' minutes'
                    ]),
                  ],
                ]);
              }))
            ]),
          ]
        }, {
          name: 'Generalized Lock Appeal',
          content: [
            m('table', [
              m('thead', [
                m('tr', [
                  m('th', { style: 'width: 400px' }, 'Address of requester'),
                  m('th', 'Amount'),
                  m('th', 'Status'),
                ]),
              ]),
              m('tbody', [
                generalizedLocks.map((gl) => m('tr', [
                  m('td', gl.address),
                  m('td', gl.amount),
                  m('td', gl.approved ? 'Approved' : 'Pending'),
                ])),
                m('tr', [
                  m('td', {
                    colspan: 3,
                    style: 'text-align: center;'
                  }, [
                    m('a', {
                      href: 'https://docs.google.com/spreadsheets/d/'
                        + '1ifZ1ya0YGg1hY_hbA1_-VyZXvLFfq_x2rY_QsHBUa8Q/edit#gid=141803740',
                      target: '_blank',
                    }, 'Open in new window')
                  ]),
                ]),
              ]),
            ]),
          ]
        }]),
      ]),
    ]);
  }
};

export default EdgewareStatsPage;
