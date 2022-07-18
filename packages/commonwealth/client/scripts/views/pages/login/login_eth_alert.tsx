/* @jsx m */

import m from 'mithril';

import 'pages/login/login_eth_alert.scss';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';

export class LoginEthAlert implements m.ClassComponent {
  view() {
    return (
      <div class="LoginEthAlert">
        <CWIcon iconName="cautionTriangle" iconSize="xl" />
        <CWText
          type="h4"
          fontWeight="semiBold"
          className="login-eth-alert-text"
        >
          This Community requires an Ethereum wallet
        </CWText>
      </div>
    );
  }
}
