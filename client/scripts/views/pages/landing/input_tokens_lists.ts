import { Spinner } from 'construct-ui';
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
  stillLoadingTokens: boolean;
}

const InputTokenList: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    const { optionList, maxOptions, inputValue, hidden, stillLoadingTokens } = vnode.attrs;
    console.log(optionList);
    debugger
    const options = optionList
    // eslint-disable-next-line array-callback-return
      .map((option, index) => {
        if (index >= maxOptions) return;

        const tokenNameSubstracted = option.id
          .substr(0, inputValue.length)
          .toLowerCase();
        const tokenNameInputValue = inputValue.toLowerCase();

        if (tokenNameSubstracted === tokenNameInputValue || option.placeholder) {
          return m(InputTokenOptionComponent, {
            id: option.id,
            iconImg: option.img,
            text: option.name,
          });
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
