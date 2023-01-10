import ClassComponent from 'class_component';
import m from 'mithril';

import { InputTokenOptionComponent } from './input_token_option';
import { Chain, Token } from './index';
import { placeholderChain } from './tokens_community_hero';

type InputTokenListAttrs = {
  optionList: (Token | Chain | typeof placeholderChain)[];
  maxOptions: number;
  inputValue: string;
  refilterResults: boolean;
};

export class InputTokenList extends ClassComponent<InputTokenListAttrs> {
  private oldValue: string;
  private options: Array<any>;

  view(vnode) {
    const { optionList, refilterResults, inputValue } = vnode.attrs;

    if (inputValue.length < 3) return;

    const { oldValue } = this;

    const chainNameInputValue = inputValue.toLowerCase();

    if (refilterResults && inputValue !== this.oldValue) {
      this.oldValue = inputValue;

      this.options = (
        inputValue.includes(oldValue) && !!oldValue ? this.options : optionList
      ).filter((option) => {
        if ((option as Token).symbol) {
          option = option as Token;

          const tokenNameSubtracted = option.name
            .substr(0, inputValue.length)
            .toLowerCase();

          const tokenSymbolSubtracted = option.symbol
            .substr(0, inputValue.length)
            .toLowerCase();

          return (
            tokenNameSubtracted === chainNameInputValue ||
            tokenSymbolSubtracted === chainNameInputValue
          );
        } else {
          option = option as Chain;

          const chainNameSubtracted = option.id
            .substr(0, inputValue.length)
            .toLowerCase();

          if (!option.chainInfo?.symbol) console.log(option);

          const chainSymbolSubtracted = option.chainInfo.symbol
            .substr(0, inputValue.length)
            .toLowerCase();

          return (
            chainNameSubtracted === chainNameInputValue ||
            chainSymbolSubtracted === chainNameInputValue ||
            option.placeholder
          );
        }
      });
    }

    const renderResults = (option) => {
      if ((option as Token).symbol) {
        option = option as Token;

        return (
          <InputTokenOptionComponent
            route={option.address}
            iconImg={option.logoURI}
            text={option.name}
          />
        );
      } else {
        option = option as Chain;

        return (
          <InputTokenOptionComponent
            route={option.id}
            iconImg={option.img}
            text={option.name}
          />
        );
      }
    };

    if (!this.options) return;

    return (
      <ul
        class="absolute left-0 right-0 shadow-xl bg-white rounded top-full mt-16 text-xl p-3 z-10"
        id="tokens-list"
        style="overflow-y: scroll; max-height: 16rem;"
      >
        {this.options.slice(0, vnode.attrs.maxOptions).map(renderResults)}
      </ul>
    );
  }
}
