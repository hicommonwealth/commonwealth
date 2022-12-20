
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';
import { notifyError } from 'controllers/app/notifications';
import FindYourTokenInputComponent from './find_your_token_input';
import InputTokensListComponent from './input_tokens_lists';

import 'pages/landing/tokens_community_hero.scss';
import { Chain, Token } from './index';

export const placeholderChain = {
  img: 'static/img/add.svg',
  id: 'placeholder',
  chainInfo: { symbol: 'PLACEHOLDER' },
  name: 'Add your token!',
  placeholder: true,
}

interface IState {
  chainsAndTokens: (Chain | Token | typeof placeholderChain)[];
  hiddenInputTokenList: boolean;
  inputTokenValue: string;
  inputTimeout: any;
  refilterResults: boolean;
}

interface IAttrs {
  chains: Chain[];
}

const initiateFullSearch = (searchTerm) => {
  if (
    !searchTerm ||
    !searchTerm.toString().trim() ||
    !searchTerm.match(/[A-Za-z]+/)
  ) {
    return;
  }
  if (searchTerm.length < 3) {
    notifyError('Query must be at least 3 characters');
  }
  const params = `q=${encodeURIComponent(searchTerm.toString().trim())}&scope[]=Communities`;
  setRoute(`/search?${params}`);
};

const TokensCommunityComponent: Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.hiddenInputTokenList = true;
    vnode.state.inputTokenValue = '';
    vnode.state.refilterResults = true;
    vnode.state.chainsAndTokens = [];
  },
  view: (vnode) => {
    vnode.state.chainsAndTokens = [
      placeholderChain,
      ...vnode.attrs.chains,
    ];
    const mappedCommunities = [
      {
        variant: `absolute object-top transform sm:translate-x-16 md:translate-x-64
          lg:translate-x-48 translate-y-16 sm:translate-y-40 md:translate-y-32
          lg:translate-y-32 left-10 max-w-none max-h-none h-auto w-629 xl:left-36
          mt-10 sm:mt-0`,
        src: 'static/img/discussions.svg',
        alt: '',
      },
      {
        variant: `absolute object-bottom bottom-0 transform sm:translate-x-16
          md:translate-x-8 lg:translate-x-64 -translate-y-8 lg:left-32 w-350`,
        src: 'static/img/notification.svg',
        alt: '',
      },
      {
        variant: `absolute top-1/2 transform sm:translate-y-16 md:translate-y-48
          lg:translate-y-64  translate-x-8 sm:-translate-x-8 w-400`,
        src: 'static/img/discussion.svg',
        alt: '',
      },
    ]
      .map((community) => {
        return render('img', {
          class: community.variant,
          src: community.src,
          alt: community.alt,
        });
      })
      .filter((comm) => comm);

    return render(
      'section.TokensCommunityComponent',
      {
        class: 'bg-gray-700',
      },
      [
        render('div', { class: 'relative mx-auto' }, [
          render('div', { class: 'md:flex md:flex-row' }, [
            render('div', { class: 'flex items-center justify-center md:w-2/4' }, [
              render(
                'div',
                {
                  class:
                    'mt-32 mb-10 md:my-40 sm:px-8 md:px-8 lg:px-8 xl:px-16 px-8',
                },
                [
                  render('h1', { class: 'text-4xl font-bold mb-5 leading-10' }, [
                    'A ',
                    render(
                      'span',
                      {
                        class: 'bg-clip-text text-transparent gradient-0',
                      },
                      'community'
                    ),
                    ' for every token. ',
                  ]),
                  render(
                    'p',
                    {
                      class: 'text-xl text-gray-600 mb-5',
                    },
                    [
                      'Commonwealth is an all-in-one platform for on-chain communities to discuss, vote, and fund projects together.',
                      ' Never miss an on-chain event, proposal, or important discussion again. ',
                    ]
                  ),
                  render(
                    '.token-search-wrap',
                    {
                      autocomplete: 'off',
                      class:
                        'bg-white shadow-2xl rounded-xl p-2 flex flex-row justify-between mb-10 relative',
                    },
                    [
                      render(FindYourTokenInputComponent, {
                        onchangeValue: (event: any) => {
                          vnode.state.inputTokenValue = event.target.value;
                          vnode.state.refilterResults = false;
                          clearTimeout(vnode.state.inputTimeout);
                          vnode.state.inputTimeout = setTimeout(() => {
                            vnode.state.refilterResults = true;
                            redraw();
                          }, 200);
                        },
                        onkeyupValue: (event: any) => {
                          if (event.key === 'Enter') {
                            initiateFullSearch(event.target.value);
                          }
                        },
                      }),
                      vnode.state.inputTokenValue &&
                        vnode.state.inputTokenValue.length > 2 &&
                        render(InputTokensListComponent, {
                          optionList: vnode.state.chainsAndTokens,
                          inputValue: vnode.state.inputTokenValue,
                          maxOptions: 20,
                          refilterResults: vnode.state.refilterResults,
                        }),
                      render(
                        'button',
                        {
                          type: 'button',
                          class:
                            'btn-primary text-xl font-medium rounded-lg pb-2 pt-3 px-3 w-36',
                          style: 'padding: 8px 16px;',
                          onclick: () => {
                            initiateFullSearch(vnode.state.inputTokenValue);
                          },
                        },
                        [
                          " Let's Go ",
                          render('img', {
                            class: 'inline ml-1.5',
                            src: 'static/img/arrow-right.svg',
                            alt: "Let's Go",
                          }),
                        ]
                      ),
                    ]
                  ),
                  render('div', { class: 'flex justify-center ' }, [
                    render(
                      'h1',
                      {
                        class:
                          'font-bold mb-5 leading-10 md:text-xl lg:text-2xl xl:text-4xl',
                      },
                      ['We’re also here']
                    ),
                    render('div', { class: 'block flex' }, [
                      render(
                        'a',
                        {
                          class: 'ml-4',
                          href: 'https://discord.gg/t9XscHdZrG',
                          target: '_blank',
                        },
                        [
                          render('img', {
                            class: 'inline mr-1.5 h-8 w-8',
                            src: 'static/img/discordIcon.svg',
                            alt: 'Discord',
                          }),
                        ]
                      ),
                      render(
                        'a',
                        {
                          class: 'mx-3 lg:mx-3',
                          href: 'https://t.me/HiCommonwealth',
                          target: '_blank',
                        },
                        [
                          render('img', {
                            class: 'inline mr-1.5 h-8 w-8',
                            src: 'static/img/telegramIcon.svg',
                            alt: 'Telegram',
                          }),
                        ]
                      ),
                      render(
                        'a',
                        {
                          class: 'lg:mx-3',
                          href: 'https://twitter.com/hicommonwealth',
                          target: '_blank',
                        },
                        [
                          render('img', {
                            class: 'inline mr-1.5 h-8 w-8',
                            src: 'static/img/twitterIcon.svg',
                            alt: 'Twitter',
                          }),
                        ]
                      ),
                    ]),
                  ]),
                ]
              ),
            ]),
            render(
              'div',
              {
                class: 'h-556 md:h-auto md:w-2/4',
              },
              [
                render(
                  'div',
                  {
                    class: `gradient-135 overflow-hidden relative h-full lg:min-h-desktop
                lg:h-screen lg:w-50-screen lg:absolute lg:object-left xl:h-full xl:min-h-full`,
                  },
                  mappedCommunities
                ),
              ]
            ),
          ]),
        ]),
      ]
    );
  },
};

export default TokensCommunityComponent;
