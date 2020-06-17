import m from 'mithril';
import $ from 'jquery';
import { OffchainThread, OffchainTag } from 'models';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput, MenuItem } from 'construct-ui';
import app from 'state';
import AutoCompleteTagForm from './autocomplete_tag_form';

interface ITagEditorAttrs {
  thread: OffchainThread;
  popoverMenu?: boolean;
  onChangeHandler: Function;
}

interface ITagEditorState {
  tagName: string;
  tagId: number;
  isOpen: boolean;
}

const TagWindow: m.Component<{ thread: OffchainThread, onChangeHandler: Function }> = {
  view: (vnode) => {
    const { onChangeHandler } = vnode.attrs;
    const activeMeta = app.chain ? app.chain.meta.chain : app.community.meta;
    const featuredTags = activeMeta.featuredTags.map((t) => {
      return app.tags.getByCommunity(app.activeId()).find((t_) => Number(t) === t_.id);
    });
    return m(AutoCompleteTagForm, {
      featuredTags,
      activeTag: vnode.attrs.thread.tag,
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
    if (vnode.state.isOpen === undefined) vnode.state.isOpen = false;
  },
  view: (vnode) => {
    return m('.TagEditor', [
      !vnode.attrs.popoverMenu && m('a', {
        href: '#',
        onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
      }, 'Edit tags'),
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
        isOpen: vnode.attrs.popoverMenu ? vnode.attrs.popoverMenu : vnode.state.isOpen,
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
            onclick: async () => {
              const { tagName, tagId } = vnode.state;
              const { thread } = vnode.attrs;
              const tag: OffchainTag = await app.tags.update(thread.id, tagName, tagId);
              vnode.attrs.onChangeHandler(tag);
              vnode.state.isOpen = false;
            },
          }),
        ])
      })
    ]);
  }
};

export default TagEditor;
