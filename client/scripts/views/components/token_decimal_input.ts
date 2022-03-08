import 'components/token_decimal_input.scss';

import m from 'mithril';
import { Switch, Input } from 'construct-ui';
import { weiToTokens, tokensToWei } from 'helpers';

const TokenDecimalInput: m.Component<
  {
    decimals: number;
    defaultValueInWei: string;
    onInputChange: (valueInWei: string) => void;
  },
  {
    displayValue: string;
    valueInWei: string;
    isInputInWei: boolean;
    switchCaption: string;
  }
> = {
  oninit: (vnode) => {
    const { defaultValueInWei } = vnode.attrs;
    vnode.state.valueInWei = defaultValueInWei || '0';
    vnode.state.displayValue = vnode.state.valueInWei;
    vnode.state.isInputInWei = true;
    vnode.state.switchCaption = 'Using base token value';
  },
  view: (vnode) => {
    const { onInputChange, decimals } = vnode.attrs;
    return m('.TokenDecimalInput', [
      m(Input, {
        title: '',
        value: vnode.state.displayValue,
        // type: 'number',
        oninput: (v) => {
          v.preventDefault();
          // restrict it to numerical input
          const wholeNumberTest = /^[1-9]\d*$/;
          const decimalTest = /^\d+\.?\d*$/;
          if (
            v.target.value === '' ||
            v.target.value === '0' ||
            (vnode.state.isInputInWei ? wholeNumberTest : decimalTest).test(
              v.target.value
            )
          ) {
            const inputNumber = v.target.value;
            vnode.state.displayValue = inputNumber;
            try {
              vnode.state.valueInWei = vnode.state.isInputInWei
                ? inputNumber
                : tokensToWei(inputNumber, decimals);
              onInputChange(vnode.state.valueInWei);
            } catch (err) {
              console.log(`Input conversion failed: ${v.target.value}`);
            }
          } else {
            console.log(`Invalid input string: ${v.target.value}`);
          }
        },
      }),
      m('.token-settings', [
        m(Switch, {
          title: '',
          defaultValue: vnode.state.isInputInWei,
          onchange: () => {
            vnode.state.isInputInWei = !vnode.state.isInputInWei;
            if (vnode.state.isInputInWei) {
              vnode.state.switchCaption = 'Using base token value';
              // token -> wei
              vnode.state.displayValue = tokensToWei(
                vnode.state.displayValue,
                decimals
              );
            } else {
              vnode.state.switchCaption = `Using ${decimals} decimal precision`;
              // wei -> token
              vnode.state.displayValue = weiToTokens(
                vnode.state.displayValue,
                decimals
              );
            }
          },
        }),
        m('.switch-caption', vnode.state.switchCaption),
      ]),
    ]);
  },
};

export default TokenDecimalInput;
