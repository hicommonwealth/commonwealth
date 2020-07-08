import 'components/new_proposal_button.scss';

import m from 'mithril';
import _ from 'lodash';
import { Button, ButtonGroup, Icons, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase } from 'models';
import NewThreadModal from 'views/modals/new_thread_modal';

const NewProposalButton: m.Component<{ fluid: boolean, dark?: boolean }> = {
  view: (vnode) => {
    const { fluid, dark } = vnode.attrs;
    const activeAccount = app.user.activeAccount;

    if (!app.isLoggedIn()) return;
    if (!app.chain && !app.community) return;
    if (!app.activeId()) return;

    // just a button for communities, or chains without governance
    if (app.community) {
      return m(Button, {
        class: dark ? 'NewProposalButton cui-button-dark' : 'NewProposalButton',
        label: 'New post',
        intent: 'primary',
        fluid,
        disabled: !activeAccount,
        size: 'sm',
        onclick: () => app.modals.create({ modal: NewThreadModal })
      });
    }

    const ProposalButtonGroup = m(ButtonGroup, [
      m(Button, {
        class: dark ? 'cui-button-dark' : '',
        disabled: !activeAccount,
        intent: 'primary',
        label: 'New post',
        fluid,
        size: 'sm',
        onclick: () => app.modals.create({ modal: NewThreadModal }),
      }),
      m(PopoverMenu, {
        class: 'NewProposalButton',
        transitionDuration: 0,
        hoverCloseDelay: 0,
        trigger: m(Button, {
          class: dark ? 'cui-button-dark' : '',
          disabled: !activeAccount,
          iconLeft: Icons.CHEVRON_DOWN,
          intent: 'primary',
          size: 'sm',
        }),
        position: 'bottom-end',
        closeOnContentClick: true,
        menuAttrs: {
          align: 'left',
        },
        content: [
          m(MenuItem, {
            onclick: () => { m.route.set(`/${app.activeId()}/new/thread`); },
            label: 'New post',
          }),
          (app.chain.base === ChainBase.CosmosSDK || app.chain.base === ChainBase.Substrate)
            && m(MenuDivider),
          app.chain.base === ChainBase.CosmosSDK && m(MenuItem, {
            onclick: (e) => m.route.set(`/${activeAccount.chain.id}/new/proposal/:type`, { type: ProposalType.CosmosProposal }),
            label: 'New proposal'
          }),
          app.chain.base === ChainBase.Substrate && activeAccount && activeAccount.chainClass === ChainClass.Edgeware && m(MenuItem, {
            onclick: () => { m.route.set(`/${activeAccount.chain.id}/new/signaling`); },
            label: 'New signaling proposal'
          }),
          app.chain.base === ChainBase.Substrate && m(MenuItem, {
            onclick: (e) => m.route.set(`/${activeAccount.chain.id}/new/proposal/:type`, { type: ProposalType.SubstrateTreasuryProposal }),
            label: 'New treasury proposal'
          }),
          app.chain.base === ChainBase.Substrate && m(MenuItem, {
            onclick: (e) => m.route.set(`/${activeAccount.chain.id}/new/proposal/:type`, { type: ProposalType.SubstrateDemocracyProposal }),
            label: 'New democracy proposal'
          }),
          app.chain.base === ChainBase.Substrate && m(MenuItem, {
            class: activeAccount && (activeAccount as any).isCouncillor ? '' : 'disabled',
            onclick: (e) => m.route.set(`/${activeAccount.chain.id}/new/proposal/:type`, { type: ProposalType.SubstrateCollectiveProposal }),
            label: 'New council motion'
          }),
        ],
      }),
    ]);

    // a button with popover menu for chains
    return ProposalButtonGroup;
  }
};

export default NewProposalButton;
