import React from 'react';
import { components, OptionProps } from 'react-select';

import { formatAddressShort } from 'helpers';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

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
    <div className="text-container">
      {value === selectedAddressValue && (
        <CWIcon
          className="check-icon"
          iconSize="small"
          iconName="checkCircleFilled"
        />
      )}
      {formatAddressShort(label, 6)}
    </div>
  );
};

interface CustomAddressOptionProps {
  originalProps: OptionProps<{ value: string; label: string }>;
  selectedAddress: { value: string; label: string };
}

// eslint-disable-next-line react/no-multi-comp
const CustomAddressOption = ({
  originalProps,
  selectedAddress,
}: CustomAddressOptionProps) => {
  const { data, label } = originalProps;

  return (
    <components.Option {...originalProps}>
      <CustomAddressOptionElement
        value={data.value}
        label={formatAddressShort(label, 6)}
        selectedAddressValue={selectedAddress.value}
      />
    </components.Option>
  );
};

export { CustomAddressOption, CustomAddressOptionElement };
