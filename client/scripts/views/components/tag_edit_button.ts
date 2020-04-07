import m from 'mithril';
import { OffchainThread } from 'models';
import { Button, Dialog, Classes } from 'construct-ui';
import { isValueNode } from 'graphql';

interface ITagEditorAttrs {
  thread: OffchainThread;
}

const TagWindow: m.Component<ITagEditorAttrs> = {
  view: (vnode) => {
    return m('Tags', [
      vnode.attrs.thread.tags.map((tag) => {
        return m('.tag', tag.name);
      })
    ]);
  }
};

const TagEditor: m.Component<ITagEditorAttrs, {isOpen: boolean}> = {
  oninit: (vnode) => {
    vnode.state.isOpen = false;
  },
  view: (vnode) => {
    return m('TagEditor', [
      m(Button, {
        label: `tags for ${vnode.attrs.thread.title}`,
        intent: 'primary',
        onclick: () => { vnode.state.isOpen = !vnode.state.isOpen; },
      }),
      m(Dialog, {
        autofocus: true,
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        content: m(TagWindow, { thread: vnode.attrs.thread }), // TODO: PUT TAGS HERE
        hasBackdrop: true,
        isOpen: vnode.state.isOpen,
        inline: false,
        onClose: () => { vnode.state.isOpen = false; },
        title: 'Edit Tags',
        transitionDuration: 200,
        footer: m(`.${Classes.ALIGN_RIGHT}`, [
          m(Button, {
            label: 'Close',
            onclick: () => { vnode.state.isOpen = false; },
          }),
          m(Button, {
            label: 'Submit',
            intent: 'primary',
            onclick: () => { console.dir('Submit Changes Here'); },
          }),
        ])
      }),
    ]);
  },
};

export default TagEditor;
