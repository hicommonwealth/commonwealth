import 'pages/unlock_lockdrop.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { stat } from 'fs';
import Web3 from 'web3';
import {
  getLockStorage,
  setupWeb3Provider,
  getCurrentTimestamp,
  formatNumber,
  getParticipationSummary,
} from '../stats/stats_helpers';

const LockdropV1 = '0x1b75b90e60070d37cfa9d87affd124bb345bf70a';
const LockdropV2 = '0xfec6f679e32d45e22736ad09dfdf6e3368704e31';
const defaultContract = 'LockdropV1';

const state = {
  contract: defaultContract,
  contractAddress: LockdropV1,
  web3: undefined,
  user: undefined,
  locks: [],
};

declare let window: any;
const getWeb3 = (network, remoteUrl) => {
  try {
    state.web3 = new Web3(window.web3.currentProvider);
  } catch (error) {
    state.web3 = setupWeb3Provider(network, remoteUrl);
  }
  return state.web3;
};

const unlock = async (lockContractAddress, userAddress, web3) => {
  console.log(`Unlocking lock contract: ${lockContractAddress}`);
  // Create send transaction to unlock from the lock contract
  web3.eth.sendTransaction({
    from: userAddress,
    to: lockContractAddress,
    gas: 100000,
  }, (err, result) => {
    if (err) console.error(err);
    else console.log(result);
  });
};

const getLocks = async (lockdropContract, address) => {
  return lockdropContract.getPastEvents('Locked', {
    fromBlock: 0,
    toBlock: 'latest',
    filter: {
      owner: address,
    }
  });
};

const getLocksForAddress = async (userAddress, lockdropContractAddress, web3) => {
  console.log(`Fetching locks for account ${userAddress} for contract ${lockdropContractAddress}`);
  const json = await $.getJSON('/static/contracts/edgeware/Lockdrop.json');
  const contract = new web3.eth.Contract(json.abi, lockdropContractAddress);
  const lockEvents = await getLocks(contract, userAddress);
  const now = await getCurrentTimestamp(web3);

  const promises = lockEvents.map(async (event) => {
    const lockStorage = await getLockStorage(event.returnValues.lockAddr, web3);
    return {
      owner: event.returnValues.owner,
      eth: web3.utils.fromWei(event.returnValues.eth, 'ether'),
      lockContractAddr: event.returnValues.lockAddr,
      unlockTime: `${(lockStorage.unlockTime - now) / 60}`,
      term: event.returnValues.term,
      edgewareAddr: event.returnValues.edgewareAddr,
    };
  });

  return Promise.all(promises);
};

const fetchUnlocks = async (network = 'mainnet', remoteUrl = undefined) => {
  const web3 = getWeb3(network, remoteUrl);
  if (window['Web3'] || window['web3']) {
    const results = await getLocksForAddress(state.user, state.contractAddress, web3);
    state.locks = results;
    return results;
  } else {
    const results = await getParticipationSummary(network);
    const { ethAddrToLockEvent } = results;
    state.locks = ethAddrToLockEvent[state.user][0];
    return ethAddrToLockEvent[state.user][0];
  }
};

const ContractOption = ({ contract, checked }) => {
  return m('label.ContractOption', [
    m('input', {
      type: 'radio',
      name: 'contract',
      value: contract,
      oninput: async (e) => {
        if (e.target.checked) {
          state.contract = contract;
          state.contractAddress = state.contract === 'LockdropV1' ? LockdropV1 : LockdropV2;
          state.locks = [];
        }
        m.redraw();
      },
      oncreate: (vnode) => {
        // tslint:disable-next-line:no-string-literal
        vnode.dom['checked'] = checked;
      },
    }),
    contract,
  ]);
};

const LockContractComponent = {
  view: (vnode) => {
    const { owner, eth, lockContractAddr, unlockTime, unlockTimeMinutes, term, edgewareAddr } = vnode.attrs.data;
    const etherscanNet = 'https://etherscan.io/';
    return m('.LockContractComponent', [
      m('h3', [
        `Locked ${formatNumber(eth)} ETH - `,
        term === '0' && '3 months',
        term === '1' && '6 months',
        term === '2' && '12 months',
      ]),
      m('p', [
        'Owner Address: ',
        m('a', {
          href: `${etherscanNet}address/${owner}`,
          target: '_blank',
        }, owner),
      ]),
      m('p', [
        'Lockdrop User Contract Address: ',
        m('a', {
          href: `${etherscanNet}address/${lockContractAddr}`,
          target: '_blank',
        }, lockContractAddr),
      ]),
      m('p', `EDG Public Keys: ${edgewareAddr}`),
      m('p', [
        'Unlocks In: ',
        Math.round(Number(unlockTime || unlockTimeMinutes)),
        ' minutes'
      ]),
      m('button.formular-button-primary', {
        onclick: async (e) => {
          e.preventDefault();
          vnode.state.error = null;
          vnode.state.success = null;
          if (!state.web3 || !state.web3.currentProvider.selectedAddress) {
            vnode.state.error = 'Metamask not found';
            m.redraw();
            return;
          }
          try {
            await unlock(
              lockContractAddr,
              state.web3.currentProvider.selectedAddress,
              state.web3
            );
            vnode.state.success = 'Transaction sent!';
          } catch (err) {
            vnode.state.error = err.toString();
          }
          m.redraw();
        }
      }, 'Unlock'),
      vnode.state.error && m('.error-message', vnode.state.error),
    ]);
  }
};

const UnlockPage = {
  oncreate: async (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'UnlockPage' });
    state.web3 = getWeb3('mainnet', undefined);

    // if an injected web3 provider e.g. Metamask is found, enable it
    if (state.web3 && state.web3.currentProvider && state.web3.currentProvider.enable) {
      await state.web3.currentProvider.enable();
      if (state.web3.currentProvider.selectedAddress) {
        state.user = state.web3.currentProvider.selectedAddress;
      } else {
        state.user = '';
      }
      m.redraw();
    }
  },
  view: (vnode) => {
    return m('.UnlockPage', [
      m('.container', [
        m('.content', [
          m('h3', 'Unlock with Metamask'),
          m('.form-field', [
            m('.form-left', [
              m('.caption', [
                'Select lockdrop contract'
              ]),
              m('input#LOCKDROP_CONTRACT_ADDRESS', {
                type: 'text',
                value: state.contract === 'LockdropV1' ? LockdropV1 : LockdropV2,
                readonly: 'readonly',
                disabled: true,
              }),
              m('.network-selector', [
                ContractOption({ contract: 'LockdropV1', checked: true }),
                ContractOption({ contract: 'LockdropV2', checked: false })
              ]),
            ]),
          ]),
          m('.form-field', [
            m('.form-left', [
              m('.caption', [
                'Enter the address you locked from'
              ]),
              m('input#LOCKDROP_USER_ADDRESS', {
                type: 'text',
                placeholder: 'Enter an ETH address: 0x1234...',
                value: state.user,
                oninput: (e) => {
                  state.locks = [];
                  state.user = e.target.value;
                },
              }),
            ])
          ]),
          m('.form-field', [
            m('.form-left', [
              m('.lock-user-contracts', (state.locks.length > 0)
                ? state.locks.map((data) => m(LockContractComponent, { data }))
                : m('button', {
                  onclick: async () => {
                    vnode.state.error = null;
                    if (!state.user) {
                      vnode.state.error = 'Enter the address you locked from';
                      m.redraw();
                      return;
                    }
                    try {
                      const results : any[] = await fetchUnlocks();
                      if (results.length === 0) {
                        vnode.state.error = 'No locks from this address';
                      }
                    } catch (e) {
                      vnode.state.error = e.toString();
                    }
                    m.redraw();
                  }
                }, 'Get locks')),
              vnode.state.error && m('.error-message', vnode.state.error),
            ]),
          ]),
        ]),
      ]),
    ]);
  }
};

export default UnlockPage;
