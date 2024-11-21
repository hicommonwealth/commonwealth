import clsx from 'clsx';
import React from 'react';
import { CWText, TextStyleProps } from '../component_kit/cw_text';
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
  console.log('x => ', {
    original: value,
    formatted: formattedValue,
  });

  return (
    <CWText className={clsx('FractionalValue', className)} {...rest}>
      {typeof formattedValue === 'string' ||
      typeof formattedValue === 'number' ? (
        formattedValue
      ) : (
        <>
          0.0
          <sub>{formattedValue.decimal0Count - 1}</sub>
          {formattedValue.valueAfterDecimal0s}
        </>
      )}
    </CWText>
  );
};

export default FractionalValue;
