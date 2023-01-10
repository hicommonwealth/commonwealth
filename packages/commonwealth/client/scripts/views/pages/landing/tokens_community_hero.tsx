/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'pages/landing/tokens_community_hero.scss';

import { notifyError } from 'controllers/app/notifications';
import { FindYourTokenInputComponent } from './find_your_token_input';
import { InputTokenList } from './input_tokens_lists';
import { Chain, Token } from './index';

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
  const params = `q=${encodeURIComponent(
    searchTerm.toString().trim()
  )}&scope[]=Communities`;
  m.route.set(`/search?${params}`);
};

export const placeholderChain = {
  img: 'static/img/add.svg',
  id: 'placeholder',
  chainInfo: { symbol: 'PLACEHOLDER' },
  name: 'Add your token!',
  placeholder: true,
};

type TokensCommunityComponentAttrs = {
  chains: Chain[];
};

export class TokensCommunityComponent extends ClassComponent<TokensCommunityComponentAttrs> {
  private chainsAndTokens: Array<Chain | Token | typeof placeholderChain>;
  private hiddenInputTokenList: boolean;
  private inputTimeout: any;
  private inputTokenValue: string;
  private refilterResults: boolean;

  oninit() {
    this.hiddenInputTokenList = true;
    this.inputTokenValue = '';
    this.refilterResults = true;
    this.chainsAndTokens = [];
  }

  view(vnode: m.Vnode<TokensCommunityComponentAttrs>) {
    this.chainsAndTokens = [placeholderChain, ...vnode.attrs.chains];

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
        return (
          <img
            class={community.variant}
            src={community.src}
            alt={community.alt}
          />
        );
      })
      .filter((comm) => comm);

    return (
      <section class="bg-gray-700">
        <div class="relative mx-auto">
          <div class="md:flex md:flex-row">
            <div class="flex items-center justify-center md:w-2/4">
              <div class="mt-32 mb-10 md:my-40 sm:px-8 md:px-8 lg:px-8 xl:px-16 px-8">
                <h1 class="text-4xl font-bold mb-5 leading-10">
                  A
                  <span class="bg-clip-text text-transparent gradient-0">
                    {' '}
                    community{' '}
                  </span>
                  for every token.
                </h1>
                <p class="text-xl text-gray-600 mb-5">
                  Commonwealth is an all-in-one platform for on-chain
                  communities to discuss, vote, and fund projects together.
                  Never miss an on-chain event, proposal, or important
                  discussion again.
                </p>
                <div
                  autocomplete="off"
                  class={`token-search-wrap bg-white shadow-2xl rounded-xl
                     p-2 flex flex-row justify-between mb-10 relative`}
                >
                  <FindYourTokenInputComponent
                    onchangeValue={(event: any) => {
                      this.inputTokenValue = event.target.value;
                      this.refilterResults = false;
                      clearTimeout(this.inputTimeout);
                      this.inputTimeout = setTimeout(() => {
                        this.refilterResults = true;
                        m.redraw();
                      }, 200);
                    }}
                    onkeyupValue={(event: any) => {
                      if (event.key === 'Enter') {
                        initiateFullSearch(event.target.value);
                      }
                    }}
                  />
                  {this.inputTokenValue && this.inputTokenValue.length > 2 && (
                    <InputTokenList
                      optionList={this.chainsAndTokens}
                      inputValue={this.inputTokenValue}
                      maxOptions={20}
                      refilterResults={this.refilterResults}
                    />
                  )}
                  <button
                    type="button"
                    class="btn-primary text-xl font-medium rounded-lg pb-2 pt-3 px-3 w-36"
                    style="padding: 8px 16px;"
                    onclick={() => {
                      initiateFullSearch(this.inputTokenValue);
                    }}
                  >
                    Let's Go{' '}
                    <img
                      class="inline ml-1.5"
                      src="static/img/arrow-right.svg"
                      alt="Let's Go"
                    />
                  </button>
                </div>
                <div class="flex justify-center">
                  <h1 class="font-bold mb-5 leading-10 md:text-xl lg:text-2xl xl:text-4xl">
                    We’re also here
                  </h1>
                  <div class="block flex">
                    <a
                      class="ml-4"
                      href="https://discord.gg/t9XscHdZrG"
                      target="_blank"
                    >
                      <img
                        class="inline mr-1.5 h-8 w-8"
                        src="static/img/discordIcon.svg"
                        alt="Discord"
                      />
                    </a>
                    <a
                      class="mx-3 lg:mx-3"
                      href="https://t.me/HiCommonwealth"
                      target="_blank"
                    >
                      <img
                        class="inline mr-1.5 h-8 w-8"
                        src="static/img/telegramIcon.svg"
                        alt="Telegram"
                      />
                    </a>
                    <a
                      class="lg:mx-3"
                      href="https://twitter.com/hicommonwealth"
                      target="_blank"
                    >
                      <img
                        class="inline mr-1.5 h-8 w-8"
                        src="static/img/twitterIcon.svg"
                        alt="Twitter"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div class="h-556 md:h-auto md:w-2/4">
              <div
                class={`gradient-135 overflow-hidden relative h-full lg:min-h-desktop
                lg:h-screen lg:w-50-screen lg:absolute lg:object-left xl:h-full xl:min-h-full`}
              >
                {mappedCommunities}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
