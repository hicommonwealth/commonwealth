import m from 'mithril';
import app from 'state';
import FindYourTokenInputComponent from './find_your_token_input';
import InputTokensListComponent from './input_tokens_lists';

import './tokens_community.scss';

interface Chain {
  tokenImg: string;
  tokenName: string;
  placeholder?: boolean;
}

interface IState {
  chains: Chain[];
  hiddenInputTokenList: boolean;
  inputTokenValue: string;
}

const TokensCommunityComponent: m.Component<{}, IState> = {
  oninit: (vnode) => {
    vnode.state.hiddenInputTokenList = true;
    vnode.state.inputTokenValue = '';
    vnode.state.chains = [
      {
        tokenImg: 'static/img/add.svg',
        tokenName: 'Add your token!.',
        placeholder: true
      },
    ];

    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.id]) {
        chains[n.chain.id].push(n);
      } else {
        chains[n.chain.id] = [n];
      }
    });

    const myChains: any = Object.entries(chains);
    const myCommunities: any = app.config.communities.getAll();
    const sortChainsAndCommunities = (list) => list
      .sort((a, b) => {
        const threadCountA = app.recentActivity.getCommunityThreadCount(
          Array.isArray(a) ? a[0] : a.id
        );
        const threadCountB = app.recentActivity.getCommunityThreadCount(
          Array.isArray(b) ? b[0] : b.id
        );
        return threadCountB - threadCountA;
      })
    // eslint-disable-next-line array-callback-return
      .map((entity) => {
        if (Array.isArray(entity)) {
          const [chain, nodeList]: [string, any] = entity as any;
          const chainInfo = nodeList[0].chain;
          return { tokenImg: chainInfo.iconUrl, tokenName: chain };
        }
      });

    const sortedChainsAndCommunities = sortChainsAndCommunities(myChains);
    vnode.state.chains = sortedChainsAndCommunities;
  },
  view: (vnode) => {
    return m(
      'section',
      { class: 'bg-gray-700' },
      m(
        'div',
        { class: 'xl:container relative mx-auto' },
        m('div', { class: 'md:flex md:flex-row' }, [
          m(
            'div',
            { class: 'lg:h-720 flex items-center justify-start md:w-2/4' },
            m(
              'div',
              { class: 'px-4 mt-32 mb-10 md:my-40 lg:px-14 xl:px-0 xl:pr-32' },
              [
                m('h1', { class: 'text-4xl font-bold mb-5' }, [
                  'A ',
                  m(
                    'span',
                    { class: 'bg-clip-text text-transparent gradient-0' },
                    'community'
                  ),
                  ' for every token. ',
                ]),
                m(
                  'p',
                  { class: 'text-xl text-gray-600 mb-5' },
                  ' Commonwealth is an all-in-one platform for on-chain communities to discuss, vote, and fund projects. Never miss an interesting on-chain event or thread for your favorite projects. '
                ),
                m(
                  'form',
                  {
                    autocomplete: 'off',
                    class:
                      'bg-white shadow-2xl rounded-xl p-2 flex flex-row justify-between mb-10 relative',
                  },
                  [
                    m(FindYourTokenInputComponent, {
                      onchangeValue: (event: any) => {
                        vnode.state.inputTokenValue = event.target.value;
                        vnode.state.hiddenInputTokenList = event.target.value === '';
                      }
                    }),
                    m(InputTokensListComponent, {
                      optionList: vnode.state.chains,
                      hidden: vnode.state.hiddenInputTokenList,
                      inputValue: vnode.state.inputTokenValue,
                      maxOptions: 5
                    }),
                    m(
                      'button',
                      {
                        class:
                          'btn-primary text-xl font-medium rounded-lg pb-3 w-36',
                      },
                      [
                        " Let's Go ",
                        m('img', {
                          class: 'inline ml-1.5',
                          src: 'static/img/arrow-right.svg',
                          alt: "Let's Go",
                        }),
                      ]
                    ),
                  ]
                ),
                m(
                  'div.TokensCommunityConnectWalletButton',
                  m('p', [
                    m('span', { class: 'mr-5 text-lg' }, 'or'),
                    m(
                      'a',
                      { class: 'btn-outline pb-3 rounded-lg', href: '' },
                      'Connect Wallet'
                    ),
                  ])
                ),
              ]
            )
          ),
          m(
            'div',
            { class: 'h-556 md:h-auto md:w-2/4' },
            m(
              'div',
              {
                class:
                  'gradient-135 overflow-hidden relative h-full lg:min-h-desktop lg:h-screen lg:w-50-screen lg:absolute lg:object-left xl:h-full xl:min-h-full',
              },
              [
                m('img', {
                  class:
                    'absolute object-top transform -translate-y-2/4 left-10 max-w-none max-h-none h-auto w-629 xl:left-36 mt-10',
                  src: 'static/img/discussions.svg',
                  alt: '',
                }),
                m('img', {
                  class: 'absolute object-bottom left-24 lg:left-64 w-350',
                  src: 'static/img/notification.svg',
                  alt: '',
                }),
                m('img', {
                  class:
                    'absolute top-1/2 transform translate-y-5 -left-5 w-400',
                  src: 'static/img/discussion.svg',
                  alt: '',
                }),
              ]
            )
          ),
        ])
      )
    );
  },
};

export default TokensCommunityComponent;
