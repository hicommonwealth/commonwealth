/* @jsx m */

import m from 'mithril';
import { Switch, Input } from 'construct-ui';

import 'components/token_decimal_input.scss';

import { weiToTokens, tokensToWei } from 'helpers';
import { CWText } from './component_kit/cw_text';

export class TokenDecimalInput
  implements
    m.ClassComponent<{
      decimals: number;
      defaultValueInWei: string;
      onInputChange: (valueInWei: string) => void;
    }>
{
  private displayValue: string;
  private isInputInWei: boolean;
  private switchCaption: string;
  private valueInWei: string;

  oninit(vnode) {
    const { defaultValueInWei } = vnode.attrs;

    this.valueInWei = defaultValueInWei || '0';
    this.displayValue = this.valueInWei;
    this.isInputInWei = true;
    this.switchCaption = 'Using base token value';
  }

  view(vnode) {
    const { onInputChange, decimals } = vnode.attrs;

    return (
      <div class="TokenDecimalInput">
        <Input
          title=""
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
            <Switch
              title=""
              defaultValue={this.isInputInWei}
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
            <CWText>{this.switchCaption}</CWText>
          </div>
        )}
      </div>
    );
  }
}
