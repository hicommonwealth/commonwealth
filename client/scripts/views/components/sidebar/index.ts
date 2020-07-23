import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import dragula from 'dragula';
import { Callout, List, ListItem, PopoverMenu, MenuItem, Icon, Icons, Tag, Spinner } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase, AddressInfo } from 'models';
import NewTagModal from 'views/modals/new_tag_modal';
import EditTagModal from 'views/modals/edit_tag_modal';

import CommunitySelector from '../header/community_selector';

const NavigationModule: m.Component<{}, {}> = {
  view: (vnode) => {
    // // proposal counts
    // const substrateGovernanceProposals = (app.chain?.loaded && app.chain?.base === ChainBase.Substrate)
    //   ? ((app.chain as any).democracy.store.getAll().filter((p) => !p.completed && !p.passed).length
    //     + (app.chain as any).democracyProposals.store.getAll().filter((p) => !p.completed).length
    //     + (app.chain as any).council.store.getAll().filter((p) => !p.completed).length
    //     + (app.chain as any).treasury.store.getAll().filter((p) => !p.completed).length) : 0;
    // const edgewareSignalingProposals = (app.chain?.loaded && app.chain?.class === ChainClass.Edgeware)
    //   ? (app.chain as any).signaling.store.getAll().filter((p) => !p.completed).length : 0;
    // const allSubstrateGovernanceProposals = substrateGovernanceProposals + edgewareSignalingProposals;
    // const cosmosGovernanceProposals = (app.chain?.loaded && app.chain?.base === ChainBase.CosmosSDK)
    //   ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;
    // const molochProposals = (app.chain?.loaded && app.chain?.class === ChainClass.Moloch)
    //   ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;

    const hasProposals = app.chain && !app.community && (
      app.chain.base === ChainBase.CosmosSDK
        || app.chain.base === ChainBase.Substrate
        || app.chain.class === ChainClass.Moloch);
    const showMolochMenuOptions = app.user.activeAccount && app.chain?.class === ChainClass.Moloch;
    const showMolochMemberOptions = showMolochMenuOptions && (app.user.activeAccount as any)?.shares?.gtn(0);

    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`
      || p.startsWith(`/${app.activeId()}/proposal/discussion/`);
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
    const onNotificationsPage = (p) => p.startsWith('/notifications');
    if (onNotificationsPage(m.route.get())) return;

    return m('.NavigationModule.SidebarModule', [
      m(List, { size: 'lg' }, [
        m(ListItem, {
          class: 'section-header',
          label: 'Off-chain',
        }),
        m(ListItem, {
          active: onDiscussionsPage(m.route.get()),
          label: 'Discussions',
          onclick: (e) => m.route.set(`/${app.activeId()}`),
          contentLeft: m(Icon, { name: Icons.MESSAGE_CIRCLE }),
        }),
        hasProposals && [
          // proposals (substrate, cosmos, moloch only)
          m(ListItem, {
            active: onProposalPage(m.route.get()),
            label: 'Proposals',
            contentLeft: m(Icon, { name: Icons.CHECK_SQUARE }),
            onclick: (e) => m.route.set(`/${app.activeChainId()}/proposals`),
            // contentRight: [
            //   (app.chain?.base === ChainBase.Substrate)
            //     && m(Tag, {
            //       rounded: true,
            //       label: app.chain?.loaded ? allSubstrateGovernanceProposals : '-',
            //     }),
            //   (app.chain?.base === ChainBase.CosmosSDK) && m(Tag, {
            //     rounded: true,
            //     label: app.chain?.loaded ? cosmosGovernanceProposals : '-',
            //   }),
            //   (app.chain?.class === ChainClass.Moloch) && m(Tag, {
            //     rounded: true,
            //     label: app.chain?.loaded ? molochProposals : '-',
            //   }),
            // ],
          }),
          // council (substrate only)
          !app.community && app.chain?.base === ChainBase.Substrate
            && m(ListItem, {
              active: onCouncilPage(m.route.get()),
              label: 'Council',
              contentLeft: m(Icon, { name: Icons.AWARD }),
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
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => {
              m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.MolochProposal });
            },
            label: 'New proposal',
            contentLeft: m(Icon, { name: Icons.FILE_PLUS }),
          }),
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => app.modals.lazyCreate('update_delegate_modal', {
              account: app.user.activeAccount,
              delegateKey: (app.user.activeAccount as any).delegateKey,
            }),
            label: 'Update delegate key',
            contentLeft: m(Icon, { name: Icons.KEY }),
          }),
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => app.modals.lazyCreate('ragequit_modal', { account: app.user.activeAccount }),
            label: 'Rage quit',
            contentLeft: m(Icon, { name: Icons.FILE_MINUS }),
          }),
          showMolochMenuOptions && m(ListItem, {
            onclick: (e) => app.modals.lazyCreate('token_management_modal', {
              account: app.user.activeAccount,
              accounts: ((app.user.activeAccount as any).app.chain as any).ethAccounts,
              contractAddress: ((app.user.activeAccount as any).app.chain as any).governance.api.contractAddress,
              tokenAddress: ((app.user.activeAccount as any).app.chain as any).governance.api.tokenContract.address,
            }),
            label: 'Approve tokens',
            contentLeft: m(Icon, { name: Icons.POWER }),
          }),
        ],
      ]),
    ]);
  }
};

const TagsModule: m.Component<{}, { dragulaInitialized: boolean }> = {
  view: (vnode) => {
    const featuredTags = {};
    const otherTags = {};
    const featuredTagIds = app.community?.meta?.featuredTags || app.chain?.meta?.chain?.featuredTags;

    const getTagRow = (id, name, description) => m(ListItem, {
      key: id,
      contentLeft: m('.proposal-tag-icon'),
      contentRight: m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name)}` && [
        m(PopoverMenu, {
          class: 'sidebar-edit-tag',
          position: 'bottom',
          transitionDuration: 0,
          hoverCloseDelay: 0,
          closeOnContentClick: true,
          trigger: m(Icon, {
            name: Icons.CHEVRON_DOWN,
          }),
          content: m(MenuItem, {
            label: 'Edit tag',
            onclick: (e) => {
              app.modals.create({
                modal: EditTagModal,
                data: { description, id, name }
              });
            }
          })
        }),
      ],
      label: [
        name,
      ],
      active: m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name)}`,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}/discussions/${name}`);
      },
    });

    app.tags.getByCommunity(app.activeId()).forEach((tag) => {
      const { id, name, description } = tag;
      if (featuredTagIds.includes(`${tag.id}`)) {
        featuredTags[tag.name] = { id, name, description, featured_order: featuredTagIds.indexOf(`${id}`) };
      } else {
        otherTags[tag.name] = { id, name, description };
      }
    });
    const otherTagListItems = Object.keys(otherTags)
      .sort((a, b) => otherTags[a].name.localeCompare(otherTags[b].name))
      .map((name, idx) => getTagRow(otherTags[name].id, name, otherTags[name].description));
    const featuredTagListItems = Object.keys(featuredTags)
      .sort((a, b) => Number(featuredTags[a].featured_order) - Number(featuredTags[b].featured_order))
      .map((name, idx) => getTagRow(featuredTags[name].id, name, featuredTags[name].description));

    return m('.TagsModule.SidebarModule', [
      m(List, { size: 'lg' }, [
        m(ListItem, {
          class: 'section-header',
          label: 'Discussion Tags',
          contentRight: app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
            && m(PopoverMenu, {
              class: 'sidebar-add-tag',
              position: 'bottom',
              transitionDuration: 0,
              hoverCloseDelay: 0,
              closeOnContentClick: true,
              trigger: m(Icon, { name: Icons.CHEVRON_DOWN }),
              content: m(MenuItem, {
                label: 'New tag',
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.create({ modal: NewTagModal });
                }
              }),
            }),
        }),
        featuredTagListItems.length === 0 && otherTagListItems.length === 0 && [
          app.threads.initialized
            ? m(ListItem, {
              class: 'section-callout',
              label: m(Callout, {
                size: 'sm',
                intent: 'negative',
                icon: Icons.ALERT_TRIANGLE,
                content: 'This community has not been configured with tags yet',
              }),
            })
            : m('div', { style: 'text-align: center' }, [
              m(Spinner, { active: true, size: 'xs' })
            ]),
        ]
      ]),
      m(List, {
        size: 'lg',
        onupdate: (vvnode) => {
          if (app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
              && !vnode.state.dragulaInitialized) {
            vnode.state.dragulaInitialized = true;
            dragula([vvnode.dom]).on('drop', async (el, target, source) => {
              const reorder = Array.from(source.children).map((child) => {
                return (child as HTMLElement).id;
              });
              await app.community.meta.updateFeaturedTags(reorder);
            });
          }
        }
      }, featuredTagListItems),
      m(List, { size: 'lg', class: 'more-tags-list' }, otherTagListItems),
    ]);
  }
};

const SettingsModule: m.Component<{}> = {
  view: (vnode) => {
    return m('.SettingsModule.SidebarModule', [
      m(List, { size: 'lg' }, [
        m(ListItem, {
          label: 'Account',
          class: 'section-header',
        }),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.USER }),
          label: 'Settings',
          onclick: (e) => m.route.set('/settings'),
          active: m.route.get() === '/settings',
        }),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.VOLUME_2, }),
          label: 'Notifications',
          onclick: (e) => m.route.set('/notification-settings'),
          active: m.route.get() === '/notification-settings',
        }),
      ]),
    ]);
  }
};

const Sidebar: m.Component<{}> = {
  view: (vnode) => {
    return m('.Sidebar', [
      m('.SidebarHeader', m(CommunitySelector)),
      m(NavigationModule),
      (app.chain || app.community) && m(TagsModule),
      app.isLoggedIn() && m(SettingsModule),
    ]);
  },
};

export default Sidebar;
