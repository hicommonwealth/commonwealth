import 'pages/supernova/lock_eth.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';

import { formatAsTitleCase } from 'helpers';
import app from 'state';
import { TextInputFormField, ButtonSelectorFormField } from '../../components/forms';
import SupernovaPreheader from './supernova_preheader';
import ETHInstructions from './eth_instructions';
import SocialShare from './social_share';

export const MAINNET_LOCKDROP = '0xA83A20C149728EBba1764F4e6654Aac02155fd12';
export const ROPSTEN_LOCKDROP = '0x00d5d6dC402f270Dbb3d341c7be43135b8B46a1B';

declare let window: any;

interface IState {
  initialized: boolean;
  lockdropContractObject: any;
  lockdropContractAddress: string;
  supernovaAddress: string;
  lockAmount: number;
  isMainnet: boolean;
  error: string;
  success: string;
  // display instruction steps
  lockdropCLI: boolean;
  metaMask: boolean;
  myCrypto: boolean;
  instructional: boolean;
  keyGen: boolean;
}

const pageState = {
  web3: undefined,
};

const getWeb3 = async (network, remoteUrl = null) => {
  try {
    if (window.ethereum) {
      pageState.web3 = new window.Web3(window.ethereum);
      await window.ethereum.enable();
    } else {
      pageState.web3 = new window.Web3(window.web3.currentProvider);
      window.web3.currentProvider.enable();
    }
  } catch (error) {
    pageState.web3 = (remoteUrl)
    // tslint:disable-next-line:no-string-literal
      ? new window['Web3'](new window['Web3'].providers.HttpProvider(remoteUrl))
    // tslint:disable-next-line:no-string-literal
      : new window['Web3'](new window['Web3'].providers.HttpProvider(`https://${network}.infura.io`));
  }
  return pageState.web3;
};

const SupernovaLockETHPage: m.Component<{}, IState> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'Supernova Lock ATOM Page',
    });
  },
  view: (vnode: m.VnodeDOM<{}, IState>) => {
    const author = app.user.activeAccount;

    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      vnode.state.isMainnet = true;
      vnode.state.lockdropContractAddress = MAINNET_LOCKDROP;
      $.getJSON('/static/contracts/supernova/Lockdrop.json').then((result) => {
        vnode.state.lockdropContractObject = result;
        m.redraw();
      });
    }

    const validateInputs = () => {
      if (isNaN(+vnode.state.lockAmount) || +vnode.state.lockAmount < 0) {
        // Do we want this to be <= 0?
        vnode.state.error = 'Invalid lock amount.';
        m.redraw();
        return false;
      }
      if (typeof vnode.state.supernovaAddress !== 'string' || vnode.state.supernovaAddress.length !== 45) {
        vnode.state.error = 'Invalid Supernova address. Check that you\'ve provided an address and not a pubkey.';
        m.redraw();
        return false;
      }
      if (typeof vnode.state.lockAmount !== 'string') {
        vnode.state.error = 'Invalid lock amount.';
        m.redraw();
        return false;
      }
      return true;
    };

    return m('.SupernovaLockETHPage', [
      m('.forum-container.lockETH-layout', [
        m(SupernovaPreheader),
        m('h2.page-title', 'Lock Ethereum'),
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
              m('.caption', 'Contract Address'),
              m(TextInputFormField, {
                options: {
                  name: 'contractAddress',
                  placeholder: vnode.state.lockdropContractAddress,
                  value: vnode.state.lockdropContractAddress,
                  disabled: true,
                }
              }),
              m(ButtonSelectorFormField, {
                choices: [
                  { network: 'mainnet', address: MAINNET_LOCKDROP },
                  { network: 'ropsten', address: ROPSTEN_LOCKDROP, },
                ].map((contract) => ({
                  name: 'network',
                  value: contract.address, // TD: Verify this is correct
                  label: [
                    m('span.network-icon'),
                    formatAsTitleCase(contract.network),
                  ]
                })),
                defaultSelection: MAINNET_LOCKDROP,
                callback: (result) => {
                  vnode.state.lockdropContractAddress = result;
                  vnode.state.isMainnet = result === MAINNET_LOCKDROP;
                }
              }),
            ]),
            m('.explanation', [
              m('span', [
                'Verify the code and ABI on ',
                m('a#ETHERSCAN_LINK', {
                  href: `https://${vnode.state.isMainnet ? '' : 'ropsten.'}etherscan.io/address/${
                    vnode.state.lockdropContractAddress}`,
                  target: '_blank', // TODO: remove if window.ethereum.isToshi || window.ethereum.isCoinbaseWallet
                }, 'Etherscan'),
                '.'
              ])
            ])
          ]),
          m('.form', [
            m('.form-left', [
              m('.caption', 'Lock Amount'),
              m(TextInputFormField, {
                options: {
                  name: 'amount',
                  placeholder: 'Enter ETH amount'
                },
                callback: (result) => { vnode.state.lockAmount = result; }
              })
            ]),
            m('span.explanation', 'The amount of Ether to lock.')
          ]),
          m('.form', [
            m('.form-left', [
              m('.caption', 'Supernova Address'),
              m(TextInputFormField, {
                options: {
                  name: 'supernovaAddress',
                  placeholder: 'Enter address here: cosmos123...'
                },
                style: 'margin-bottom: 0px;',
                callback: (result) => { vnode.state.supernovaAddress = result; }
              })]),
            m('span.explanation', [
              'Your DUST will go to this address. You can generate a key ',
              m('a', {
                href: '/supernova/keygen',
                target: '_blank', // TODO: remove if window.ethereum.isToshi || window.ethereum.isCoinbaseWallet
              }, 'here'),
              '.',
            ])
          ])
        ]),
        m('.wallets', [
          m('.buttons', [
            m('a.btn.metamask-button', {
              href: '#',
              class: vnode.state.lockdropContractObject === undefined ? 'disabled' : '',
              onclick: async (e) => {
                e.preventDefault();
                vnode.state.error = null;
                vnode.state.success = null;
                // get contract
                const web3 = await getWeb3(vnode.state.isMainnet ? 'mainnet' : 'ropsten');
                const contract = new web3.eth.Contract(vnode.state.lockdropContractObject.abi,
                  vnode.state.lockdropContractAddress);
                const tx = await contract.methods.lock(web3.utils.asciiToHex(vnode.state.supernovaAddress));
                // get wallet
                let coinbaseAcct;
                try {
                  coinbaseAcct = await web3.eth.getCoinbase();
                } catch (err) {
                  vnode.state.error = 'No ETH wallet found.';
                  return;
                }
                if (!coinbaseAcct) {
                  vnode.state.error = 'No account found in ETH wallet.';
                  m.redraw();
                  return;
                }
                // validate inputs, check for correct network
                if (!validateInputs()) return;
                if (vnode.state.isMainnet && web3.currentProvider.chainId !== '0x1') {
                  vnode.state.error = 'Selected mainnet, but your ETH wallet is configured to a different network.';
                  m.redraw();
                  return;
                }
                if (!vnode.state.isMainnet && web3.currentProvider.chainId === '0x1') {
                  vnode.state.error = 'Selected Ropsten testnet, but your ETH wallet is configured to mainnet.';
                  m.redraw();
                  return;
                }
                // send tx
                const params = {
                  from: coinbaseAcct,
                  value: web3.utils.toWei(vnode.state.lockAmount, 'ether'),
                  gasLimit: 150000,
                };
                tx.send(params, (err, txHash) => {
                  if (err) {
                    console.log(err);
                    vnode.state.error = err.message;
                  } else {
                    console.log(txHash);
                    vnode.state.success = 'Success! Transaction submitted.';
                  }
                  m.redraw();
                });
                vnode.state.myCrypto = false;
                vnode.state.lockdropCLI = false;
                vnode.state.metaMask = true;
              }
            }, 'Use Metamask'),
            m('a.btn.mycrypto-button', {
              class: vnode.state.lockdropContractObject === undefined ? 'disabled' : '',
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                vnode.state.error = null;
                vnode.state.success = null;
                if (!validateInputs()) return;
                await getWeb3(vnode.state.isMainnet ? 'mainnet' : 'ropsten');
                vnode.state.lockdropCLI = false;
                vnode.state.metaMask = false;
                vnode.state.myCrypto = true;
                vnode.state.error = '';
                m.redraw();
              }
            }, 'Use MyCrypto'),
            m('a.btn.cli-button', {
              class: vnode.state.lockdropContractObject === undefined ? 'disabled' : '',
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                vnode.state.error = null;
                vnode.state.success = null;
                if (!validateInputs()) return;
                vnode.state.myCrypto = false;
                vnode.state.metaMask = false;
                vnode.state.lockdropCLI = true;
                vnode.state.error = '';
              }
            }, 'Use lockdrop-cli')
          ]),
          m('.wallet-disclaimer', [
            m('span', [
              'Select MyCrypto if you are using a Ledger, Trezor, ',
              'or Safe-T hardware wallet, or an offline keystore ',
              'file.']),
            m('p', '\n'),
            m('span', [
              'Verify the address before sending. We do not accept ',
              'liability for mistakes.'
            ])
          ])
        ]),
        !vnode.state.error && vnode.state.myCrypto && m(ETHInstructions, {
          method: 'myCrypto',
          isMainnet: vnode.state.isMainnet,
          lockdropContractAddress: vnode.state.lockdropContractAddress,
          supernovaAddress: vnode.state.supernovaAddress,
          lockAmount: vnode.state.lockAmount,
          abi: JSON.stringify(vnode.state.lockdropContractObject.abi),
          web3: pageState.web3,
        }),
        !vnode.state.error && vnode.state.lockdropCLI && m(ETHInstructions, {
          method: 'lockdropCLI',
          isMainnet: vnode.state.isMainnet,
          lockdropContractAddress: vnode.state.lockdropContractAddress,
          supernovaAddress: vnode.state.supernovaAddress,
          lockAmount: vnode.state.lockAmount,
          abi: JSON.stringify(vnode.state.lockdropContractObject.abi),
          web3: pageState.web3,
        }),
        vnode.state.error && m('.lock-error', vnode.state.error),
        vnode.state.success && [
          m('.lock-success', vnode.state.success),
          m(SocialShare),
        ]
      ])
    ]);
  }
};

export default SupernovaLockETHPage;
