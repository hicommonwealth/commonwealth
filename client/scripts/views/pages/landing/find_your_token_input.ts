import m from 'mithril';
import { Chain, Token } from './index';
import 'pages/landing/input_token_option.scss';
interface IAttrs {
  onchangeValue: (event: any, suggest: string) => void;
  onkeyupValue: (event: any) => void;
  optionList?: (Chain | Token)[];
}

interface IState {
  searchValue: string;
  suggestToken: string;
}

const FindYourTokenInputComponent: m.Component<IAttrs, IState> = {
  view: (vnode) => {
    if (!vnode.state.searchValue || vnode.state.searchValue === '') {
      localStorage.setItem('tokenInputText', 'false');
    }
    const suggestToken = (e: any) => {
      vnode.state.searchValue = e.target.value;
      if (!vnode.state.searchValue || vnode.state.searchValue === '') {
        localStorage.setItem('tokenInputText', 'false');
      }
      if (vnode.attrs.optionList.length > 0 && e.target.value.length >= 3) {
        const reg = new RegExp(
          e.target.value[0].toUpperCase() + e.target.value.substring(1)
        );
        // eslint-disable-next-line array-callback-return
        const suggest = vnode.attrs.optionList.filter((token) => {
          if (token.name.match(reg)) {
            return token;
          }
        });
        vnode.state.suggestToken = suggest[0] && suggest[0].name.toLowerCase();
      } else {
        vnode.state.suggestToken = null;
      }
      vnode.attrs.onchangeValue(e, vnode.state.suggestToken);
    };

    const handleTab = (e: any) => {
      if (e.target.value !== '') {
        localStorage.setItem('tokenInputText', 'true');
      }
      if (e.code === 'Tab') {
        vnode.state.searchValue = vnode.state.suggestToken;
        vnode.attrs.onchangeValue(e, vnode.state.suggestToken);
      }
    };

    return m('div', { class: 'relative' }, [
      m(
        'div',
        {
          class:
            'absolute mr-2 p-2 pt-3.5 text-gray-400 text-xl top-0 InputAddSuggest',
        },
        vnode.state.suggestToken
      ),
      m('input', {
        autocomplete: 'off',
        class: 'p-2 flex-grow mr-2 text-xl pt-3.5 focus:outline-none w-full',
        id: 'token-input',
        type: 'text',
        placeholder: 'Find your favorite token',
        value: vnode.state.searchValue ? vnode.state.searchValue : '',
        oninput: (e) => suggestToken(e),
        onkeydown: (e) => {
          handleTab(e);
          vnode.attrs.onkeyupValue(e);
        },
      }),
    ]);
  },
};

export default FindYourTokenInputComponent;
