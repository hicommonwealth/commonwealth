import 'components/token_decimal_input.scss';

import { tokensToWei, weiToTokens } from 'helpers';
import React from 'react';
import { CWText } from './component_kit/cw_text';
import { CWTextInput } from './component_kit/cw_text_input';
import { CWToggle } from './component_kit/cw_toggle';

type TokenDecimalInputProps = {
  decimals: number;
  defaultValueInWei: string;
  onInputChange: (valueInWei: string) => void;
};

export const TokenDecimalInput = (props: TokenDecimalInputProps) => {
  const { defaultValueInWei, onInputChange, decimals } = props;

  const [displayValue, setDisplayValue] = React.useState<string>(
    defaultValueInWei || '0'
  );
  const [isInputInWei, setIsInputInWei] = React.useState<boolean>(true);
  const [caption, setCaption] = React.useState<string>(
    'Using base token value'
  );
  const [valueInWei, setValueInWei] = React.useState<string>(
    defaultValueInWei || '0'
  );

  return (
    <div className="TokenDecimalInput">
      <CWTextInput
        value={displayValue}
        // type: 'number',
        onInput={(v) => {
          v.preventDefault();
          // restrict it to numerical input
          const wholeNumberTest = /^[1-9]\d*$/;
          const decimalTest = /^\d+\.?\d*$/;
          if (
            v.target.value === '' ||
            v.target.value === '0' ||
            (isInputInWei ? wholeNumberTest : decimalTest).test(v.target.value)
          ) {
            const inputNumber = v.target.value;

            setDisplayValue(inputNumber);

            try {
              setValueInWei(
                isInputInWei ? inputNumber : tokensToWei(inputNumber, decimals)
              );

              onInputChange(valueInWei);
            } catch (err) {
              console.log(`Input conversion failed: ${v.target.value}`);
            }
          } else {
            console.log(`Invalid input string: ${v.target.value}`);
          }
        }}
      />
      {decimals > 0 && (
        <div className="token-settings">
          <CWToggle
            checked={!isInputInWei}
            onChange={() => {
              setIsInputInWei(!isInputInWei);

              if (isInputInWei) {
                setCaption('Using base token value');
                // token -> wei
                setDisplayValue(tokensToWei(displayValue, decimals));
              } else {
                setCaption(`Using ${decimals} decimal precision`);
                // wei -> token
                setDisplayValue(weiToTokens(displayValue, decimals));
              }
            }}
          />
          <CWText type="caption" className="toggle-caption-text">
            {caption}
          </CWText>
        </div>
      )}
    </div>
  );
};
