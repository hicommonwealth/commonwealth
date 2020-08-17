import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import dragula from 'dragula';
import { Button, Callout, List, ListItem, PopoverMenu, MenuItem, Icon, Icons, Tag, Spinner } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase, AddressInfo } from 'models';
import NewTopicModal from 'views/modals/new_topic_modal';
import EditTopicModal from 'views/modals/edit_topic_modal';

import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';
import CommunitySelector, { CommunityLabel } from './community_selector';
import CommunityInfoModule from './community_info_module';

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
        // m(ListItem, {
        //   class: 'section-header',
        //   label: 'Off-chain',
        // }),
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

const TopicsModule: m.Component<{}, { dragulaInitialized: boolean }> = {
  view: (vnode) => {
    const featuredTopics = {};
    const otherTopics = {};
    const featuredTopicIds = app.community?.meta?.featuredTopics || app.chain?.meta?.chain?.featuredTopics;

    const getTopicRow = (id, name, description) => m(ListItem, {
      key: id,
      contentLeft: m('.proposal-topic-icon'),
      contentRight: m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name)}`
        && app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
        && m(PopoverMenu, {
          class: 'sidebar-edit-topic',
          position: 'bottom',
          transitionDuration: 0,
          hoverCloseDelay: 0,
          closeOnContentClick: true,
          trigger: m(Icon, {
            name: Icons.CHEVRON_DOWN,
          }),
          content: m(MenuItem, {
            label: 'Edit topic',
            onclick: (e) => {
              app.modals.create({
                modal: EditTopicModal,
                data: { description, id, name }
              });
            }
          })
        }),
      label: [
        name,
      ],
      active: m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name)}`,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}/discussions/${name}`);
      },
    });

    app.topics.getByCommunity(app.activeId()).forEach((topic) => {
      const { id, name, description } = topic;
      if (featuredTopicIds.includes(`${topic.id}`)) {
        featuredTopics[topic.name] = { id, name, description, featured_order: featuredTopicIds.indexOf(`${id}`) };
      } else {
        otherTopics[topic.name] = { id, name, description };
      }
    });
    const otherTopicListItems = Object.keys(otherTopics)
      .sort((a, b) => otherTopics[a].name.localeCompare(otherTopics[b].name))
      .map((name, idx) => getTopicRow(otherTopics[name].id, name, otherTopics[name].description));
    const featuredTopicListItems = Object.keys(featuredTopics)
      .sort((a, b) => Number(featuredTopics[a].featured_order) - Number(featuredTopics[b].featured_order))
      .map((name, idx) => getTopicRow(featuredTopics[name].id, name, featuredTopics[name].description));

    return m('.TopicsModule.SidebarModule', [
      m(List, { size: 'lg' }, [
        m(ListItem, {
          class: 'section-header',
          label: 'Discussion Topics',
          contentRight: app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
            && m(PopoverMenu, {
              class: 'sidebar-add-topic',
              position: 'bottom',
              transitionDuration: 0,
              hoverCloseDelay: 0,
              closeOnContentClick: true,
              trigger: m(Icon, { name: Icons.CHEVRON_DOWN }),
              content: m(MenuItem, {
                label: 'New topic',
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.create({ modal: NewTopicModal });
                }
              }),
            }),
        }),
        featuredTopicListItems.length === 0 && otherTopicListItems.length === 0 && [
          app.threads.initialized
            ? m(ListItem, {
              class: 'section-callout',
              label: m(Callout, {
                size: 'sm',
                intent: 'primary',
                icon: Icons.ALERT_TRIANGLE,
                content: 'The admin has not configured this community with topics yet',
              }),
            })
            : m(ListItem, {
              class: 'section-callout',
              label: m('div', { style: 'text-align: center' }, m(Spinner, { active: true, size: 'xs' })),
            }),
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
              await app.community.meta.updateFeaturedTopics(reorder);
            });
          }
        }
      }, featuredTopicListItems),
      m(List, { size: 'lg', class: 'more-topics-list' }, otherTopicListItems),
    ]);
  }
};

const SettingsModule: m.Component<{}> = {
  view: (vnode) => {
    return m('.SettingsModule.SidebarModule', [
      m(List, { size: 'lg' }, [
        m(ListItem, {
          label: 'Settings',
          class: 'section-header',
        }),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.USER }),
          label: 'Account Settings',
          onclick: (e) => m.route.set(
            app.activeId()
              ? `/${app.activeId()}/settings`
              : '/settings'
          ),
          active: app.activeId()
            ? m.route.get() === `/${app.activeId()}/settings`
            : m.route.get() === '/settings',
        }),
        app.activeId() && m(ListItem, {
          contentLeft: m(Icon, { name: Icons.BELL }),
          label: 'Notifications',
          onclick: (e) => m.route.set(
            app.activeId()
              ? `/${app.activeId()}/notification-settings`
              : '/notification-settings'
          ),
          active: app.activeId()
            ? m.route.get() === `/${app.activeId()}/notification-settings`
            : m.route.get() === '/notification-settings',
        }),
        app.activeId() && m(ListItem, {
          contentLeft: m(Icon, { name: Icons.BELL }),
          label: 'Chain Notifications',
          onclick: (e) => m.route.set(
            app.activeId()
              ? `/${app.activeId()}/chain-event-settings`
              : '/chain-event-settings'
          ),
          active: app.activeId()
            ? m.route.get() === `/${app.activeId()}/chain-event-settings`
            : m.route.get() === '/chain-event-settings',
        }),
      ]),
    ]);
  }
};


const MobileSidebarHeader: m.Component<{ parentVnode }> = {
  view: (vnode) => {
    const { parentVnode } = vnode.attrs;
  }
};

const Sidebar: m.Component<{}, { open: boolean }> = {
  view: (vnode) => {
    return [
      m('.MobileSidebarHeader', {
        onclick: (e) => {
          // clicking anywhere outside the trigger should close the sidebar
          const onTrigger = $(e.target).hasClass('mobile-sidebar-trigger')
            || $(e.target).closest('.mobile-sidebar-trigger').length > 0;
          if (!onTrigger && vnode.state.open) vnode.state.open = false;
        },
      }, [
        m('.mobile-sidebar-left', [
          m(Button, {
            class: 'mobile-sidebar-trigger',
            compact: true,
            onclick: (e) => {
              vnode.state.open = !vnode.state.open;
            },
            label: m(Icon, { name: Icons.MENU }),
          }),
          m('.community-label', m(CommunitySelector)),
          app.isLoggedIn() && m(NotificationsMenu, { small: false }),
          m(LoginSelector, { small: false }),
        ]),
      ]),
      m('.Sidebar', {
        class: vnode.state.open ? 'open' : '',
        onclick: (e) => {
          // clicking inside the sidebar should close the sidebar
          vnode.state.open = false;
        },
      }, [
        m('.SidebarHeader', m(CommunitySelector)),
        (app.chain || app.community) && m(NavigationModule),
        (app.chain || app.community) && m(TopicsModule),
        app.isLoggedIn() && m(SettingsModule),
        (app.chain || app.community) && m(CommunityInfoModule),
      ])
    ];
  },
};

export default Sidebar;
