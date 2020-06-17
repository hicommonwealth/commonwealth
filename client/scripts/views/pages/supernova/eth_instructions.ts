import $ from 'jquery';
import m from 'mithril';

import CodeBlock from '../../components/widgets/code_block';
import SocialShare from './social_share';

interface IAttrs {
  web3: any;
  method: string;
  isMainnet: boolean;
  lockdropContractAddress: string;
  supernovaAddress: string;
  lockAmount: number;
  abi: string;
}

const ETHInstructions: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    return m('.ETHInstructions', {
      key: vnode.attrs.method,
      oncreate: (vvnode) => {
        $('html, body').animate({ scrollTop: $(vvnode.dom).position().top }, 500);
      }
    }, [
      (vnode.attrs.method === 'myCrypto') ? [
        m('.step', [
          m('h4', 'Step 1.'),
          m('p', [
            'Open MyCrypto, and select ',
            m('a', {
              href: 'https://mycrypto.com/contracts/interact',
              target: '_blank', // TODO: remove if window.ethereum.isToshi || window.ethereum.isCoinbaseWallet
            }, 'Tools › Interact with Contracts'),
            '.'
          ]),
          m('p', [
            'For security, we recommend using ',
            m('a', {
              href: 'https://download.mycrypto.com/',
              target: '_blank', // TODO: remove if window.ethereum.isToshi || window.ethereum.isCoinbaseWallet
            }, 'desktop MyCrypto'),
            ' with a hardware wallet.'
          ]),
          !vnode.attrs.isMainnet && m('p', [
            m('strong', 'Select the Ropsten testnet in the network selector.')
          ]),
        ]),
        m('.step', [
          m('h4', 'Step 2.'),
          m('p', [
            'Select ',
            m('b', 'Custom '),
            'as the contract. Copy the lockdrop address into the ',
            'designated input.'
          ]),
          m(CodeBlock, vnode.attrs.lockdropContractAddress)
        ]),
        m('.step', [
          m('h4', 'Step 3.'),
          m('p', [
            'Copy the JSON ABI into the designated input. ',
            'Make sure there are no extra spaces or line breaks.'
          ]),
          m(CodeBlock, vnode.attrs.abi)
        ]),
        m('.step', [
          m('h4', 'Step 4.'),
          m('p', [
            'Click the Access button. Select ',
            m('b', 'lock '),
            'from the dropdown, and input the following data in the ',
            m('b', 'supernovaAddr'),
            ' field:'
          ]),
          m(CodeBlock, [
            vnode.attrs.web3.utils.asciiToHex(vnode.attrs.supernovaAddress)
          ])
        ]),
        m('.step', [
          m('h4', 'Step 5.'),
          m('p', [
            'Select your wallet, and go through any unlocking steps necessary.'
          ]),
          m('.step', [
            m('h4', 'Step 6.'),
            m('p', [
              'Go to ',
              m('b', 'Value'),
              ', and enter the amount of ETH you are locking.'
            ]),
            m(CodeBlock, 'Value: 1')]),
          m('p', 'Uncheck \'Automatically Calculate Gas Limit\' and set your gas limit to 150000.'),
          m('p', 'Sign and send the transaction.')
        ]),
        m(SocialShare),
      ] : (vnode.attrs.method === 'lockdropCLI') ? [
        m('.step', [
          m('h4', 'Step 1.'),
          m('p', [
            'Clone the ',
            m('a', {
              href: 'https://github.com/hicommonwealth/supernova-lockdrop'
            }, 'supernova-lockdrop'),
            ' repository locally. Refer to the README for questions as well as ',
            'the structure of the API.'
          ]),
          m(CodeBlock, 'git clone https://github.com/hicommonwealth/supernova-lockdrop'),
          m('p', [
            'You will need to install Node v11.6 to run the lockdrop scripts. If you don\'t ',
            'have it installed, we recommend using NVM to install Node:',
          ]),
          m(CodeBlock, [
            'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash\n',
            'nvm install 11.6.0\n',
            'nvm use 11.6.0\n',
          ]),
          m('p', [
            'Then, run ',
            m('code', 'npm install'),
            ' or ',
            m('code', 'yarn'),
            ' to install any package dependencies.'
          ]),
        ]),
        m('.step', [
          m('h4', 'Step 2.'),
          m('p', [
            'You will need to provide an Ethereum private key. If you do not have ',
            'one, generate a new Ethereum address with a wallet like Metamask or ',
            'Trust Wallet, and then export the private key.'
          ]),
          m('p', [
            'You will also need an Ethereum node path. You can get one by registering on Infura at ',
            m('a', {
              href: 'https://infura.io'
            }, 'infura.io'),
            ' and using the free tier. Create and open a new project on Infura, then copy its endpoint ',
            'address, which should look like ',
            m('code', 'https://mainnet.infura.io/v3/abc...')
          ])
        ]),
        m('.step', [
          m('h4', 'Step 3.'),
          m('p', [
            'Create a ',
            m('code', '.env '),
            'file in the root directory of the repository, containing the following data.'
          ]),
          m(CodeBlock, [
            '# ETH config \n',
            'ETH_PRIVATE_KEY=<ENTER_PRIVATE_KEY_HEX_HERE>\n',
            '\n',
            '# Node/provider config\n',
            'INFURA_PATH=<ENTER_INFURA_PATH_HERE>\n',
            '\n',
            '# Lockdrop config\n',
            `LOCKDROP_CONTRACT_ADDRESS=${vnode.attrs.lockdropContractAddress}\n`,
            '\n',
            '# Supernova address to lock to\n',
            `SUPERNOVA_ADDRESS=${vnode.attrs.supernovaAddress}`
          ]),
          m('p', [
            'The Ethereum private key can alternatively be provided by an encrypted ',
            'Ethereum keystore, by setting ETH_KEY_PATH, ETH_JSON_VERSION, and ',
            'ETH_JSON_PASSWORD.'
          ]),
          m('p', [
          ])
        ]),
        m('.step', [
          m('h4', 'Step 4.'),
          m('p', 'From within the repo, use the CLI to send the lock transaction.'),
          m(CodeBlock, [
            `yarn start --eth --lock ${vnode.attrs.lockAmount}`
          ]),
        ]),
        m(SocialShare),
      ] : ''
    ]);
  }
};

export default ETHInstructions;
