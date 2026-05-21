import clsx from 'clsx';
import React from 'react';
import { CWText, TextStyleProps } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import './FractionalValue.scss';
import { formatFractionalValue } from './helpers';

type FractionalValueProps = {
  value: number;
  currencySymbol?: string;
  symbolLast?: boolean;
} & TextStyleProps;

const FractionalValue = ({
  value,
  className,
  currencySymbol,
  symbolLast = false,
  ...rest
}: FractionalValueProps) => {
  const formattedValue = formatFractionalValue(value);

  const renderValue = (content: React.ReactNode) => (
    <>
      {!symbolLast && currencySymbol}
      {content}
      {symbolLast && currencySymbol}
    </>
  );

  return (
    <CWText className={clsx('FractionalValue', className)} {...rest}>
      {typeof formattedValue === 'string' ||
      typeof formattedValue === 'number' ? (
        renderValue(formattedValue)
      ) : (
        <CWTooltip
          placement="bottom"
          content={`0.${Array.from({ length: formattedValue.decimal0Count })
            .map(() => `0`)
            .join('')}${formattedValue.valueAfterDecimal0s}`}
          renderTrigger={(handleInteraction) => (
            <span
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              {renderValue(
                <>
                  0.0
                  <sub>{formattedValue.decimal0Count - 1}</sub>
                  {formattedValue.valueAfterDecimal0s}
                </>,
              )}
            </span>
          )}
        />
      )}
    </CWText>
  );
};

export default FractionalValue;
