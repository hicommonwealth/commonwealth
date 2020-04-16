import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import CodeBlock from '../../components/widgets/code_block';
import SocialShare from './social_share';

const BTCInstructions: m.Component = {
  view: (vnode: m.VnodeDOM) => {
    return m('.BTCInstructions', {
      oncreate: (vnode) => {
        $('.mithril-app').animate({ scrollTop: $(vnode.dom).position().top }, 500);
      }
    }, [
      m('.step', [
        m('h4', 'Downloading the supernova-lockdrop CLI'),
        m('p', [
          'Bitcoin locking requires the supernova-lockdrop CLI and a bcoin wallet.',
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
            `You will need to install Node v11.6 to run the lockdrop scripts. If you don't `,
            `have it installed, we recommend using NVM to install Node:`,
          ]),
          m(CodeBlock, [
            `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash\n`,
            `nvm install 11.6.0\n`,
            `nvm use 11.6.0\n`,
          ]),
          m('p', [
            'Then, run ',
            m('code', 'npm install'),
            ' or ',
            m('code', 'yarn'),
            ' to install any package dependencies.'
          ]),
        ])
      ]),
      m('.step', [
        m('h4', 'Installing Bcoin'),
        m('p', [ 'To install bcoin, follow the guide ',
          m('a', {
            href: 'https://bcoin.io/guides/beginners.html'
          }, 'here'),
          '. The steps should approximately be:'
          ]
        ),
        m(CodeBlock,  [
          `git clone https://github.com/bcoin-org/bcoin.git\n`,
          `cd bcoin\n`,
          `npm install\n`,
          `npm install -g # Link bcoin binaries globally`
        ])
      ]),
      m('.step', [
        m('h4', 'Starting a local bcoin node'),
        m('p', [
          'If you would like to use a local bcoin node, you should start and sync bcoin now. ',
          'This will take at least 24-48 hours, depending on your Internet connection ',
          'If are not using a preexisting wallet from an earlier install of bcoin, you ',
          'should include the pruning flag, which will greatly speed up syncing:'
        ]),
        m(CodeBlock, 'bcoin --prune'),
        m('p', [
          'Otherwise, you can use a Commonwealth-provided bcoin node, although we do not ',
          'provide any guarantees for uptime or availability',
        ]),
      ]),
      m('.step', [
        m('h4', 'Installing an IPFS node'),
        m('p', [
          'Install ',
          m('code', 'ipfs'),
          ' globally to have access to the ',
          m('code' , 'jsipfs'),
          ' command, and launch the ipfs daemon:'
        ]),
        m(CodeBlock, [
          `npm install ipfs --global\n`,
          `jsipfs daemon `
        ]),
        m('p', 'Once you have Bcoin access and a working IPFS node, you can proceed with your lock!'),
      ]),
      m('.step', [
        m('h4', 'Configuring your environment'),
        m('p', [
          'Once installed, ensure your ',
          m('code', '.env'),
          ' file is configured with the following fields ',
        ]),
        m(CodeBlock, [
          `// Bitcoin parameters`,
          `const BTC_BIP39_MNEMONIC = process.env.BTC_BIP39_MNEMONIC;\n`,
          `const BTC_NETWORK_SETTING = process.env.BITCOIN_NETWORK_SETTING || 'regtest';\n`,
          `// Bcoin parameters`,
          `const BCOIN_WALLET_ID = process.env.BCOIN_WALLET_ID || 'primary';\n`,
          `const BCOIN_WALLET_ACCOUNT = process.env.BCOIN_WALLET_ACCOUNT || 'default';\n`,
          `const BCOIN_WALLET_PASSPHRASE = process.env.BCOIN_WALLET_PASSPHRASE || '';\n`,
          `const BCOIN_NODE_ADDRESS = process.env.BCOIN_NODE_ADDRESS || '127.0.0.1';\n`,
          `const BCOIN_WALLET_NODE_ADDRESS = process.env.BCOIN_WALLET_NODE_ADDRESS || '127.0.0.1';\n`
        ])
      ]),
      m('.step', [
        m('h4', 'Locking'),
        m('p', [
          'Bcoin comes with a native wallet that you can use to fund new keys to ',
          'participate in the lockdrop. To learn more about the commands to run, ',
          'you can read the ',
          m('a', {
            href: 'https://bcoin.io/api-docs/?shell--cli#wallet'
          }, 'API documentation'),
          '.'
        ]),
        m('p', 'First, start the wallet daemon. If you are using a local bcoin node, run:'),
        m(CodeBlock, 'bwallet'),
        m('p', 'If you are using Commonwealth\'s remote bcoin node, instead run:'),
        m(CodeBlock, 'bwallet --node-host=bcoin.commonwealth.im --node-api-key=supernova'),
        m('p', [
          'Bwallet will run in the background and sync to the bcoin node. You can use ',
          m('code', 'bwallet-cli'),
          ' to talk to it and generate keys or sign transactions.',
        ]),
        m('p', [
          'To create a wallet called ',
          m('code', 'default' ),
          ', run:'
        ]),
        m(CodeBlock, 'bwallet-cli account create default'),
      ]),
      m('.step', [
        m('h4', 'Examples'),
        m('p', 'To lock one satoshi on a Bitcoin regtest network with default wallet settings:'),
        m(CodeBlock, 'yarn lock-btc 0.00000001'),
        m('p', 'To lock 0.5 BTC on the main Bitcoin network with default wallet settings:'),
        m(CodeBlock, 'yarn lock-btc 0.5 --network=main'),
        m('p', 'To lock 1 BTC on the main Bitcoin network with non-default wallet settings:'),
        m(CodeBlock, 'yarn lock-btc 1 --walletId=test --walletAccount=default --network=main ')
      ]),
      m('.step', [
        m('h4', 'Final steps'),
        m('p', [
          'Once you have successfully locked, you will have a file named ',
          m('code', 'tx-info.json'),
          ' generated in your project directory. You can use the hash of the ',
          m('code', 'lockedTx'),
          ' to verify that the transaction was broadcasted on any Bitcoin blockchain explorer. ',
          'Similarly, you can look up the data at the IPFS multihashes to visualize the data stored there.'
        ])
      ]),
      m(SocialShare),
    ]);
  }
};

export default BTCInstructions;
