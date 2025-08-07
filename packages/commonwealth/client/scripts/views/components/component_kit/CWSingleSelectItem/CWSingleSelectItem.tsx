import { CopySimple } from '@phosphor-icons/react';
import { formatAddressShort } from 'client/scripts/helpers';
import React from 'react';
import { SingleValueProps } from 'react-select';
import { CWIcon } from '../../cw_icons/cw_icon';
import './CWSingleSelectItem.scss';
type CustomSingleValueProps = {
  showCopyIcon?: boolean;
  // eslint-disable-next-line prettier/prettier
  saveToClipboard?: (
    id: string,
    successNotification?: boolean,
  ) => Promise<void>;
};

type OptionProps = {
  value: string;
  label: string;
};

export const CWSingleSelectItem = (
  props: SingleValueProps<OptionProps> & CustomSingleValueProps,
) => {
  const { data, showCopyIcon = false, saveToClipboard } = props;

  const handleClickToCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (saveToClipboard) {
      await saveToClipboard(data.value, true);
    }
  };

  return (
    <div className="CWSingleSelectItem">
      {showCopyIcon && (
        <div className="inner-container">
          <CWIcon
            className="check-icon"
            iconSize="small"
            iconName="checkCircleFilled"
          />
          {formatAddressShort(data.label, 6)}
        </div>
      )}
      {showCopyIcon && (
        <CopySimple
          size={20}
          onMouseDown={(event) => {
            void handleClickToCopy(event);
          }}
        />
      )}
    </div>
  );
};
