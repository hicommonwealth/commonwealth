import m from 'mithril';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { ALL_RESULTS_QUERY } from 'controllers/server/search';
import { SearchScope } from 'models/SearchQuery'
import FindYourTokenInputComponent from './find_your_token_input';
import InputTokensListComponent from './input_tokens_lists';

import 'pages/landing/tokens_community_hero.scss';
import { Chain, Token } from './index';

interface IState {
  chainsAndTokens: (Chain | Token)[];
  hiddenInputTokenList: boolean;
  inputTokenValue: string;
  inputTimeout: any;
  refilterResults: boolean;
}

interface IAttrs {
  chains: Chain[];
}

const initiateFullSearch = (searchTerm) => {
  if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
    return;
  }
  if (searchTerm.length < 3) {
    notifyError('Query must be at least 3 characters');
  }
  const params = `q=${encodeURIComponent(searchTerm.toString().trim())}`;
  m.route.set(`/search?${params}`);
};

const TokensCommunityComponent: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    app.search.initialize()
    vnode.state.hiddenInputTokenList = true;
    vnode.state.inputTokenValue = '';
    vnode.state.refilterResults = true;
    vnode.state.chainsAndTokens = [];
  },
  view: (vnode) => {
    const stillLoadingTokens = !app.search.getByQuery(ALL_RESULTS_QUERY).loaded;
    if (!stillLoadingTokens) {
      vnode.state.chainsAndTokens = [
        {
          img: 'static/img/add.svg',
          id: 'placeholder',
          chainInfo: { symbol: 'PLACEHOLDER', },
          name: 'Add your token!',
          placeholder: true,
        },
        ...vnode.attrs.chains,
        ...app.search.getByQuery(ALL_RESULTS_QUERY).results[SearchScope.Communities]
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
      m('div', { class: 'relative mx-auto' }, [
        m('div', { class: 'md:flex md:flex-row' }, [
          m('div',
            { class: 'flex items-center justify-center md:w-2/4' }, [
              m('div',
                { class: 'mt-32 mb-10 md:my-40 sm:px-8 md:px-8 lg:px-8 xl:px-16 px-8' },
                [
                  m('h1', { class: 'text-4xl font-bold mb-5 leading-10' }, [
                    'A ',
                    m('span', {
                      class: 'bg-clip-text text-transparent gradient-0'
                    }, 'community'),
                    ' for every token. ',
                  ]),
                  m('p', {
                    class: 'text-xl text-gray-600 mb-5'
                  }, [
                    'Commonwealth is an all-in-one platform for on-chain communities to discuss, vote, and fund projects together.',
                    ' Never miss an on-chain event, proposal, or important discussion again. '
                  ]),
                  m('.token-search-wrap', {
                    autocomplete: 'off',
                    class:
                      'bg-white shadow-2xl rounded-xl p-2 flex flex-row justify-between mb-10 relative',
                  }, [
                    m(FindYourTokenInputComponent, {
                      onchangeValue: (event: any) => {
                        vnode.state.inputTokenValue = event.target.value;
                        vnode.state.refilterResults = false;
                        clearTimeout(vnode.state.inputTimeout);
                        vnode.state.inputTimeout = setTimeout(() => {
                          vnode.state.refilterResults = true;
                          m.redraw();
                        }, 200);
                      },
                      onkeyupValue: (event: any) => {
                        if (event.key === 'Enter') {
                          initiateFullSearch(event.target.value);
                        }
                      }
                    }),
                    vnode.state.inputTokenValue
                    && vnode.state.inputTokenValue.length > 2
                    && m(InputTokensListComponent, {
                      optionList: vnode.state.chainsAndTokens,
                      inputValue: vnode.state.inputTokenValue,
                      maxOptions: 20,
                      stillLoadingTokens,
                      refilterResults: vnode.state.refilterResults,
                    }),
                    m('button', {
                      type: 'button',
                      class: 'btn-primary text-xl font-medium rounded-lg pb-2 pt-3 px-3 w-36',
                      onclick: () => { initiateFullSearch(vnode.state.inputTokenValue); }
                    }, [
                      " Let's Go ",
                      m('img', {
                        class: 'inline ml-1.5',
                        src: 'static/img/arrow-right.svg',
                        alt: "Let's Go",
                      }),
                    ]),
                  ]),
                  m('div', { class: 'flex justify-center ' }, [
                    m('h1', { class: 'font-bold mb-5 leading-10 md:text-xl lg:text-2xl xl:text-4xl' }, [
                      'We’re also here'
                    ]),
                    m('div', { class: 'block flex' }, [
                      m(
                        'a',
                        {
                          class: 'ml-4',
                          href: 'https://discord.gg/frnQxxZG5S',
                          target: '_blank'
                        },
                        [
                          m('img', {
                            class: 'inline mr-1.5 h-8 w-8',
                            src: 'static/img/discordIcon.svg',
                            alt: 'Discord',
                          })
                        ]
                      ),
                      m(
                        'a',
                        {
                          class: 'mx-3 lg:mx-3',
                          href: 'https://t.me/HiCommonwealth',
                          target: '_blank'
                        },
                        [
                          m('img', {
                            class: 'inline mr-1.5 h-8 w-8',
                            src: 'static/img/telegramIcon.svg',
                            alt: 'Telegram',
                          })
                        ]
                      ),
                      m(
                        'a',
                        {
                          class: 'lg:mx-3',
                          href: 'https://twitter.com/hicommonwealth',
                          target: '_blank'
                        },
                        [
                          m('img', {
                            class: 'inline mr-1.5 h-8 w-8',
                            src: 'static/img/twitterIcon.svg',
                            alt: 'Twitter',
                          })
                        ]
                      )
                    ])
                  ])
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
