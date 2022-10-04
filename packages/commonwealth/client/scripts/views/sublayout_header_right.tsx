/* @jsx m */

import m from 'mithril';

import 'sublayout_header_right.scss';

import app from 'state';
import {
  NewProposalButton,
  MobileNewProposalButton,
} from 'views/components/new_proposal_button';
import { ChainInfo } from 'models';
import { NotificationsMenu } from 'views/components/header/notifications_menu';
import { InvitesMenu } from 'views/components/header/invites_menu';
import { LoginSelector } from 'views/components/header/login_selector';
import { isWindowMediumSmallInclusive } from './components/component_kit/helpers';
import { CWButton } from './components/component_kit/cw_button';

type SublayoutHeaderRightAttrs = {
  chain: ChainInfo;
  showNewProposalButton?: boolean;
};

export class SublayoutHeaderRight
  implements m.ClassComponent<SublayoutHeaderRightAttrs>
{
  view(vnode) {
    const { chain, showNewProposalButton } = vnode.attrs;

    return (
      <div class="SublayoutHeaderRight">
        {/* threadOnly option assumes all chains have proposals beyond threads */}
        {showNewProposalButton &&
          (isWindowMediumSmallInclusive(window.innerWidth) ? (
            <MobileNewProposalButton />
          ) : (
            <NewProposalButton fluid={false} threadOnly={!chain} />
          ))}
        {app.isLoggedIn() && <NotificationsMenu />}
        {app.isLoggedIn() && <InvitesMenu />}
        <InvitesMenu />
        <LoginSelector />
        <CWButton
          onclick={async () => {
            try {
              await app.rules.refresh();
            } catch (e) {
              console.log(e);
            }
          }}
          label="r"
        />
        <CWButton
          onclick={async () => {
            try {
              // await app.rules.refresh();
              await app.rules.createRule({
                chain_id: 'edgeware',
                ruleSchema: {
                  AllowListRule: [
                    ['0xE58E375Cc657e434e6981218A356fAC756b98097'],
                  ],
                },
              });
            } catch (e) {
              console.log(e);
            }
          }}
          label="c"
        />
        <CWButton
          onclick={async () => {
            try {
              // await app.rules.refresh();
              await app.rules.deleteRule({
                chain_id: 'edgeware',
                rule_id: 8,
              });
            } catch (e) {
              console.log(e);
            }
          }}
          label="d"
        />
        <CWButton
          onclick={async () => {
            try {
              // await app.rules.refresh();
              await app.rules.editRule({
                chain_id: 'edgeware',
                rule_id: 6,
                updated_rule: {
                  AllowListRule: [
                    ['0x62BE9e2A1A1039cB245F143C58641e8021C868E7'],
                  ],
                },
              });
            } catch (e) {
              console.log(e);
            }
          }}
          label="e"
        />
        <CWButton
          onclick={async () => {
            try {
              // await app.rules.refresh();
              const outcome = await app.rules.addressPassesRule({
                rule_id: 8,
                address: '0xE58E375Cc657e434e6981218A356fAC756b98097',
              });
              console.log('outcome: ', outcome);
            } catch (e) {
              console.log(e);
            }
          }}
          label="ch"
        />
        <CWButton
          onclick={async () => {
            try {
              // await app.rules.refresh();
              const res = await app.rules.getRuleTypes();
              console.log(res);
            } catch (e) {
              console.log(e);
            }
          }}
          label="gt"
        />
      </div>
    );
  }
}
