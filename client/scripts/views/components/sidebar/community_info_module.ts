import 'components/sidebar/community_info_module.scss';

import m from 'mithril';

import app from 'state';
import { Button, List, ListItem, PopoverMenu, MenuItem, Icon, Icons, Tag } from 'construct-ui';

const removeUrlPrefix = (url) => {
  return url.replace(/^https?:\/\//, '');
};

const CommunityInfoModule: m.Component<{ communityName: string, communityDescription: string, topic?: string }> = {
  view: (vnode) => {
    const { communityName, communityDescription, topic } = vnode.attrs;
    if (!app.chain && !app.community) return;

    const isAdmin = app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    });

    const meta = app.chain ? app.chain.meta.chain : app.community.meta;
    const { name, description, website, chat, telegram, github, introTitle, introText } = meta;

    return m('.CommunityInfoModule.SidebarModule', [
      m('.community-name', [
        m('.community-name-text', name),
      ]),
      m('.community-description', description),
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
    ]);
  }
};

export default CommunityInfoModule;
