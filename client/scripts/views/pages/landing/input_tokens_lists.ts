/* eslint-disable operator-assignment */
import { Spinner } from 'construct-ui';
import m from 'mithril';
import InputTokenOptionComponent from './input_token_option';
import { Chain, Token } from './index';

interface IAttrs {
  optionList: (Token | Chain)[];
  maxOptions: number;
  inputValue: string;
  stillLoadingTokens: boolean;
  refilterResults: boolean;
}

const InputTokenList: m.Component<
  IAttrs,
  { options: any[]; oldValue: string; index: number; liSelected: any }
> = {
  view: (vnode) => {
    vnode.state.index = 0;
    const { optionList, refilterResults, inputValue, stillLoadingTokens } =      vnode.attrs;
    if (inputValue.length < 3) return;
    const { oldValue } = vnode.state;
    const chainNameInputValue = inputValue.toLowerCase();
    if (refilterResults && inputValue !== vnode.state.oldValue) {
      vnode.state.oldValue = inputValue;
      vnode.state.options = (
        inputValue.includes(oldValue) && !!oldValue
          ? vnode.state.options
          : optionList
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
            tokenNameSubtracted === chainNameInputValue
            || tokenSymbolSubtracted === chainNameInputValue
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
            chainNameSubtracted === chainNameInputValue
            || chainSymbolSubtracted === chainNameInputValue
            || option.placeholder
          );
        }
      });
    }
    const renderResults = (option) => {
      if ((option as Token).symbol) {
        option = option as Token;
        return m(InputTokenOptionComponent, {
          route: option.address,
          iconImg: option.logoURI,
          text: option.name,
        });
      } else {
        option = option as Chain;
        return m(InputTokenOptionComponent, {
          route: option.id,
          iconImg: option.img,
          text: option.name,
        });
      }
    };
    if (!vnode.state.options) return;

    const addClass = (el, className) => {
      if (el.classList) {
        el.classList.add(className);
      } else {
        el.className += ` ${className}`;
      }
    };

    const removeClass = (el, className) => {
      if (el.classList) {
        el.classList.remove(className);
      } else {
        el.className = el.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'),
          ' '
        );
      }
    };

    const ul = document.getElementById('tokens-list');
    document.addEventListener(
      'keydown',
      (event) => {
        if (ul) {
          const len = ul.getElementsByTagName('li').length - 1;
          if (event.key === 'ArrowDown') {
            vnode.state.index = vnode.state.index + 1;
            if (vnode.state.liSelected) {
              removeClass(vnode.state.liSelected, 'selected');
              const next = ul.getElementsByTagName('li')[vnode.state.index];

              if (typeof next !== 'undefined' && vnode.state.index <= len) {
                vnode.state.liSelected = next;
              } else {
                vnode.state.index = 1;
                vnode.state.liSelected = ul.getElementsByTagName('li')[1];
              }
              addClass(vnode.state.liSelected, 'selected');
            } else {
              vnode.state.index = 1;

              vnode.state.liSelected = ul.getElementsByTagName('li')[1];

              addClass(vnode.state.liSelected, 'selected');
            }
          }
          if (event.key === 'ArrowUp') {
            if (vnode.state.liSelected) {
              removeClass(vnode.state.liSelected, 'selected');
              vnode.state.index = vnode.state.index - 1;

              const next = ul.getElementsByTagName('li')[vnode.state.index];
              if (typeof next !== 'undefined' && vnode.state.index >= 1) {
                vnode.state.liSelected = next;
              } else {
                vnode.state.index = len;
                vnode.state.liSelected = ul.getElementsByTagName('li')[len];
              }
              addClass(vnode.state.liSelected, 'selected');
            } else {
              vnode.state.index = 1;
              vnode.state.liSelected = ul.getElementsByTagName('li')[len];
              addClass(vnode.state.liSelected, 'selected');
            }
          }
        }
      },
      false
    );

    return m(
      'ul.InputTokenList',
      {
        class:
          'absolute left-0 right-0 shadow-xl bg-white rounded top-full mt-16 text-xl p-3 z-10',
        id: 'tokens-list',
        style: 'overflow-y: scroll; max-height: 16rem;',
      },
      stillLoadingTokens
        ? [m(Spinner, { active: true })]
        : vnode.state.options
          .slice(0, vnode.attrs.maxOptions)
          .map(renderResults)
    );
  },
};

export default InputTokenList;
