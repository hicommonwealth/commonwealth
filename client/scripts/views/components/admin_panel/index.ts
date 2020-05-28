import m from 'mithril';
import { Dialog, Icon, Icons, ListItem } from 'construct-ui';

import 'components/admin_panel.scss';
import AdminPanelContents from './admin_panel_contents';

const AdminPanel: m.Component<{}, { isOpen: boolean }> = {
  oninit: (vnode) => {
    vnode.state.isOpen = false;
  },
  view: (vnode) => {
    return [m(ListItem, {
      href: '#',
      class: 'AdminPanel',
      onclick: (e) => {
        e.preventDefault();
        vnode.state.isOpen = true;
      },
      label: 'Manage Community',
      contentLeft: m(Icon, { name: Icons.SETTINGS, }),
    }),
    m(Dialog, {
      autofocus: true,
      basic: false,
      closeOnEscapeKey: true,
      closeOnOutsideClick: true,
      class: 'CommunityManagementDialog',
      content: m(AdminPanelContents, {
        onChangeHandler: (v) => { vnode.state.isOpen = v; },
      }),
      hasBackdrop: true,
      isOpen: vnode.state.isOpen,
      inline: false,
      onClose: () => { vnode.state.isOpen = false; },
      title: 'Manage Community',
      transitionDuration: 200,
      footer: null,
    })];
  },
};

export default AdminPanel;
