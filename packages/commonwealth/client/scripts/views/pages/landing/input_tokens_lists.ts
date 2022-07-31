import { Spinner } from 'construct-ui';
import m from 'mithril';
import InputTokenOptionComponent from './input_token_option';
import { Chain, Token } from './index';
import { placeholderChain } from './tokens_community_hero';

interface IAttrs {
  optionList: (Token | Chain | typeof placeholderChain)[];
  maxOptions: number;
  inputValue: string;
  refilterResults: boolean;
}

const InputTokenList: m.Component<IAttrs, { options: any[], oldValue: string }> = {
  view: (vnode) => {
    const { optionList, refilterResults, inputValue } = vnode.attrs;
    if (inputValue.length < 3) return;
    const { oldValue } = vnode.state;
    const chainNameInputValue = inputValue.toLowerCase();
    if (refilterResults && inputValue !== vnode.state.oldValue) {
      vnode.state.oldValue = inputValue;
      vnode.state.options = ((inputValue.includes(oldValue) && !!oldValue) ? vnode.state.options : optionList)
        .filter((option) => {
          if ((option as Token).symbol) {
            option = (option as Token);
            const tokenNameSubtracted = option.name
              .substr(0, inputValue.length)
              .toLowerCase();
            const tokenSymbolSubtracted = option.symbol
              .substr(0, inputValue.length)
              .toLowerCase();
            return (tokenNameSubtracted === chainNameInputValue || tokenSymbolSubtracted === chainNameInputValue);
          } else {
            option = (option as Chain);
            const chainNameSubtracted = option.id
              .substr(0, inputValue.length)
              .toLowerCase();
            if (!option.chainInfo?.symbol) console.log(option);
            const chainSymbolSubtracted = option.chainInfo.symbol
              .substr(0, inputValue.length)
              .toLowerCase();
            return (chainNameSubtracted === chainNameInputValue
              || chainSymbolSubtracted === chainNameInputValue
              || option.placeholder);
          }
        });
    }
    const renderResults = (option) => {
      if ((option as Token).symbol) {
        option = (option as Token);
        return m(InputTokenOptionComponent, {
          route: option.address,
          iconImg: option.logoURI,
          text: option.name,
        });
      } else {
        option = (option as Chain);
        return m(InputTokenOptionComponent, {
          route: option.id,
          iconImg: option.img,
          text: option.name,
        });
      }
    };
    if (!vnode.state.options) return;
    return m('ul.InputTokenList', {
      class: 'absolute left-0 right-0 shadow-xl bg-white rounded top-full mt-16 text-xl p-3 z-10',
      id: 'tokens-list',
      style: 'overflow-y: scroll; max-height: 16rem;'
    }, vnode.state.options.slice(0, vnode.attrs.maxOptions).map(renderResults));
  },
};

export default InputTokenList;
