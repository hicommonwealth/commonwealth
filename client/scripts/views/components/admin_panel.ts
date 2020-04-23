import m from 'mithril';
import $ from 'jquery';
import { OffchainThread, OffchainTag, CommunityInfo } from 'models';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput, ListItem, Table, Input, List, TextArea } from 'construct-ui';
import app from 'state';

interface ITagEditorAttrs {
  thread: OffchainThread;
  onChangeHandler: Function;
}

const CreatorField: m.Component = {
  view: (vnode) => {
    return m('creator');
  }
};

interface ICommunityMetadataState {
    name: string;
    description: string;
    url: string;
    creator;
    admins;
    mods;
}

const CommunityMetadata: m.Component<{community: CommunityInfo}, ICommunityMetadataState> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.community.name;
    vnode.state.description = vnode.attrs.community.description;
    vnode.state.url = vnode.attrs.community.id;
  },
  view: (vnode) => {
    return m('div', [m(Table, {
      bordered: false,
      interactive: true,
      striped: false,
      class: '.community.metadata',
      style: 'table-layout: fixed;'
    }, [
      m('tr', [
        m('td', { style: 'width: 100px' }, 'name:'),
        m('td', [
          m(Input, {
            defaultValue: vnode.state.name,
            fluid: true,
            value: vnode.state.name,
          }),
        ]),
      ]),
      m('tr', [
        m('td', 'Description:'),
        m('td', [
          m(Input, {
            defaultValue: vnode.state.description,
            fluid: true,
            value: vnode.state.description,
          }),
        ]),
      ]),
      m('tr', [
        m('td', 'URL:'),
        m('td', [
          m(Input, {
            defaultValue: `commonwealth.im/${vnode.state.url}`,
            fluid: true,
            disabled: true,
            value: `commonwealth.im/${vnode.state.url}`,
          }),
        ]),
      ]),
    ]),
    m(CreatorField),
    m('admins'),
    m('mods'),
    m(Button, {
      label: 'submit',
      onclick: () => {
        vnode.attrs.community.updateCommunityData(vnode.state.name, vnode.state.description);
        console.dir('updated community');
      },
    }),
    ]);
  },
};

const ChainMetadata: m.Component = {
  view: (vnode) => {
    return m(Table, {
      bordered: false,
      interactive: false,
      striped: true,
      class: '.chain.metadata'
    });
  },
};

const Panel: m.Component = {
  view: (vnode) => {
    const isCommunity = !!app.activeCommunityId();
    return m('.Panel', [
      m('.panel-left', { style: 'width: 70%;' }, [
        (isCommunity)
          ? m(CommunityMetadata, { community: app.community.meta })
          : m(ChainMetadata),
      ]),
      m('.panel-right', []),
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
        footer: null,
      }),
    ]);
  },
};

export default AdminPanel;
