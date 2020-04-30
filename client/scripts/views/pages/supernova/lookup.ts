import 'pages/supernova/lookup.scss';

import app from 'state';
import { default as $ } from 'jquery';
import { default as m } from 'mithril';

import { pluralize } from 'helpers';
import { isHex, formatNumber } from 'views/stats/stats_helpers';
import { TextInputFormField } from '../../components/forms';
import SupernovaPreheader from './supernova_preheader';

/*
  TODO: Add storing unverified address route to on button click, if vnode.state.addressSummary !== null;
  TODO: Test the full flow/ make sure that the locks come back in the right format for ATOM and BTC locks
*/

interface IState {
  btcTxHash: string;
  ethAddress: string;
  cosmosAddress: string;
  btcError: string;
  ethError: string;
  atomError: string;
  lookupLoading: boolean;
  ethAddressSummary: any;
  btcTxHashSummary: any;
  atomAddressSummary: any;
  network: string;
  ethAmount: string;
}

const getIndividualLocksForNetwork = async (chain, queryObj) => {
  const url = `${app.serverUrl()}/stats/supernova/lockdrop/${chain}`;
  let response;
  try {
    response = await $.get(url, queryObj);
  } catch (e) {
    throw new Error(`backend error: ${e.responseJSON ? e.responseJSON.error : e.responseText}`);
  }
  if (typeof response.balances === 'undefined') {
    throw new Error(`got unsuccessful status: ${response.status}`);
  }
  console.log(`got locks for chain: ${chain}`);
  return response.balances;
};

const SupernovaLockLookupPage: m.Component<{}, IState> = {
  view: (vnode: m.VnodeDOM<{}, IState>) => {
    vnode.state.network = 'mainnet';

    return m('.SupernovaLockLookupPage', [
      m('.forum-container.lookup-layout', [
        m(SupernovaPreheader),
        m('h2.page-title', 'Check Supernova lock status'),
        m('a.supernova-back', {
          href: '/supernova',
          onclick: (e) => {
            e.preventDefault();
            m.route.set('/supernova');
          }
        }, '« Back'),
        m('.form-container', [
          m('.form', [
            m('.form-left', [
              m('.caption', 'BTC TX hash'),
              m(TextInputFormField, {
                options: {
                  name: 'btcTxHash',
                  placeholder: 'Enter BTC TX hash'
                },
                callback: (result) => { vnode.state.btcTxHash = result; }
              })]),
            m('span.explanation', [
              'Enter the TX hash of the lock transaction.'
            ]),
          ]),
          m('.wallets', [
            m('.buttons', [
              m('a.btn', {
                href: '#',
                onclick: async (e) => {
                  e.preventDefault();
                  if (typeof vnode.state.btcTxHash !== 'string') {
                    vnode.state.btcError = 'Invalid BTC transaction hash.';
                    m.redraw();
                    return;
                  }
                  const txHashText = (`${vnode.state.btcTxHash}`).trim();
                  if (!isHex(txHashText)) {
                    vnode.state.btcError = 'Invalid BTC transaction hash - must be hex encoded.';
                    return;
                  } else if ((txHashText.length !== 66 && txHashText.indexOf('0x') !== -1)
                               || (txHashText.length !== 64 && txHashText.indexOf('0x') === -1)) {
                    vnode.state.btcError = 'Invalid BTC transaction hash - incorrect length.';
                    return;
                  }
                  vnode.state.btcError = null;
                  vnode.state.btcTxHashSummary = null;
                  vnode.state.lookupLoading = true;
                  try {
                    vnode.state.btcTxHashSummary = await getIndividualLocksForNetwork('btc', { hash: txHashText });
                  } catch (err) {
                    vnode.state.btcError = err.message;
                  }
                  vnode.state.lookupLoading = false;
                  m.redraw();
                }
              }, 'Get BTC Locks'),
            ]),
          ]),
          m('.form-left', [
            vnode.state.btcTxHashSummary && m('.lock-lookup-results', [
              m('h3', `Found ${pluralize(vnode.state.btcTxHashSummary.length, 'participation event')}`),
              m('ul', {
                oncreate: (vvnode) => {
                  $('html, body').animate({
                    scrollTop: $(vvnode.dom).offset().top - 200
                  }, 500);
                }
              }, vnode.state.btcTxHashSummary.map((lock) => {
                const btcNetwork = 'https://blockexplorer.com/';
                const lockTxData = JSON.parse(JSON.parse(lock.data).data);
                console.log('locktxdata', lockTxData);
                return m('li', [
                  m('h3', [
                    `Locked ${formatNumber(lock.balance)} BTC - `,
                    `Locked at block ${lock.blocknum}`,
                  ]), [
                    m('p', [
                      'Transaction hash: ',
                      m('a', {
                        href: `${btcNetwork}tx/${lock.hash}`,
                        target: '_blank',
                      }, lock.hash),
                    ]),
                    m('p', [
                      'Redeem Address: ',
                      m('a', {
                        href: `${btcNetwork}address/${lockTxData.redeemAddress}`,
                        target: '_blank',
                      }, lockTxData.redeemAddress),
                    ]),
                    m('p', [
                      'P2SH time-lock address: ',
                      m('a', {
                        href: `${btcNetwork}address/${lock.address}`,
                        target: '_blank',
                      }, lock.address),
                    ]),
                    m('p', `DUST Public Address: ${lockTxData.supernovaAddress}`),
                  ],
                ]);
              }))
            ]),
          ]),
          vnode.state.btcError && m('.lookup-error', vnode.state.btcError),
          m('.form', [
            m('.form-left', [
              m('.caption', 'ETH Address'),
              m(TextInputFormField, {
                options: {
                  name: 'ethAddress',
                  placeholder: 'Enter ETH address'
                },
                callback: (result) => vnode.state.ethAddress = result
              })
            ]),
            m('span.explanation', [
              'Enter the ETH address that the lock transaction was sent from.'
            ]),
          ]),
          m('.wallets', [
            m('.buttons', [
              m('a.btn', {
                href: '#',
                class: vnode.state.lookupLoading ? 'disabled' : '',
                onclick: async (e) => {
                  e.preventDefault();
                  const addrText = (`${vnode.state.ethAddress}`).trim();
                  if (!isHex(addrText)) {
                    vnode.state.ethError = 'Invalid ETH address - must be hex encoded.';
                    return;
                  } else if ((addrText.length !== 42 && addrText.indexOf('0x') !== -1)
                               || (addrText.length !== 40 && addrText.indexOf('0x') === -1)) {
                    vnode.state.ethError = 'Invalid ETH address - incorrect length.';
                    return;
                  }
                  const formattedAddr = addrText.length === 40 ? `0x${addrText}` : addrText;
                  vnode.state.ethError = null;
                  vnode.state.ethAddressSummary = null;
                  vnode.state.lookupLoading = true;
                  try {
                    vnode.state.ethAddressSummary = await getIndividualLocksForNetwork('eth', {
                      address: formattedAddr
                    });
                  } catch (err) {
                    vnode.state.ethError = err.message;
                  }
                  vnode.state.lookupLoading = false;
                  m.redraw();
                },
              },
              vnode.state.lookupLoading
                ? 'Looking up address...'
                : 'Get ETH Locks'),
            ]),
          ]),
          m('.form-left', [
            vnode.state.ethAddressSummary && m('.lock-lookup-results', [
              m('h3', `Found ${pluralize(vnode.state.ethAddressSummary.length, 'participation event')}`),
              m('ul', {
                oncreate: (vnode) => {
                  $('html, body').animate({
                    scrollTop: $(vnode.dom).offset().top - 200
                  }, 500);
                }
              }, vnode.state.ethAddressSummary.map((lock) => {
                const etherscanNet = vnode.state.network === 'mainnet' ? 'https://etherscan.io/'
                  : 'https://ropsten.etherscan.io/';
                const txData = JSON.parse(lock.data);
                const diffTime = Math.abs(
                  (new Date(1577836800 * 1000)).getDate()
                    - (new Date(lock.timestamp)).getDate()
                );
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // we avoid top-level import of web3 thru this hack
                import('web3').then((Web3) => {
                  vnode.state.ethAmount = Web3.default.utils.fromWei(txData.returnValues.eth, 'ether');
                });
                return m('li', [
                  m('h3', `Locked ${vnode.state.ethAmount ? formatNumber(vnode.state.ethAmount) : '--'} ETH - 6 months`),
                  [
                    m('p', [
                      'Owner Address: ',
                      m('a', {
                        href: `${etherscanNet}address/${txData.returnValues.owner}`,
                        target: '_blank',
                      }, txData.returnValues.owner),
                    ]),
                    m('p', [
                      'Lockdrop User Contract Address: ',
                      m('a', {
                        href: `${etherscanNet}address/${txData.returnValues.lockAddr}`,
                        target: '_blank',
                      }, txData.returnValues.lockAddr),
                    ]),
                    m('p', `DUST Address: ${txData.returnValues.supernovaAddr}`),
                    m('p', [
                      'Unlocks In: ',
                      (Math.round(diffDays) >= 0) ? Math.round(diffDays) : 0,
                      ' minutes'
                    ]),
                  ],
                ]);
              }))
            ]),
          ]),
          vnode.state.ethError && m('.lookup-error', vnode.state.ethError),
          m('.form', [
            m('.form-left', [
              m('.caption', 'ATOM Address'),
              m(TextInputFormField, {
                options: {
                  name: 'atomAddress',
                  placeholder: 'Enter ATOM address'
                },
                callback: (result) => { vnode.state.cosmosAddress = result; }
              })
            ]),
            m('span.explanation', [
              'Enter the ATOM address that the lock transaction was sent from.'
            ]),
          ]),
          m('.wallets', [
            m('.buttons', [
              m('a.btn', {
                href: '#',
                onclick: async (e) => {
                  e.preventDefault();
                  const address = (`${vnode.state.cosmosAddress}`).trim();
                  if (typeof address !== 'string' || address.length !== 52) {
                    vnode.state.atomError = 'Invalid ATOM address.';
                    return;
                  }
                  vnode.state.atomError = null;
                  vnode.state.atomAddressSummary = null;
                  vnode.state.lookupLoading = true;
                  try {
                    vnode.state.atomAddressSummary = await getIndividualLocksForNetwork('atom', { address });
                  } catch (err) {
                    vnode.state.atomError = err.message;
                  }
                  vnode.state.lookupLoading = false;
                  m.redraw();
                }
              }, 'Get ATOM Locks'),
            ]),
          ]),
          m('.form-left', [
            vnode.state.atomAddressSummary && m('.lock-lookup-results', [
              m('h3', `Found ${pluralize(vnode.state.atomAddressSummary.length, 'participation event')}`),
              m('ul', {
                oncreate: (vvnode) => {
                  $('html, body').animate({
                    scrollTop: $(vvnode.dom).offset().top - 200
                  }, 500);
                }
              }, vnode.state.atomAddressSummary.map((lock) => {
                const atomNetwork = 'https://www.mintscan.io/account';
                return m('li', [
                  m('h3', [
                    `Delegated ${formatNumber(lock.balance)} ATOM - `,
                  ]), [m('p', [
                    'Owner Address and DUST Address: ',
                    m('a', {
                      href: `${atomNetwork}/${lock.address}`,
                      target: '_blank',
                    }, lock.address),
                  ]),
                  ],
                ]);
              }))
            ]),
          ]),
          vnode.state.atomError && m('.lookup-error', vnode.state.atomError),
        ]),
      ])
    ]);
  }
};

export default SupernovaLockLookupPage;
