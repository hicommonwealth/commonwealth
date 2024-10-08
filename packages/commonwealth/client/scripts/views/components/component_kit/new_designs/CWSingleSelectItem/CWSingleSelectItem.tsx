import { CopySimple } from '@phosphor-icons/react';
import { formatAddressShort } from 'client/scripts/helpers';
import React from 'react';
import { SingleValueProps } from 'react-select';
import { CWIcon } from '../../cw_icons/cw_icon';
import './CWSingleSelectItem.scss';
type CustomSingleValueProps = {
  extraProp?: boolean;
  handleClickCopyClipboard?: (id: string) => void;
  showIcon?: boolean;
};

type OptionProps = {
  value: string;
  label: string;
};

export const CWSingleSelectItem = (
  props: SingleValueProps<OptionProps> & CustomSingleValueProps,
) => {
  const { data, extraProp = false, handleClickCopyClipboard } = props;
  const handleClickToCopy = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (handleClickCopyClipboard) {
      handleClickCopyClipboard(data.value);
    }
  };

  return (
    <div className="custom-single-value">
      {extraProp && (
        <div className="inner-container">
          <CWIcon
            className="check-icon"
            iconSize="small"
            iconName="checkCircleFilled"
          />
          {formatAddressShort(data.label, 6)}
        </div>
      )}
      {!extraProp && <span>{data.label}</span>}

      {extraProp && <CopySimple size={20} onMouseDown={handleClickToCopy} />}
    </div>
  );
};
