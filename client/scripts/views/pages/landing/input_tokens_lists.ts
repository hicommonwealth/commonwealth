import m from 'mithril';
import InputTokenOptionComponent from './input_token_option';

interface Chain {
  tokenImg: string;
  tokenName: string;
  placeholder?: boolean;
}

interface IAttrs {
  optionList: Chain[];
  hidden: boolean;
  maxOptions: number;
  inputValue: string;
}

const InputTokenList: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    const options = vnode.attrs.optionList.map((option, index) => {
      if (index >= vnode.attrs.maxOptions) return;

      const tokenNameSubstracted = option.tokenName.substr(0, vnode.attrs.inputValue.length);
      const tokenNameInputValue = vnode.attrs.inputValue;

      if (tokenNameSubstracted === tokenNameInputValue || option.placeholder) {
        return m(InputTokenOptionComponent, {
          iconImg: option.tokenImg,
          text: option.tokenName,
        });
      }
    });

    return m(
      'ul',
      {
        class: `${
          vnode.attrs.hidden ? 'hidden' : ''
        } absolute left-0 right-0 shadow-xl bg-white rounded top-full mt-16 text-xl p-3 z-10`,
        id: 'tokens-list',
      },
      options
    );
  },
};

export default InputTokenList;
