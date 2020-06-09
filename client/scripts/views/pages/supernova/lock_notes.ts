import 'pages/supernova/lock_notes.scss';

import m from 'mithril';
import CodeBlock from '../../components/widgets/code_block';
import SupernovaPreheader from './supernova_preheader';

const SupernovaLockNotesPage: m.Component<{}> = {
  view: (vnode: m.VnodeDOM<{}>) => {
    return m('.SupernovaLockNotesPage', [
      m(SupernovaPreheader),
      m('h1', 'Understanding the Lockdrop CLI'),
      m('h3#general-lock-notes[name="general-lock-notes"]', 'Time-lock transactions in Bitcoin vs. Ethereum'),
      m('.general-lock-notes', [
        m('p', [
          m('a', {
            href: '/supernova/lockdrop/btc',
            onclick: (e) => {
              e.preventDefault();
              m.route.set('/supernova/lockdrop/btc');
            } }, 'Locking in Bitcoin'),
          ' and ',
          m('a', {
            href: '/supernova/lockdrop/eth',
            onclick: (e) => {
              e.preventDefault();
              m.route.set('/supernova/lockdrop/eth');
            } }, 'locking in Ethereum'),
          ' are very different. In Bitcoin, one must create a ',
          'CHECKTIMELOCKVERIFY (CTLV) transaction with a future locktime and a redeem address ',
          'to eventually unlock funds. In Ethereum, one can write any manner of smart contracts ',
          'to handle time-locking. These contracts can fire events, force certain locktimes, and ',
          'allow quick retrieval of the metadata to verify the existence of a lock.'
        ]),
        m('p', [
          'The most crucial difference is that Bitcoin time-lock transactions are a ',
          'pay-to-script hash transaction where the script is a CTLV transaction. Since the ',
          'transaction pays to a hash value, it is impossible to ascertain what the underlying ',
          'script is before redeeming, and thus it is impossible to verify that a transaction is ',
          'indeed a time-lock until the funds are unlocked.'
        ]),
        m('p', [
          'To get around this, and to make it possible for a third-party to identify the total set ',
          'of time-lock transactions, Supernova Lockdrop participants must append an OP_RETURN at ',
          'the end of their Bitcoin transaction which contains a link to their unhashed transaction ',
          'metadata on IPFS.'
        ]),
        m('p', [
          'With the Lockdrop CLI, we do this by storing an IPFS hash in the OP_RETURN data field, and we store ',
          'the respective transaction data at that IPFS hash. Bitcoin locks can ',
          m('i', 'only '),
          'be honored if they ',
          'follow this protocol. In addition, locks will ',
          m('i', 'only '),
          'be honored if they adhere to the strict ',
          'locktime of 6 months from the time of the transaction.'
        ])
      ]),
      m('h3#cosmos-lock-notes[name="cosmos-lock-notes"]', 'Locking in Cosmos'),
      m('.cosmos-lock-notes', [
        m('p',
          [ 'Similarly, ',
            m('a', {
              href : '/supernova/lockdrop/atom',
              onclick: (e) => {
                e.preventDefault();
                m.route.set('/supernova/lockdrop/atom');
              } }, 'locking on Cosmos'),
            ' is different in that it does not involve a contract. ',
            'All that is required is delegating some amount of tokens to an active validator ',
            'on the Cosmos Hub Mainnet, which will be automatically counted as a lock if still ',
            'delegated at a chosen "lock height", the block when delegation amounts are counted. ',
            'In the Lockdrop CLI, you can query the list of validators via the ',
            m('code', 'gaiacli'),
            ' tool, with ',
            m('code', 'gaiacli query staking validators'),
            '. You may also need to provide a chain node to query via the ',
            m('code', '--node'),
            ' flag and a chain ID using the ',
            m('code', '--chain-id'),
            ' flag. You can also find validator information on a block explorer, a list of which can ',
            'be found in the ',
            m('a', {
              href: 'https://hub.cosmos.network/#cosmos-hub-explorers'
            }, 'Cosmos documentation'),
            '.'
          ]),
        m('p', [
          'As a result, unlocking can be a partial or a complete operation, in which you can either ',
          'withdraw all delegated tokens, or some portion of them. We do not store the amount delegated ',
          'via the command line, so to fully unlock will require looking up your total delegation. As ',
          'with querying active validators, this can be done either with a block explorer or via the ',
          m('code', 'gaiacli'),
          ' tool (you can do this with ',
          m('code', 'gaiacli query staking delegation'),
          ', providing a validator and a delegator addresses). ',
          'Querying validators can be performed directly using this script, ',
          'assuming correct .env configuration, by running ',
          m('code', 'yarn start --cosmos --query [--validator <validatorAddress>]'),
          '. The ',
          m('code', '--useGaia'),
          ' is also valid for this command, and will simply forward the query to your installation of ',
          m('code', 'gaiacli'),
          '.'
        ]),
        m('p', [
          'A final note is that delegating on Cosmos also results in your account accumulating rewards, ',
          'based on the configuration of the specific validator you\'ve delegated to. These can also be ',
          'withdrawn via the command line, using ',
          m('code', 'gaiacli tx distribution withdraw-rewards'),
          ', specifying the validator address as well as your personal address via the ',
          m('code', '--from'),
          ' flag. Note that you may need to provide ',
          m('code', 'gaiacli'),
          ' with your address\'s associated mnemonic, or else have your address configured with ',
          m('code', 'gaiacli keys'),
          ' before proceeding with this command.'
        ])],
      m('h3#other-lock-notes[name="other-lock-notes"]', 'Other notes on the CLI'),
      m('.other-lock-notes', [
        m('p', [
          'Optionally, you can use the CLI to set the Bitcoin node to provide an HTTP server, only accept ',
          'connections with an API key, or set other parameters to run testnets, index TXs, etc.'
        ]),
        m('p', [
          'If you choose to use a pruned node, be aware that there are technicalities with it ',
          'interfacing with already funded wallets. We recommend a pruned node for fresh wallets ',
          'that have not been funded prior to syncing the chain.'
        ])
      ]),
      m('h3#testing-notes[name="testing-notes"]', 'Testing the CLI'),
      m('p', 'If you are running the tests in the CLI package, the options we use are:'),
      m(CodeBlock, 'bcoin --network=regtest --http-host=0.0.0.0 --api-key=test --index-tx --index-address'))
    ]);
  }
};

export default SupernovaLockNotesPage;
