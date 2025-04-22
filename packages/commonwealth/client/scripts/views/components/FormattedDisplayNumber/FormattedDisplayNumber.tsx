import clsx from 'clsx';
import { formatDisplayNumber, FormatNumberOptions } from 'helpers/formatting';
import React from 'react';
import { CWText, TextStyleProps } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import FractionalValue from '../FractionalValue';

type FormattedDisplayNumberProps = {
  value: number | string | undefined | null;
  options?: FormatNumberOptions;
  tooltipContent?: string | number;
} & Omit<TextStyleProps, 'children'>; // Allow passing CWText props

const FormattedDisplayNumber = ({
  value,
  options,
  className,
  tooltipContent,
  ...textStyleProps
}: FormattedDisplayNumberProps) => {
  const formattedResult = formatDisplayNumber(value, options);

  const renderContent = () => {
    if (typeof formattedResult === 'object') {
      // Use the FractionalValue component when the result is an object
      const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
      // Pass original value to FractionalValue as it expects a number
      return (
        <FractionalValue
          value={num}
          className={className} // Pass className to FractionalValue
          {...textStyleProps} // Pass textStyleProps to FractionalValue
        />
      );
    }

    // Render as standard text if formattedResult is a string
    return (
      <CWText
        className={clsx('FormattedDisplayNumber', className)}
        {...textStyleProps}
      >
        {formattedResult}
      </CWText>
    );
  };

  if (tooltipContent) {
    return (
      <CWTooltip
        placement="bottom"
        content={tooltipContent.toString()} // Ensure content is string
        renderTrigger={(handleInteraction) => (
          <span
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          >
            {renderContent()}
          </span>
        )}
      />
    );
  }

  return renderContent();
};

export default FormattedDisplayNumber;
