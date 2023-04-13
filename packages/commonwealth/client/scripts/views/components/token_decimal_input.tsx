/* @jsx m */

import ClassComponent from 'class_component';

import 'components/token_decimal_input.scss';

import { tokensToWei, weiToTokens } from 'helpers';
import m from 'mithril';
import { CWText } from './component_kit/cw_text';
import { CWTextInput } from './component_kit/cw_text_input';
import { CWToggle } from './component_kit/cw_toggle';

type TokenDecimalInputAttrs = {
  decimals: number;
  defaultValueInWei: string;
  onInputChange: (valueInWei: string) => void;
};

export class TokenDecimalInput extends ClassComponent<TokenDecimalInputAttrs> {
  private displayValue: string;
  private isInputInWei: boolean;
  private switchCaption: string;
  private valueInWei: string;

  oninit(vnode: m.Vnode<TokenDecimalInputAttrs>) {
    const { defaultValueInWei, decimals } = vnode.attrs;

    this.valueInWei = defaultValueInWei || '0';
    this.displayValue = weiToTokens(this.valueInWei, decimals);
    this.isInputInWei = false;
    this.switchCaption = `Using ${decimals} decimal precision`;
  }

  view(vnode: m.Vnode<TokenDecimalInputAttrs>) {
    const { onInputChange, decimals } = vnode.attrs;

    return (
      <div class="TokenDecimalInput">
        <CWTextInput
          value={this.displayValue}
          // type: 'number',
          oninput={(v) => {
            v.preventDefault();
            // restrict it to numerical input
            const wholeNumberTest = /^[1-9]\d*$/;
            const decimalTest = /^\d+\.?\d*$/;
            if (
              v.target.value === '' ||
              v.target.value === '0' ||
              (this.isInputInWei ? wholeNumberTest : decimalTest).test(
                v.target.value
              )
            ) {
              const inputNumber = v.target.value;
              this.displayValue = inputNumber;
              try {
                this.valueInWei = this.isInputInWei
                  ? inputNumber
                  : tokensToWei(inputNumber, decimals);
                onInputChange(this.valueInWei);
              } catch (err) {
                console.log(`Input conversion failed: ${v.target.value}`);
              }
            } else {
              console.log(`Invalid input string: ${v.target.value}`);
            }
          }}
        />
        {decimals > 0 && (
          <div class="token-settings">
            <CWToggle
              checked={!this.isInputInWei}
              onchange={() => {
                this.isInputInWei = !this.isInputInWei;
                if (this.isInputInWei) {
                  this.switchCaption = 'Using base token value';
                  // token -> wei
                  this.displayValue = tokensToWei(this.displayValue, decimals);
                } else {
                  this.switchCaption = `Using ${decimals} decimal precision`;
                  // wei -> token
                  this.displayValue = weiToTokens(this.displayValue, decimals);
                }
              }}
            />
            <CWText type="caption" className="toggle-caption-text">
              {this.switchCaption}
            </CWText>
          </div>
        )}
      </div>
    );
  }
}
