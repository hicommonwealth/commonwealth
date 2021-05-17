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

const InputTokenList: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    const { optionList, maxOptions, inputValue, hidden, stillLoadingTokens } = vnode.attrs;
    const chainNameInputValue = inputValue.toLowerCase();
    console.log(optionList);
    const options = optionList
    // eslint-disable-next-line array-callback-return
      .map((option, index) => {
        if (index >= maxOptions) return;
        if ((option as Token).logoURI) {
          option = (option as Token);
          const tokenNameSubtracted = option.name
            .substr(0, inputValue.length)
            .toLowerCase();
          const tokenSymbolSubtracted = option.symbol
            .substr(0, inputValue.length)
            .toLowerCase();
          if (tokenNameSubtracted === chainNameInputValue
            || tokenSymbolSubtracted === chainNameInputValue) {
            return m(InputTokenOptionComponent, {
              id: `${option.chainId}`,
              iconImg: option.logoURI,
              text: option.name,
            });
          }
        } else {
          option = (option as Chain);
          const chainNameSubstracted = option.id
            .substr(0, inputValue.length)
            .toLowerCase();
          const chainSymbolSubtracted = option.chainInfo.symbol
            .substr(0, inputValue.length)
            .toLowerCase();
          if (chainNameSubstracted === chainNameInputValue
            || chainSymbolSubtracted === chainNameInputValue
            || option.placeholder) {
            return m(InputTokenOptionComponent, {
              id: option.id,
              iconImg: option.img,
              text: option.name,
            });
          }
        }
      })
      .filter((option: any) => option);

    return m('InputTokenList.ul', {
      class: `${
        hidden ? 'hidden' : ''
      } absolute left-0 right-0 shadow-xl bg-white rounded top-full mt-16 text-xl p-3 z-10`,
      id: 'tokens-list',
    }, stillLoadingTokens ? [ m(Spinner, { active: true }) ] : options);
  },
};

export default InputTokenList;
