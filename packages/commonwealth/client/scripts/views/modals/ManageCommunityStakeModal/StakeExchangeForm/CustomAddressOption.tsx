import React from 'react';
import { components, OptionProps } from 'react-select';

import { formatAddressShort } from 'helpers';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import './CustomAddressOption.scss';

interface CustomAddressOptionElement {
  value: string;
  label: string;
  selectedAddressValue: string;
}

const CustomAddressOptionElement = ({
  value,
  label,
  selectedAddressValue,
}: CustomAddressOptionElement) => {
  return (
    <div className="CustomAddressOptionElement">
      {value === selectedAddressValue && (
        <CWIcon
          className="check-icon"
          iconSize="small"
          weight="fill"
          iconName="checkCircleFilled"
        />
      )}
      {formatAddressShort(label, 6)}
    </div>
  );
};

interface CustomAddressOptionProps {
  originalProps: OptionProps<{ value: string; label: string }>;
  selectedAddressValue: string;
}

// eslint-disable-next-line react/no-multi-comp
const CustomAddressOption = ({
  originalProps,
  selectedAddressValue,
}: CustomAddressOptionProps) => {
  const { data, label } = originalProps;

  return (
    // @ts-expect-error <StrictNullChecks/>
    <components.Option {...originalProps}>
      <CustomAddressOptionElement
        value={data.value}
        label={formatAddressShort(label, 6)}
        selectedAddressValue={selectedAddressValue}
      />
    </components.Option>
  );
};

export { CustomAddressOption, CustomAddressOptionElement };
