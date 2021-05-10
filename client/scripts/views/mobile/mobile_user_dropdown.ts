import 'mobile/mobile_user_dropdown.scss';

import m from 'mithril';
import app from 'state';

import { getNewProposalMenu } from 'views/components/new_proposal_button';
import { LoginSelectorMenuLeft, LoginSelectorMenuRight } from 'views/components/header/login_selector';
import { Menu, MenuDivider } from 'construct-ui';

const MobileUserDropdown: m.Component<{}, {}> = {
  view: (vnode) => {
    const isPrivateCommunity = app.community?.meta.privacyEnabled;
    const activeAddressesWithRole = app.user.activeAccounts.filter((account) => {
      return app.user.getRoleInCommunity({
        account,
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      });
    });
    const activeAccountsByRole = app.user.getActiveAccountsByRole();
    const nAccountsWithoutRole = activeAccountsByRole.filter(([account, role], index) => !role).length;

    return m(Menu, { class: 'MobileUserDropdown' }, [
      m('.NewProposalMenu', getNewProposalMenu([], true)),
      m(MenuDivider),
      m(LoginSelectorMenuLeft, {
        activeAddressesWithRole, nAccountsWithoutRole, isPrivateCommunity
      }),
      m(MenuDivider),
      m(LoginSelectorMenuRight)
    ]);
  }
};

export default MobileUserDropdown;
