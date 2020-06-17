import 'pages/supernova/key_gen.scss';

import m from 'mithril';

import CodeBlock from '../../components/widgets/code_block';
import SupernovaPreheader from './supernova_preheader';

interface IState {
  showMnemonic: boolean;
  showKey: boolean;
  url: string;
  keys: IKeys;
}

interface IKeys {
  mnemonic: string;
  privateKey: string;
  publicKey: string;
  cosmosAddress: string;
}

async function generateKeys() {
  const mnemonic = (await import('bip39')).generateMnemonic(256);
  const keys = (await import('@lunie/cosmos-keys')).getNewWalletFromSeed(mnemonic);
  const json = JSON.stringify({
    mnemonic,
    privateKey: keys.privateKey,
    publicKey: keys.publicKey,
    supernovaAddress: keys.cosmosAddress,
  });
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'keys.json';
  a.click();
  a.remove();

  return Object.assign(keys, { mnemonic });
}

const BrowserKeygen: m.Component<{}, { url, keys, showKey, showMnemonic }> = {
  view: (vnode) => {
    return m('.BrowserKeygen', [
      m('h3', 'Generate keys in your browser'),
      m('p', [
        'Generating keys in your browser is less secure, and only recommended ',
        'for low-value lockdrop participants.'
      ]),
      m('p', [
        m('.row', [
          m('.col-sm-6', [
            m('a.btn.formular-button-primary', {
              href: vnode.state.url,
              download: 'keys.json',
              onclick: (e) => {
                e.preventDefault();
                generateKeys().then((keys) => { vnode.state.keys = keys; });
              }
            }, 'Generate and download')
          ])
        ]),
      ]),
      vnode.state.keys && m('p.keys', [
        m('span', 'Private key'),
        !vnode.state.showKey && m('.codeblock-wrapper', {
          onclick: (e) => {
            e.preventDefault();
            vnode.state.showKey = true;
          } }, m(CodeBlock, '[Click to reveal]')),
        vnode.state.showKey && m(CodeBlock, `${vnode.state.keys.privateKey}`),
        m('span', 'Private mnemonic'),
        !vnode.state.showMnemonic && m('.codeblock-wrapper', {
          onclick: (e) => {
            e.preventDefault();
            vnode.state.showMnemonic = true;
          } }, m(CodeBlock, '[Click to reveal]')),
        vnode.state.showMnemonic && m(CodeBlock, `${vnode.state.keys.mnemonic}`),
        m('span', 'Public key'),
        m(CodeBlock, `${vnode.state.keys.publicKey}`),
        m('span', 'Supernova address'),
        m(CodeBlock, `${vnode.state.keys.cosmosAddress}`)
      ])
    ]);
  }
};

const SupernovaCLIKeygen: m.Component = {
  view: (vnode) => {
    return m('.SupernovaCLIKeygen', [
      m('h3', 'Generate keys using the Supernova CLI'),
      m('.step', [
        m('p', [
          'Clone the ',
          m('a', {
            href: 'https://github.com/hicommonwealth/supernova-lockdrop'
          }, 'CLI repo'),
          ' from GitHub. ',
        ]),
        m(CodeBlock, [
          'git clone https://github.com/hicommonwealth/supernova-lockdrop.git',
        ]),
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
        m('p', [
          'To generate a keypair, run ',
          m('code', 'yarn generate --supernova'),
          '. Make sure to save the mnemonic and private key somewhere secure.'
        ])
      ])
    ]);
  }
};

const GaiaCLIKeygen: m.Component = {
  view: (vnode) => {
    return m('.GaiaCLIKeygen', [
      m('h3', 'Generate keys using gaia-cli'),
      m('.step', [
        m('h4', 'Step 1. Install Go'),
        m('p', [
          'Install ',
          m('code', 'go'),
          ' (version 1.13 or later) by following the ',
          m('a', {
            href: 'https://golang.org/doc/install'
          }, 'official docs'),
          '. Then set your ',
          'environment variables in the command line as follows:'
        ]),
        m(CodeBlock, [
          'mkdir -p $HOME/go/bin\n',
          'echo "export GOPATH=$HOME/go" >> ~/.bash_profile\n',
          'echo "export GOBIN=$GOPATH/bin" >> ~/.bash_profile\n',
          'echo "export PATH=$PATH:$GOBIN" >> ~/.bash_profile\n',
          'source ~/.bash_profile'
        ])
      ]),
      m('.step', [
        m('h4', 'Step 2. Install Gaia binaries'),
        m('p', [
          'To install the latest stable version of the ',
          m('code', 'gaiad'),
          ' and ',
          m('code', 'gaiacli'),
          ' binaries, checkout the ',
          m('code', 'master'),
          ' branch.'
        ]),
        m(CodeBlock, [
          'mkdir -p $GOPATH/src/github.com/cosmos\n',
          'cd $GOPATH/src/github.com/cosmos\n',
          'git clone https://github.com/cosmos/cosmos-sdk\n',
          'cd cosmos-sdk && git checkout master\n',
          'make tools install'
        ]),
        m('p', [
          'Then verify the installation by running ',
          m('code', 'gaiad version'),
          ' and ',
          m('code', 'gaiacli version'),
          '.'
        ])
      ]),
      m('.step', [
        m('h4', 'Step 3. Generate keys'),
        m('p', 'Run the following command, inserting your desired username:'),
        m(CodeBlock, 'gaiacli keys add <USERNAME>'),
        m('p', 'Save the keys and phrase somewhere secure. To display them, run:'),
        m(CodeBlock, 'gaiacli keys show <USERNAME>')
      ])
    ]);
  }
};

const SupernovaKeygen: m.Component<{}, IState> = {
  view: (vnode: m.VnodeDOM<{}, IState>) => {
    return m('.SupernovaKeygen', [
      m('.forum-container.keygen-layout', [
        m(SupernovaPreheader),
        m('h2.page-title', 'Generate Supernova Address'),
        m('a.supernova-back', {
          href: '/supernova',
          onclick: (e) => {
            e.preventDefault();
            m.route.set('/supernova');
          }
        }, '« Back'),
        m(BrowserKeygen),
        m(SupernovaCLIKeygen),
        m(GaiaCLIKeygen)
      ])
    ]);
  }
};

export default SupernovaKeygen;
