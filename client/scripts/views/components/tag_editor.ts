import m from 'mithril';
import $ from 'jquery';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput, MenuItem } from 'construct-ui';

import app from 'state';
import { OffchainThread, OffchainTag } from 'models';
import TagSelector from './tag_selector';

interface ITagEditorAttrs {
  thread: OffchainThread;
  popoverMenu?: boolean;
  onChangeHandler: Function;
  openStateHandler: Function;
}

interface ITagEditorState {
  tagName: string;
  tagId: number;
  isOpen: boolean;
}

const TagWindow: m.Component<{
  thread: OffchainThread,
  onChangeHandler: Function
}, {
  activeTag: OffchainTag | string
}> = {
  view: (vnode) => {
    const activeMeta = app.chain ? app.chain.meta.chain : app.community.meta;
    const featuredTags = activeMeta.featuredTags.map((t) => {
      return app.tags.getByCommunity(app.activeId()).find((t_) => Number(t) === t_.id);
    });
    if (!vnode.state.activeTag) {
      vnode.state.activeTag = vnode.attrs.thread.tag;
    }

    const onChangeHandler = (tagName, tagId?) => {
      vnode.attrs.onChangeHandler(tagName, tagId);
      vnode.state.activeTag = tagName;
    };

    const { activeTag } = vnode.state;

    return m(TagSelector, {
      featuredTags,
      activeTag,
      tags: app.tags.getByCommunity(app.activeId()),
      updateFormData: onChangeHandler,
    });
  }
};

const TagEditor: m.Component<ITagEditorAttrs, ITagEditorState> = {
  oncreate: (vnode) => {
    if (!vnode.attrs.thread.tag) return;
    vnode.state.tagName = vnode.attrs.thread.tag.name;
    vnode.state.tagId = vnode.attrs.thread.tag.id;
  },
  oninit: (vnode) => {
    vnode.state.isOpen = !!vnode.attrs.popoverMenu;
  },
  view: (vnode) => {
    return m('.TagEditor', [
      !vnode.attrs.popoverMenu && m('a', {
        href: '#',
        onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
      }, 'Move to another tag'),
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        content: m(TagWindow, {
          thread: vnode.attrs.thread,
          onChangeHandler: (tagName, tagId?) => {
            vnode.state.tagName = tagName;
            vnode.state.tagId = tagId;
          }
        }),
        hasBackdrop: true,
        isOpen: vnode.attrs.popoverMenu ? true : vnode.state.isOpen,
        inline: false,
        onClose: () => {
          if (vnode.attrs.popoverMenu) {
            vnode.attrs.openStateHandler(false);
          } else {
            vnode.state.isOpen = false;
          }
        },
        title: 'Edit tag',
        transitionDuration: 200,
        footer: m(`.${Classes.ALIGN_RIGHT}`, [
          m(Button, {
            label: 'Close',
            onclick: () => {
              if (vnode.attrs.popoverMenu) {
                vnode.attrs.openStateHandler(false);
              } else {
                vnode.state.isOpen = false;
              }
            },
          }),
          m(Button, {
            label: 'Save changes',
            intent: 'primary',
            onclick: async () => {
              const { tagName, tagId } = vnode.state;
              const { thread } = vnode.attrs;
              try {
                const tag: OffchainTag = await app.tags.update(thread.id, tagName, tagId);
                vnode.attrs.onChangeHandler(tag);
              } catch (err) {
                console.log('Failed to update tag');
                throw new Error((err.responseJSON && err.responseJSON.error)
                  ? err.responseJSON.error
                  : 'Failed to update tag');
              }
              if (vnode.attrs.popoverMenu) {
                vnode.attrs.openStateHandler(false);
              } else {
                vnode.state.isOpen = false;
              }
            },
          }),
        ])
      })
    ]);
  }
};

export default TagEditor;
