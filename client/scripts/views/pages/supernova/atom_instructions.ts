import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import CodeBlock from '../../components/widgets/code_block';
import SocialShare from './social_share';

interface IState {
  gaiaCLI: boolean;
}

const ATOMInstructions: m.Component<{}, IState> = {
  view: (vnode: m.VnodeDOM<{}, IState>) => {
    return m('.ATOMInstructions', {
      style: 'display: none;',
      oncreate: (vvnode) => {
        $(vvnode.dom).slideDown(100);
      }
    }, [
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
          'To use Cosmos functionality, you must provide a URL of the Cosmos ',
          'node you want to query against or have one setup locally. ',
          'You must also provide a validator node to delegate to (for specifics ',
          'on Cosmos delegation functionality, see ',
          m('a', {
            href: '/supernova/lockdrop/notes#cosmos-lock-notes',
            onclick: (e) => {
              e.preventDefault();
              m.route.set('/supernova/lockdrop/notes#cosmos-lock-notes');
            }
          }, 'notes on Cosmos locking'),
          ').\n',
          'To use Cosmos functionality without ',
          m('code', 'gaiacli'),
          ' installed, you must provide the address ',
          'of both an active Tendermint RPC and an active REST server. With ',
          m('code', 'gaiacli'),
          ' installed, ',
          'we only require the Tendermint RPC server.'
        ]),
        m('p', [
          'Cosmos functionality requires communication with an active node. ',
          'The node itself exposes a Tendermint RPC listener on port 26657 by ',
          'default for lower- level queries. Gaia also provides a separate, distinct ',
          'listener, run with the ',
          m('code', 'gaiacli rest-server'),
          ' command, and listening on port 1317 by default. This server provides higher-level ',
          'query functionality. This REST server must be configured to communicate with an active ',
          'Tendermint node. See below for the exact environment variables required to configure your ',
          'connection to a node.'
        ]),
        m('p', [
          'Locking and unlocking on Cosmos optionally requires the ',
          m('code', 'gaiacli'),
          ' tool. To get installation instructions, click ',
          m('a', {
            onclick: (e) => {
              e.preventDefault();
              vnode.state.gaiaCLI = true;
            }
          }, 'here'),
          '.'
        ]),
        vnode.state.gaiaCLI && m('.gaiacli', [
          m('.step', [
            m('h4', 'Installing Go'),
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
            m('h4', 'Installing Gaia binaries'),
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
        ]),
        m('p', [
          'Once installed, ensure your ',
          m('code', '.env'),
          ' file is configured with the following fields ',
          '(we provide a Cosmos node on the gaia-13006 testnet at ',
          m('code', '149.28.47.49'),
          ', although we cannot make any guarantees about uptime). Note that ',
          m('code', 'COSMOS_KEY_PATH'),
          ' is optional if using a saved ',
          m('code', 'gaiacli'),
          ' key, which must be then provided via ',
          m('code', '--keyName.')
        ]),
        m(CodeBlock, [
          'TENDERMINT_URL=http://149.28.47.49:26657...\n',
          'COSMOS_REST_URL=http://149.28.47.49:1317...\n',
          'COSMOS_KEY_PATH=lockfile.json...\n',
          'GAIACLI_PATH=/home/yourusername/go/bin/gaiacli...',
        ]),
        m('p', [
          'If correctly configured, the delegation or undelegation should occur immediately. See notes on ',
          m('a', {
            href: '/supernova/lockdrop/notes#cosmos-lock-notes',
            onclick: (e) => {
              e.preventDefault();
              m.route.set('/supernova/lockdrop/notes#cosmos-lock-notes');
            } }, 'Cosmos locking'),
          ' for information on how to verify the status of your delegation.'
        ]),
      ]),
      m('.step', [
        m('h4', 'Step 3.'),
        m('p', [
          'Ensure you have a live Cosmos node url configured before proceeding, as well ',
          'as an active validator address to delegate to, e.g. ',
          m('code', 'cosmosvaloper1le0gdn7u8z4vyjyctp32zhmqd2wufvy5tkrd6x.')
        ]),
        m('h5', 'Example'),
        m('p', [
          'Locking 100 UATOM on a Cosmos network, using a ',
          m('code', 'gaiacli'),
          ' install which has been registered with a key named "TestKey". You will be prompted to enter your ',
          'previously configured password for TestKey, after which the lock will occur immediately.'
        ]),
        m(CodeBlock, [
          'yarn lock-atom 100 --keyName TestKey --validator <VALIDATOR_ADDRESS>'
        ]),
      ]),
      m(SocialShare)
    ]);
  }
};

export default ATOMInstructions;
