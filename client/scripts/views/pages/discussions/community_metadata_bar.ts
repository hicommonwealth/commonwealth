import 'pages/discussions/community_metadata_bar.scss';

import { slugify, removeUrlPrefix } from 'helpers';
import m from 'mithril';
import { Icon, Icons } from 'construct-ui';

import app from 'state';
import { AddressInfo, AbridgedThread } from 'models';
import User from 'views/components/widgets/user';
import SubscriptionButton from 'views/components/sidebar/subscription_button';
import ManageCommunityModal from 'views/modals/manage_community_modal';

const CommunityMetadataBar: m.Component<{ entity: string }> = {
  view: (vnode) => {
    // const activeAddresses = app.recentActivity.getMostActiveUsers();
    // const activeThreads = app.recentActivity.getMostActiveThreads(entity);
    // available: thread.title, thread.address, thread.authorChain, ...
    //   m.route.set(`/${app.activeId()}/proposal/${thread.slug}/${thread.identifier}-${slugify(thread.title)}`);

    if (!app.chain && !app.community) return;
    const isAdmin = app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    });

    const meta = app.chain ? app.chain.meta.chain : app.community.meta;
    const { name, description, website, chat, telegram, github, introTitle, introText } = meta;

    return m('.CommunityMetadataBar', [
      m('h2', [
        introTitle || name,
      ]),
      m('p', [
        introText || 'Use this forum to discuss projects, make proposals, and share with the community.',
      ]),
      (website || chat || telegram || github || isAdmin) && m('p', [
        website && m('.community-info', [
          m(Icon, { name: Icons.GLOBE }),
          m('a.community-info-text', {
            target: '_blank',
            href: website
          }, removeUrlPrefix(website)),
        ]),
        chat && m('.community-info', [
          m(Icon, { name: Icons.MESSAGE_SQUARE }),
          m('a.community-info-text', {
            target: '_blank',
            href: chat
          }, removeUrlPrefix(chat)),
        ]),
        telegram && m('.community-info', [
          m(Icon, { name: Icons.SEND }),
          m('a.community-info-text', {
            target: '_blank',
            href: telegram
          }, removeUrlPrefix(telegram)),
        ]),
        github && m('.community-info', [
          m(Icon, { name: Icons.GITHUB }),
          m('a.community-info-text', {
            target: '_blank',
            href: github
          }, removeUrlPrefix(github)),
        ]),
        isAdmin && m('.community-info', [
          m('a.community-info-text', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({ modal: ManageCommunityModal });
            }
          }, 'Manage community'),
        ]),
      ])

      // activeAddresses.length > 0
      // && m('.user-activity', [
      //   m('.user-activity-header', 'Active members'),
      //   m('.active-members', activeAddresses.map((user) => {
      //     return m(User, {
      //       user: user.info,
      //       avatarSize: 24,
      //       avatarOnly: true,
      //       linkify: true,
      //       popover: true,
      //     });
      //     // TODO: show user.count
      //   })),
      // ]),
      // m('.admins-mods', [
      //   m('.admins-mods-header', 'Admins and mods'),
      //   (app.chain || app.community) && m('.active-members', [
      //     (app.chain ? app.chain.meta.chain : app.community.meta).adminsAndMods.map((role) => {
      //       return m(User, {
      //         user: new AddressInfo(null, role.address, role.address_chain, null),
      //         avatarSize: 24,
      //         avatarOnly: true,
      //         linkify: true,
      //         popover: true,
      //       });
      //     }),
      //   ]),
      // ]),
    ]);
  }
};

export default CommunityMetadataBar;
