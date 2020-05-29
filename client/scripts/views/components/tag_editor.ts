import m from 'mithril';
import $ from 'jquery';
import { OffchainThread, OffchainTag } from 'models';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput, MenuItem } from 'construct-ui';
import app from 'state';

interface ITagEditorAttrs {
  thread: OffchainThread;
  onChangeHandler: Function;
  popoverMenu?: boolean;
}

const TagWindow: m.Component<{ tag: OffchainTag, onChangeHandler: Function}> = {
  view: (vnode) => {
    const { onChangeHandler, tag } = vnode.attrs;
    return m(TagInput, {
      oncreate: (vvnode) => {
        $(vvnode.dom).find('input').focus();
      },
      contentLeft: m(Icon, { name: Icons.TAG }),
      tags: tag && [
        m(Tag, {
          label: `#${tag}`,
          // onRemove: () => {
          //   onChangeHandler(tags.filter((t) => t !== tag));
          // },
        })
      ],
      intent: 'none',
      size: 'lg',
      onAdd: (value: string) => {
        if (tag.name !== value) {
          onChangeHandler(value);
        }
      },
    });
  }
};

const TagEditor: m.Component<ITagEditorAttrs, {isOpen: boolean, tag: OffchainTag}> = {
  oninit: (vnode) => {
    vnode.state.isOpen = false;
  },
  oncreate: (vnode) => {
    vnode.state.tag = vnode.attrs.thread.tag;
  },
  view: (vnode) => {
    return m('TagEditor', [
      vnode.attrs.popoverMenu
        ? m(MenuItem, {
          iconLeft: Icons.TAG,
          fluid: true,
          label: 'Edit Tags',
          onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
        })
        : m('a', {
          href: '#',
          onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
        }, [ 'Edit tags' ]),
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        content: m(TagWindow, {
          tag: vnode.state.tag,
          onChangeHandler: (tag: OffchainTag) => { vnode.state.tag = tag; },
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
              $.post(`${app.serverUrl()}/updateTags`, {
                'jwt': app.login.jwt,
                'thread_id': vnode.attrs.thread.id,
                'tag': vnode.state.tag,
                'address': app.vm.activeAccount.address,
              }).then((r) => {
                const tag: OffchainTag = r.result;
                vnode.attrs.onChangeHandler(tag);
              });
              vnode.state.isOpen = false;
            },
          }),
        ])
      }),
    ]);
  },
};

export default TagEditor;
