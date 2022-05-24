import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import {
  Button,
  Input,
  Form,
  FormGroup,
  FormLabel,
  Checkbox,
} from 'construct-ui';

import { ChainNetwork } from 'types';
import QuillEditor from 'views/components/quill_editor';
import { pluralizeWithoutNumberPrefix, tokensToWei } from 'helpers';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import {
  CWTextInput,
  ValidationStatus,
} from 'views/components/component_kit/cw_text_input';

interface INewTopicModalForm {
  id: number;
  name: string;
  description: string;
  tokenThreshold: string;
  featuredInSidebar: boolean;
  featuredInNewPost: boolean;
}

const NewTopicModal: m.Component<
  {
    id: number;
    name: string;
    description: string;
    tokenThreshold: string;
    featuredInSidebar: boolean;
    featuredInNewPost: boolean;
  },
  {
    error: any;
    form: INewTopicModalForm;
    saving: boolean;
    quillEditorState;
  }
> = {
  view: (vnode) => {
    if (
      !app.user.isSiteAdmin &&
      !app.user.isAdminOfEntity({ chain: app.activeChainId() })
    ) {
      return null;
    }
    const {
      id,
      name,
      description,
      tokenThreshold = '0',
      featuredInSidebar,
      featuredInNewPost,
    } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = {
        id,
        name,
        description,
        tokenThreshold,
        featuredInSidebar,
        featuredInNewPost,
      };
    }
    let disabled = false;
    if (!vnode.state.form.name || !vnode.state.form.name.trim())
      disabled = true;

    if (
      vnode.state.form.featuredInNewPost &&
      vnode.state.quillEditorState &&
      vnode.state.quillEditorState.editor &&
      vnode.state.quillEditorState.editor.editor.isBlank()
    ) {
      disabled = true;
    }

    const decimals = app.chain?.meta.chain?.decimals
      ? app.chain.meta.chain.decimals
      : app.chain.network === ChainNetwork.ERC721
      ? 0
      : 18;

    return m('.NewTopicModal', [
      m('.compact-modal-title', [m('h3', 'New topic'), m(ModalExitButton)]),
      m('.compact-modal-body', [
        m(Form, [
          m(CWTextInput, {
            name: 'name',
            label: 'Name',
            defaultValue: vnode.state.form.name,
            oninput: (e) => {
              vnode.state.form.name = (e.target as HTMLInputElement).value;
            },
            inputValidationFn: (text) => {
              let errorMsg;
              const currentCommunityTopicNames =
                app.chain.meta.chain.topics.map((t) => t.name.toLowerCase());
              if (currentCommunityTopicNames.includes(text.toLowerCase())) {
                errorMsg = 'Topic name already used within community.';
                vnode.state.error = errorMsg;
                m.redraw();
                return [ValidationStatus.Failure, errorMsg];
              }
              const disallowedCharMatches = text.match(/["<>%{}|\\/^`]/g);
              if (disallowedCharMatches) {
                errorMsg = `The ${pluralizeWithoutNumberPrefix(
                  disallowedCharMatches.length,
                  'char'
                )} 
                ${disallowedCharMatches.join(', ')} are not permitted`;
                vnode.state.error = errorMsg;
                m.redraw();
                return [ValidationStatus.Failure, errorMsg];
              }
              if (vnode.state.error) delete vnode.state.error;
              return [ValidationStatus.Success, 'Valid topic name'];
            },
            autocomplete: 'off',
            autofocus: true,
            tabindex: 1,
            oncreate: (vvnode) => {
              // use oncreate to focus because autofocus: true fails when component is recycled in a modal
              setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
            },
          }),
          m(FormGroup, [
            m(FormLabel, { for: 'description' }, 'Description'),
            m(Input, {
              title: 'Description',
              class: 'topic-form-description',
              tabindex: 2,
              defaultValue: vnode.state.form.description,
              oninput: (e) => {
                vnode.state.form.description = (e.target as any).value;
              },
            }),
          ]),
          app.activeChainId() &&
            m(FormGroup, [
              m(
                FormLabel,
                {
                  for: 'tokenThreshold',
                },
                `Number of tokens needed to post (${app.chain?.meta.chain.symbol})`
              ),
              m(TokenDecimalInput, {
                decimals,
                defaultValueInWei: '0',
                onInputChange: (newValue: string) => {
                  vnode.state.form.tokenThreshold = newValue;
                },
              }),
            ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in Sidebar',
              checked: vnode.state.form.featuredInSidebar,
              onchange: (e) => {
                vnode.state.form.featuredInSidebar =
                  !vnode.state.form.featuredInSidebar;
              },
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in New Post',
              checked: vnode.state.form.featuredInNewPost,
              onchange: (e) => {
                vnode.state.form.featuredInNewPost =
                  !vnode.state.form.featuredInNewPost;
              },
            }),
          ]),
          vnode.state.form.featuredInNewPost &&
            m(FormGroup, [
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
            disabled: vnode.state.saving || vnode.state.error || disabled,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              const { quillEditorState, form } = vnode.state;

              if (quillEditorState) {
                quillEditorState.editor.enable(false);
              }

              const mentionsEle = document.getElementsByClassName(
                'ql-mention-list-container'
              )[0];
              if (mentionsEle)
                (mentionsEle as HTMLElement).style.visibility = 'hidden';
              const defaultOffchainTemplate = !quillEditorState
                ? ''
                : quillEditorState.markdownMode
                ? quillEditorState.editor.getText()
                : JSON.stringify(quillEditorState.editor.getContents());

              app.topics
                .add(
                  form.name,
                  form.description,
                  null,
                  form.featuredInSidebar,
                  form.featuredInNewPost,
                  vnode.state.form.tokenThreshold || '0',
                  defaultOffchainTemplate
                )
                .then(() => {
                  vnode.state.saving = false;
                  m.redraw();
                  $(e.target).trigger('modalexit');
                })
                .catch(() => {
                  vnode.state.error = 'Error creating topic';
                  vnode.state.saving = false;
                  m.redraw();
                });
            },
            label: 'Create topic',
          }),
          vnode.state.error && m('.error-message', vnode.state.error),
        ]),
      ]),
    ]);
  },
};

export default NewTopicModal;
