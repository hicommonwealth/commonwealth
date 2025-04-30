import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import {
  CustomIconName,
  IconName,
} from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from 'views/components/component_kit/cw_text';

import './FundWalletItem.scss';

interface FundWalletItemProps {
  icon: IconName | CustomIconName;
  title: string;
  onClick?: () => void;
}

const FundWalletItem = ({ icon, title, onClick }: FundWalletItemProps) => {
  return (
    <div className="FundWalletItem" onClick={onClick}>
      <div className="icon-wrapper">
        <CWIcon iconName={icon} iconSize="large" />
      </div>
      <CWText type="b2" fontWeight="medium">
        {title}
      </CWText>
    </div>
  );
};

export { FundWalletItem };
