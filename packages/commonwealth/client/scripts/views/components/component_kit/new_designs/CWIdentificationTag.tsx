import { CustomIconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWCustomIcon } from 'views/components/component_kit/cw_icons/cw_custom_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { formatAddressShort } from 'helpers';
import React from 'react';

import 'components/component_kit/new_designs/CWIdentificationTag.scss';

interface CWIdentificationTagProps {
  iconLeft?: CustomIconName;
  iconRight?: boolean;
  address?: string;
  username?: string;
}

export const CWIdentificationTag = ({
  iconLeft,
  iconRight,
  address,
  username,
}: CWIdentificationTagProps) => {
  if (!address && !username) {
    return null;
  }

  return (
    <div className="CWIdentificationTag">
      {iconLeft && (
        <CWCustomIcon
          className="icon-left"
          iconName={iconLeft}
          iconSize="small"
        />
      )}
      <CWText className="label" type="b2" fontWeight="regular">
        {username || formatAddressShort(address, 6)}
      </CWText>
      {iconRight && (
        <CWCustomIcon
          className="icon-right"
          iconName="magic"
          iconSize="small"
        />
      )}
    </div>
  );
};
