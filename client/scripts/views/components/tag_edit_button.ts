import m from 'mithril';
import $ from 'jquery';
import { OffchainThread, OffchainTag } from 'models';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput } from 'construct-ui';
import app from 'state';

interface ITagEditorAttrs {
  thread: OffchainThread;
  onChangeHandler: Function;
}

const TagWindow: m.Component<{tags: string[], onChangeHandler: Function}> = {
  view: (vnode) => {
    const { onChangeHandler, tags } = vnode.attrs;
    return m(TagInput, {
      contentLeft: m(Icon, { name: Icons.TAG }),
      tags: tags && (tags.length !== 0) &&
        vnode.attrs.tags.map((tag) => {
          return m(Tag, {
            label: `#${tag}`,
            onRemove: () => {
              onChangeHandler(tags.filter((t) => t !== tag));
            },
          });
        }),
      intent: 'none',
      size: 'lg',
      onAdd: (value: string) => {
        if (!tags.includes(value)) {
          tags.push(value);
          onChangeHandler(tags);
        }
      },
    });
  }
};

const TagEditor: m.Component<ITagEditorAttrs, {isOpen: boolean, tags: string[]}> = {
  oninit: (vnode) => {
    vnode.state.isOpen = false;
    vnode.state.tags = [];
  },
  oncreate: (vnode) => {
    vnode.attrs.thread.tags.map((tag) => vnode.state.tags.push(tag.name));
  },
  view: (vnode) => {
    return m('.TagEditor', [
      m(Button, {
        label: m(Icon, { name: Icons.TAG }),
        intent: 'none',
        onclick: () => { vnode.state.isOpen = !vnode.state.isOpen; },
      }),
      m(Dialog, {
        autofocus: true,
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        content: m(TagWindow, {
          tags: vnode.state.tags,
          onChangeHandler: (tags: string[]) => { vnode.state.tags = tags; },
        }),
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
            onclick: () => {
              // do query, return value in change handler to be passed to view Proposal
              $.post(`${app.serverUrl()}/updateTags`, {
                jwt: app.login.jwt,
                thread_id: vnode.attrs.thread.id,
                tags: vnode.state.tags,
              });
              vnode.attrs.onChangeHandler(vnode.state.tags);
              vnode.state.isOpen = false;
            },
          }),
        ])
      }),
    ]);
  },
};

export default TagEditor;
