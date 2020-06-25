import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import { List, ListItem, Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase } from 'models';
import AdminPanel from 'views/components/admin_panel';

const TagListings: m.Component<{}, {}> = {
  view: (vnode) => {
    const featuredTags = {};
    const otherTags = {};
    const featuredTagIds = app.community?.meta?.featuredTags || app.chain?.meta?.chain?.featuredTags;

    const getTagRow = (name, id) => m(ListItem, {
      key: id,
      contentLeft: m(Icon, { name: Icons.HASH }),
      label: name.toLowerCase(),
      selected: m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name)}`,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}/discussions/${name}`);
      },
    });

    app.tags.getByCommunity(app.activeId()).forEach((tag) => {
      const { id, name } = tag;
      if (featuredTagIds.includes(`${tag.id}`)) {
        featuredTags[tag.name] = { id, name, featured_order: featuredTagIds.indexOf(`${id}`) };
      } else {
        otherTags[tag.name] = { id, name };
      }
    });
    const otherTagListing = Object.keys(otherTags)
      .sort((a, b) => otherTags[a].name.localeCompare(otherTags[b].name))
      .map((name, idx) => getTagRow(name, otherTags[name].id));
    const featuredTagListing = Object.keys(featuredTags)
      .sort((a, b) => Number(featuredTags[a].featured_order) - Number(featuredTags[b].featured_order))
      .map((name, idx) => getTagRow(name, featuredTags[name].id));

    return [
      m(List, featuredTagListing),
      otherTagListing.length > 0 && m(List, { class: 'more-tags-list' }, otherTagListing),
    ];
  }
};

const Sidebar: m.Component<{ activeTag: string }, {
  startedMolochImports: boolean,
  UpdateDelegateModal: any,
  RagequitModal: any,
  TokenApprovalModal: any,
}> = {
  view: (vnode) => {
    const { activeTag } = vnode.attrs;
    const activeAccount = app.user.activeAccount;

    // chain menu
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.network]) {
        chains[n.chain.network].push(n);
      } else {
        chains[n.chain.network] = [n];
      }
    });

    // sidebar menu
    const substrateGovernanceProposals = (app.chain?.base === ChainBase.Substrate)
      ? ((app.chain as any).democracy.store.getAll().filter((p) => !p.completed && !p.passed).length
         + (app.chain as any).democracyProposals.store.getAll().filter((p) => !p.completed).length
         + (app.chain as any).council.store.getAll().filter((p) => !p.completed).length
         + (app.chain as any).treasury.store.getAll().filter((p) => !p.completed).length) : 0;
    const edgewareSignalingProposals = (app.chain?.class === ChainClass.Edgeware)
      ? (app.chain as any).signaling.store.getAll().filter((p) => !p.completed).length : 0;
    const allSubstrateGovernanceProposals = substrateGovernanceProposals + edgewareSignalingProposals;
    const cosmosGovernanceProposals = (app.chain?.base === ChainBase.CosmosSDK)
      ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;

    const showMolochMenuOptions = app.chain?.class === ChainClass.Moloch;
    if (showMolochMenuOptions && !vnode.state.startedMolochImports) {
      vnode.state.startedMolochImports = true;
      Promise.all([
        import(
          /* webpackMode: "lazy" */
          /* webpackChunkName: "moloch-delegate-modal" */
          '../../modals/update_delegate_modal'
        ),
        import(
          /* webpackMode: "lazy" */
          /* webpackChunkName: "moloch-ragequit-modal" */
          '../../modals/ragequit_modal'
        ),
        import(
          /* webpackMode: "lazy" */
          /* webpackChunkName: "moloch-token-modal" */
          '../../modals/token_approval_modal'
        ),
      ]).then(([ updateDelegateModal, ragequitModal, tokenApprovalModal ]) => {
        vnode.state.UpdateDelegateModal = updateDelegateModal;
        vnode.state.RagequitModal = ragequitModal;
        vnode.state.TokenApprovalModal = tokenApprovalModal;
      });
    }

    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`;
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`);
    const onTagsPage = (p) => p.startsWith(`/${app.activeId()}/tags`);
    const onChatPage = (p) => p.startsWith(`/${app.activeId()}/chat`);
    const onNotificationsPage = (p) => p.startsWith('/notifications');
    const onProposalPage = (p) => (
      p.startsWith(`/${app.activeChainId()}/proposals`)
        || p.startsWith(`/${app.activeChainId()}/signaling`)
        || p.startsWith(`/${app.activeChainId()}/treasury`)
        || p.startsWith(`/${app.activeChainId()}/proposal/referendum`)
        || p.startsWith(`/${app.activeChainId()}/proposal/councilmotion`)
        || p.startsWith(`/${app.activeChainId()}/proposal/democracyproposal`)
        || p.startsWith(`/${app.activeChainId()}/proposal/signalingproposal`)
        || p.startsWith(`/${app.activeChainId()}/proposal/treasuryproposal`));
    const onCouncilPage = (p) => p.startsWith(`/${app.activeChainId()}/council`);
    const onValidatorsPage = (p) => p.startsWith(`/${app.activeChainId()}/validators`);
    if (onNotificationsPage(m.route.get())) return;

    return m('.Sidebar', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'} `
        + `${(app.community || app.chain) ? 'active-community' : 'no-active-community'}`,
    }, (!app.community && !app.chain) ? [
      // no community
      m(List, { interactive: true }, [
        m('h4', 'Settings'),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.USER, }),
          label: 'Settings',
          onclick: (e) => m.route.set('/settings'),
        }),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.VOLUME_2, }),
          label: 'Notifications',
          onclick: (e) => m.route.set('/notification-settings'),
        }),
      ]),
    ] : [
      // discussions
      m(List, { interactive: true }, [
        m('h4', 'Discuss'),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.HOME }),
          active: onDiscussionsPage(m.route.get()),
          label: 'Home',
          onclick: (e) => m.route.set(`/${app.activeId()}`),
        }),
        m(TagListings),
      ]),
      // proposals
      (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate || showMolochMenuOptions)
        && m(List, { interactive: true }, [
          m('h4', 'Vote & Stake'),
          // proposals (substrate and cosmos only)
          !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate)
            && m(ListItem, {
              active: onProposalPage(m.route.get()),
              label: 'Proposals',
              onclick: (e) => m.route.set(`/${app.activeChainId()}/proposals`),
              contentRight: [
                allSubstrateGovernanceProposals > 0
                  && m(Tag, { rounded: true, label: allSubstrateGovernanceProposals }),
                cosmosGovernanceProposals > 0 && m(Tag, { rounded: true, label: cosmosGovernanceProposals }),
              ],
            }),
          // council (substrate only)
          !app.community && app.chain?.base === ChainBase.Substrate
            && m(ListItem, {
              active: onCouncilPage(m.route.get()),
              label: 'Council',
              onclick: (e) => m.route.set(`/${app.activeChainId()}/council`),
              contentRight: [], // TODO
            }),
          // validators (substrate and cosmos only)
          // !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate) &&
          //   m(ListItem, {
          //     contentLeft: m(Icon, { name: Icons.SHARE_2 }),
          //     active: onValidatorsPage(m.route.get()),
          //     label: 'Validators',
          //     onclick: (e) => m.route.set(`/${app.activeChainId()}/validators`),
          //   }),
          showMolochMenuOptions && m(ListItem, {
            onclick: (e) => {
              m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.MolochProposal });
            },
            label: 'New proposal',
            contentLeft: m(Icon, { name: Icons.FILE_PLUS }),
          }),
          showMolochMenuOptions && vnode.state.UpdateDelegateModal && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: vnode.state.UpdateDelegateModal,
            }),
            label: 'Update delegate key',
            contentLeft: m(Icon, { name: Icons.KEY }),
          }),
          showMolochMenuOptions && vnode.state.RagequitModal && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: vnode.state.RagequitModal,
            }),
            label: 'Rage quit',
            contentLeft: m(Icon, { name: Icons.FILE_MINUS }),
          }),
          showMolochMenuOptions && vnode.state.TokenApprovalModal && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: vnode.state.TokenApprovalModal,
            }),
            label: 'Approve tokens',
            contentLeft: m(Icon, { name: Icons.POWER }),
          }),
        ]),
      // manage
      m(List, { interactive: true }, [
        m('h4', 'Manage'),
        m(ListItem, {
          active: onMembersPage(m.route.get()),
          label: 'Members',
          onclick: (e) => m.route.set(`/${app.activeId()}/members/`),
        }),
        m(ListItem, {
          class: 'TagRow',
          active: m.route.get() === `/${app.activeId()}/tags/`,
          label: 'Tags',
          onclick: (e) => m.route.set(`/${app.activeId()}/tags/`),
        }),
        app.user.isRoleOfCommunity({
          role: 'admin',
          chain: app.activeChainId(),
          community: app.activeCommunityId()
        }) && m(AdminPanel),
      ]),
      // // chat (all communities)
      // m(ListItem, {
      //   active: onChatPage(m.route.get()),
      //   label: 'Chat',
      //   onclick: (e) => m.route.set(`/${app.activeId()}/chat`),
      // }),
    ]);
  },
};

export default Sidebar;
