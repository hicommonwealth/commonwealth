import { Spinner } from 'construct-ui';
import m from 'mithril';
import InputTokenOptionComponent from './input_token_option';
import { Chain, Token } from './index';

interface IAttrs {
  optionList: (Token | Chain)[];
  hidden: boolean;
  maxOptions: number;
  inputValue: string;
  stillLoadingTokens: boolean;
}

const InputTokenList: m.Component<IAttrs, { options: any[], oldValue: string }> = {
  view: (vnode) => {
    const { optionList, maxOptions, inputValue, hidden, stillLoadingTokens } = vnode.attrs;
    const chainNameInputValue = inputValue.toLowerCase();
    if (inputValue !== vnode.state.oldValue) {
      vnode.state.oldValue = inputValue;
      vnode.state.options = optionList
        .filter((option) => {
          if ((option as Token).symbol) {
            option = (option as Token);
            const tokenNameSubtracted = option.name
              .substr(0, inputValue.length)
              .toLowerCase();
            const tokenSymbolSubtracted = option.symbol
              .substr(0, inputValue.length)
              .toLowerCase();
            console.log({ tokenNameSubtracted, tokenSymbolSubtracted, chainNameInputValue });
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
            console.log({ chainNameSubtracted, chainSymbolSubtracted, chainNameInputValue });
            return (chainNameSubtracted === chainNameInputValue
              || chainSymbolSubtracted === chainNameInputValue
              || option.placeholder);
          }
        })
        .map((option) => {
          if ((option as Token).symbol) {
            option = (option as Token);
            return m(InputTokenOptionComponent, {
              id: `${option.chainId}`,
              iconImg: option.logoURI,
              text: option.name,
            });
          } else {
            option = (option as Chain);
            return m(InputTokenOptionComponent, {
              id: option.id,
              iconImg: option.img,
              text: option.name,
            });
          }
        });
    }
    return m('ul.InputTokenList', {
      class: `${
        hidden ? 'hidden' : ''
      } absolute left-0 right-0 shadow-xl bg-white rounded top-full mt-16 text-xl p-3 z-10`,
      id: 'tokens-list',
    }, stillLoadingTokens ? [ m(Spinner, { active: true }) ] : vnode.state.options);
  },
};

export default InputTokenList;
