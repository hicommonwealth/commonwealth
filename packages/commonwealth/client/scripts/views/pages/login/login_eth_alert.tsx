import 'pages/login/login_eth_alert.scss';
import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

export const LoginEthAlert = () => {
  return (
    <div className="LoginEthAlert">
      <CWIcon iconName="cautionTriangle" iconSize="xl" />
      <CWText type="h4" fontWeight="semiBold" className="login-eth-alert-text">
        This Community requires an Ethereum wallet
      </CWText>
    </div>
  );
};
