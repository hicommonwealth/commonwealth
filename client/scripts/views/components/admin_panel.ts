import m from 'mithril';
import $ from 'jquery';
import { OffchainThread, OffchainTag } from 'models';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput, ListItem } from 'construct-ui';
import app from 'state';

interface ITagEditorAttrs {
  thread: OffchainThread;
  onChangeHandler: Function;
}

const CommunityMetadata: m.Component = {
  view: (vnode) => {
    return m(TagInput);
  }
};

const ChainMetadata: m.Component = {
  view: (vnode) => {
    return m(TagInput);
  }
};

const Panel: m.Component = {
  view: (vnode) => {
    return m('.Panel', [

    ]);
  }
};

const AdminPanel: m.Component<{}, {isOpen: boolean}> = {
  oninit: (vnode) => {
    vnode.state.isOpen = false;
  },
  oncreate: (vnode) => {
  },
  view: (vnode) => {
    return m('AdminPanel', [
      m(ListItem, {
        href: '#',
        onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
        label: 'Manage Community',
      }),
      m(Dialog, {
        autofocus: true,
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        content: m(Panel),
        hasBackdrop: true,
        isOpen: vnode.state.isOpen,
        inline: false,
        onClose: () => { vnode.state.isOpen = false; },
        title:'Manage Community',
        transitionDuration: 200,
        footer: m('div'),
      }),
    ]);
  },
};

export default AdminPanel;
