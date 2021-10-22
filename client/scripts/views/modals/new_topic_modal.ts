import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel, Checkbox } from 'construct-ui';
import BN from 'bn.js';

import QuillEditor from 'views/components/quill_editor';
import { CompactModalExitButton } from 'views/modal';
import { tokensToTokenBaseUnits } from 'helpers';
import { stubFalse } from 'lodash';
interface INewTopicModalForm {
  id: number,
  name: string,
  description: string,
  tokenThreshold: string,
  featuredInSidebar: boolean,
  featuredInNewPost: boolean,
}

const NewTopicModal: m.Component<{
  id: number,
  name: string,
  description: string,
  tokenThreshold: string,
  featuredInSidebar: boolean,
  featuredInNewPost: boolean,
}, {
  error: any,
  form: INewTopicModalForm,
  saving: boolean,
  quillEditorState,
}> = {
  view: (vnode) => {
    if (!app.user.isSiteAdmin
    && !app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) {
      return null;
    }
    const { id, name, description, tokenThreshold = '0', featuredInSidebar, featuredInNewPost } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, tokenThreshold, featuredInSidebar, featuredInNewPost };
    }
    let disabled = false;
    if (!vnode.state.form.name || !vnode.state.form.name.trim()) disabled = true;

    if (vnode.state.form.featuredInNewPost
      && vnode.state.quillEditorState
      && vnode.state.quillEditorState.editor
      && vnode.state.quillEditorState.editor.editor.isBlank()
    ) {
      disabled = true;
    }

    return m('.NewTopicModal', [
      m('.compact-modal-title', [
        m('h3', 'New topic'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(Form, [
          m(FormGroup, [
            m(FormLabel, { for: 'name' }, 'Name'),
            m(Input, {
              title: 'Name',
              name: 'name',
              class: 'topic-form-name',
              tabindex: 1,
              defaultValue: vnode.state.form.name,
              autocomplete: 'off',
              oncreate: (vvnode) => {
                // use oncreate to focus because autofocus: true fails when component is recycled in a modal
                setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
              },
              oninput: (e) => {
                vnode.state.form.name = (e.target as any).value;
              },
            }),
          ]),
          m(FormGroup, [
            m(FormLabel, { for: 'description' }, 'Description'),
            m(Input, {
              title: 'Description',
              class: 'topic-form-description',
              tabindex: 2,
              defaultValue: vnode.state.form.description,
              oninput: (e) => {
                vnode.state.form.description = (e.target as any).value;
              }
            }),
          ]),
          app.activeChainId() && m(FormGroup, [
            m(FormLabel, { for: 'tokenThreshold' }, `Number of tokens needed to post (${app.chain?.meta.chain.symbol})`),
            m(Input, {
              title: 'Token threshold',
              class: 'topic-form-token-threshold',
              tabindex: 2,
              defaultValue: '0',
              value: vnode.state.form.tokenThreshold,
              oninput: (e) => {
                // restrict it to numerical input
                if (e.target.value === '' || /^\d+\.?\d*$/.test(e.target.value)) {
                  vnode.state.form.tokenThreshold = (e.target as any).value;
                }
              }
            })
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in Sidebar',
              checked: vnode.state.form.featuredInSidebar,
              onchange: (e) => {
                vnode.state.form.featuredInSidebar = !vnode.state.form.featuredInSidebar;
              },
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in New Post',
              checked: vnode.state.form.featuredInNewPost,
              onchange: (e) => {
                vnode.state.form.featuredInNewPost = !vnode.state.form.featuredInNewPost;
              },
            }),
          ]),
          vnode.state.form.featuredInNewPost && m(FormGroup, [
            m(QuillEditor, {
              contentsDoc: '',
              oncreateBind: (state) => {
                vnode.state.quillEditorState = state;
              },
              editorNamespace: 'new-discussion',
              imageUploader: true,
              tabindex: 3,
            }),
          ]),
          m(Button, {
            intent: 'primary',
            disabled: vnode.state.saving || disabled,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              const { quillEditorState, form } = vnode.state;

              if (quillEditorState) {
                quillEditorState.editor.enable(false);
              }

              const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
              if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';
              const defaultOffchainTemplate = !quillEditorState ? ''
                : quillEditorState.markdownMode
                  ? quillEditorState.editor.getText()
                  : JSON.stringify(quillEditorState.editor.getContents());

              app.topics.add(
                form.name,
                form.description,
                null,
                form.featuredInSidebar,
                form.featuredInNewPost,
                app.activeId() ? tokensToTokenBaseUnits(vnode.state.form.tokenThreshold || '0',
                  app.chain?.meta.chain.decimals || 18) : null,
                defaultOffchainTemplate
              ).then(() => {
                vnode.state.saving = false;
                m.redraw();
                $(e.target).trigger('modalexit');
              }).catch(() => {
                vnode.state.error = 'Error creating topic';
                vnode.state.saving = false;
                m.redraw();
              });
            },
            label: 'Create topic',
          }),
          vnode.state.error && m('.error-message', vnode.state.error),
        ]),
      ])
    ]);
  }
};

export default NewTopicModal;
