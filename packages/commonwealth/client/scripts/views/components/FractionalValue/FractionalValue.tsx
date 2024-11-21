import clsx from 'clsx';
import React from 'react';
import { CWText, TextStyleProps } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import './FractionalValue.scss';
import { formatFractionalValue } from './helpers';

type FractionalValueProps = {
  value: number;
} & TextStyleProps;

const FractionalValue = ({
  value,
  className,
  ...rest
}: FractionalValueProps) => {
  const formattedValue = formatFractionalValue(value);

  return (
    <CWText className={clsx('FractionalValue', className)} {...rest}>
      {typeof formattedValue === 'string' ||
      typeof formattedValue === 'number' ? (
        formattedValue
      ) : (
        <CWTooltip
          placement="bottom"
          content={`0.${Array.from({ length: formattedValue.decimal0Count })
            .map((_) => `0`)
            .join('')}${formattedValue.valueAfterDecimal0s}`}
          renderTrigger={(handleInteraction) => (
            <span
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              0.0
              <sub>{formattedValue.decimal0Count - 1}</sub>
              {formattedValue.valueAfterDecimal0s}
            </span>
          )}
        />
      )}
    </CWText>
  );
};

export default FractionalValue;
