import m from 'mithril';
import InputTokenOptionComponent from './input_token_option';

interface Chain {
    img: string;
    id: string;
    name: string;
    placeholder?: boolean;
    chainInfo: string;
}

interface IAttrs {
  optionList: Chain[];
  hidden: boolean;
  maxOptions: number;
  inputValue: string;
}

const InputTokenList: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    // eslint-disable-next-line array-callback-return
    const options = vnode.attrs.optionList.map((option, index) => {
      if (index >= vnode.attrs.maxOptions) return;

      const tokenNameSubstracted = option.id.substr(0, vnode.attrs.inputValue.length);
      const tokenNameInputValue = vnode.attrs.inputValue;

      if (tokenNameSubstracted === tokenNameInputValue || option.placeholder) {
        return m(InputTokenOptionComponent, {
          id: option.id,
          iconImg: option.img,
          text: option.name,
        });
      }
    }).filter((option: any) => option);

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
