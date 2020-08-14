import m from 'mithril';
import { List, ListItem, PopoverMenu, MenuItem, Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { AddressInfo } from 'models';
import { UserBlock } from 'views/components/widgets/user';
import ManageCommunityModal from 'views/modals/manage_community_modal';

const AdminsModule: m.Component<{}> = {
  view: (vnode) => {
    const adminsAndMods = (app.chain ? app.chain.meta.chain : app.community.meta).adminsAndMods;
    if (adminsAndMods.length === 0) return; // for now, hide the admin module if there are no admins

    return m('.AdminsModule.SidebarModule', [
      m(List, { interactive: false }, [
        m(ListItem, {
          label: 'Admins & Mods',
        }),
      ]),
      adminsAndMods.length > 0 && m(List, { class: 'community-admins' }, adminsAndMods.map((r) => {
        return m(ListItem, {
          class: 'community-admin',
          label: m(UserBlock, { user: new AddressInfo(r.id, r.address, r.address_chain, null), showRole: true })
        });
      })),
    ]);
  }
};

export default AdminsModule;
