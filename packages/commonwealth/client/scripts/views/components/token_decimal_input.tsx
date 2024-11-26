import React, { useEffect } from 'react';

import './token_decimal_input.scss';

import { tokensToWei, weiToTokens } from 'helpers';
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
    defaultValueInWei || '0',
  );
  const [isInputInWei, setIsInputInWei] = React.useState<boolean>(false);
  const [caption, setCaption] = React.useState<string>(
    `Using ${decimals} decimal precision`,
  );
  const [valueInWei, setValueInWei] = React.useState<string>(
    defaultValueInWei || '0',
  );

  useEffect(() => {
    if (isInputInWei) {
      setCaption('Using base token value');
      // token -> wei
      setDisplayValue(tokensToWei(displayValue, decimals));
    } else {
      setCaption(`Using ${decimals} decimal precision`);
      // wei -> token
      setDisplayValue(weiToTokens(displayValue, decimals));
    }
  }, [isInputInWei]);

  useEffect(() => {
    onInputChange(valueInWei);
  }, [valueInWei]);

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
                isInputInWei || !inputNumber
                  ? inputNumber
                  : tokensToWei(inputNumber, decimals),
              );
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
            disabled={!displayValue}
            checked={!isInputInWei}
            onChange={() => {
              setIsInputInWei(!isInputInWei);
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
