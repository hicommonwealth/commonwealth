import m from 'mithril';
import app from 'state';
import { ChainInfo } from 'client/scripts/models';
import FindYourTokenInputComponent from './find_your_token_input';
import InputTokensListComponent from './input_tokens_lists';

import 'pages/landing/tokens_community_hero.scss';
import { initializeSearch } from '../../components/search_bar';
import { Chain, Token } from './index';

interface IState {
  chainsAndTokens: (Chain | Token)[];
  hiddenInputTokenList: boolean;
  inputTokenValue: string;
  inputTimeout: any;
}

interface IAttrs {
  chains: Chain[];
}

const TokensCommunityComponent: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    initializeSearch();
    vnode.state.hiddenInputTokenList = true;
    vnode.state.inputTokenValue = '';
    vnode.state.chainsAndTokens = [];
  },
  view: (vnode) => {
    const stillLoadingTokens = !app.searchCache.allResults.loaded;
    if (!stillLoadingTokens) {
      vnode.state.chainsAndTokens = [
        {
          img: 'static/img/add.svg',
          id: 'placeholder',
          chainInfo: { symbol: 'PLACEHOLDER', },
          name: 'Add your token!.',
          placeholder: true,
        },
        ...vnode.attrs.chains,
        ...app.searchCache.allResults.tokens
      ];
    }
    const mappedCommunities = [
      {
        variant:
          `absolute object-top transform sm:translate-x-16 md:translate-x-64 
          lg:translate-x-48 translate-y-16 sm:translate-y-40 md:translate-y-32 
          lg:translate-y-32 left-10 max-w-none max-h-none h-auto w-629 xl:left-36 
          mt-10 sm:mt-0`,
        src: 'static/img/discussions.svg',
        alt: '',
      },
      {
        variant:
          `absolute object-bottom bottom-0 transform sm:translate-x-16 
          md:translate-x-8 lg:translate-x-64 -translate-y-8 lg:left-32 w-350`,
        src: 'static/img/notification.svg',
        alt: '',
      },
      {
        variant:
          `absolute top-1/2 transform sm:translate-y-16 md:translate-y-48 
          lg:translate-y-64  translate-x-8 sm:-translate-x-8 w-400`,
        src: 'static/img/discussion.svg',
        alt: '',
      },
    ]
      .map((community) => {
        return m('img', {
          class: community.variant,
          src: community.src,
          alt: community.alt,
        });
      })
      .filter((comm) => comm);

    return m('section.TokensCommunityComponent', {
      class: 'bg-gray-700'
    }, [
      m('div', { class: 'xl:container relative mx-auto' }, [
        m('div', { class: 'md:flex md:flex-row' }, [
          m('div',
            { class: 'lg:h-720 flex items-center justify-start md:w-2/4' }, [
              m('div',
                { class: 'px-8 mt-32 mb-10 md:my-40 lg:px-14 xl:px-0 xl:pr-32' },
                [
                  m('h1', { class: 'text-4xl font-bold mb-5' }, [
                    'A ',
                    m('span', {
                      class: 'bg-clip-text text-transparent gradient-0'
                    }, 'community'),
                    ' for every token. ',
                  ]),
                  m('p', {
                    class: 'text-xl text-gray-600 mb-5'
                  }, [
                    ' Commonwealth is an all-in-one platform for on-chain communities to discuss, vote, and fund projects.',
                    ' Never miss an interesting on-chain event or thread for your favorite projects. '
                  ]),
                  m('form', {
                    autocomplete: 'off',
                    class:
                      'bg-white shadow-2xl rounded-xl p-2 flex flex-row justify-between mb-10 relative',
                  }, [
                    m(FindYourTokenInputComponent, {
                      onchangeValue: (event: any) => {
                        if (event.target.value?.length < 3) return;
                        clearTimeout(vnode.state.inputTimeout);
                        vnode.state.inputTimeout = setTimeout(() => {
                          vnode.state.inputTokenValue = event.target.value;
                          vnode.state.hiddenInputTokenList = event.target.value === '';
                        }, 500);
                      }
                    }),
                    m(InputTokensListComponent, {
                      optionList: vnode.state.chainsAndTokens,
                      hidden: vnode.state.hiddenInputTokenList,
                      inputValue: vnode.state.inputTokenValue,
                      maxOptions: 20,
                      stillLoadingTokens
                    }),
                    m('button', {
                      class: 'btn-primary text-xl font-medium rounded-lg pb-2 pt-3 px-3 w-36',
                    }, [
                      " Let's Go ",
                      m('img', {
                        class: 'inline ml-1.5',
                        src: 'static/img/arrow-right.svg',
                        alt: "Let's Go",
                      }),
                    ]),
                  ]),
                  // m('div.TokensCommunityConnectWalletButton', [
                  //   m('p', [
                  //     m('span', { class: 'mr-5 text-lg' }, 'or'),
                  //     m(
                  //       'a',
                  //       {
                  //         class: 'btn-outline rounded-lg pb-2 pt-3 px-3',
                  //         href: '',
                  //       },
                  //       'Connect Wallet'
                  //     ),
                  //   ])
                  // ]),
                ])
            ]),
          m('div', {
            class: 'h-556 md:h-auto md:w-2/4'
          }, [
            m('div', {
              class: `gradient-135 overflow-hidden relative h-full lg:min-h-desktop 
                lg:h-screen lg:w-50-screen lg:absolute lg:object-left xl:h-full xl:min-h-full`,
            }, mappedCommunities)
          ]),
        ])
      ])
    ]);
  },
};

export default TokensCommunityComponent;
