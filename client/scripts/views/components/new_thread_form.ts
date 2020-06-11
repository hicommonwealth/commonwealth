import 'components/new_thread_form.scss';

import m, { VnodeDOM } from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Form, FormGroup, Input, Button, ButtonGroup, Icons, Grid, Col, Tooltip, List, ListItem } from 'construct-ui';

import app from 'state';
import QuillEditor from 'views/components/quill_editor';
import AutoCompleteTagForm from 'views/components/autocomplete_tag_form';
import { detectURL, getLinkTitle, newLink, newThread, saveDraft } from 'views/pages/threads';
import { OffchainTag } from 'client/scripts/models';
import QuillFormattedText from './quill_formatted_text';
import MarkdownFormattedText from './markdown_formatted_text';

interface IState {
  form: IThreadForm,
  activeTag: OffchainTag | string,
  fromDraft?: number,
  error,
  quillEditorState,
  hasComment: boolean,
  autoTitleOverride,
  newType: string,
  uploadsInProgress: number,
}

interface IThreadForm {
  tagName?: string;
  tagId?: number;
  url?: string;
  title?: string;
}

export const NewThreadForm: m.Component<{ header: boolean }, IState> = {
  view: (vnode: VnodeDOM<{ header: boolean }, IState>) => {
    const author = app.vm.activeAccount;
    const activeEntity = app.community ? app.community : app.chain;
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;
    if (vnode.state.quillEditorState?.container) vnode.state.quillEditorState.container.tabIndex = 8;

    // init
    if (vnode.state.form === undefined) vnode.state.form = {};
    if (vnode.state.error === undefined) vnode.state.error = {};
    if (vnode.state.uploadsInProgress === undefined) vnode.state.uploadsInProgress = 0;
    if (vnode.state.newType === undefined) vnode.state.newType = 'Discussion';
    const { error } = vnode.state;

    const getUrlForLinkPost = _.debounce(async () => {
      const res = await getLinkTitle(vnode.state.form.url);
      if (res === '404: Not Found' || res === '500: Server Error') {
        vnode.state.error.url = res;
      } else {
        delete vnode.state.error.url;
        if (!vnode.state.autoTitleOverride) vnode.state.form.title = res;
      }
      m.redraw();
    }, 750);

    const typeSelector = m(FormGroup, [
      m(ButtonGroup, { fluid: true, outlined: true }, [
        m(Button, {
          iconLeft: Icons.FEATHER,
          label: 'Discussion',
          onclick: () => {
            vnode.state.newType = 'Discussion';
          },
          active: vnode.state.newType === 'Discussion',
          intent: vnode.state.newType === 'Discussion' ? 'primary' : 'none',
        }),
        m(Button, {
          iconLeft: Icons.LINK,
          label: 'Link',
          onclick: () => {
            vnode.state.newType = 'Link';
          },
          active: vnode.state.newType === 'Link',
          intent: vnode.state.newType === 'Link' ? 'primary' : 'none',
        }),
      ]),
    ]);

    console.log(app.login.discussionDrafts)

    return m('.NewThreadForm', {
      oncreate: (vvnode) => {
        $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      m('.new-thread-form-body', [
        vnode.attrs.header && m('h3', 'New Post'),
        vnode.state.newType === 'Link' && m(Form, [
          typeSelector,
          m(FormGroup, [
            m(Input, {
              placeholder: 'https://',
              onchange: (e) => {
                const { value } = e.target as any;
                vnode.state.form.url = value;
                if (detectURL(value)) getUrlForLinkPost();
              },
              tabindex: 1,
            }),
          ]),
          m(FormGroup, [
            m(Input, {
              class: 'new-thread-title',
              placeholder: 'Title',
              onchange: (e) => {
                const { value } = e.target as any;
                vnode.state.autoTitleOverride = true;
                if (vnode.state.error.title) delete vnode.state.error.title;
                vnode.state.form.title = value;
              },
              tabindex: 1,
            }),
          ]),
          m(FormGroup, [
            vnode.state.hasComment ? m(QuillEditor, {
              contentsDoc: '', // Prevent the editor from being filled in with previous content
              oncreateBind: (state) => {
                vnode.state.quillEditorState = state;
              },
              placeholder: 'Comment (optional)',
              editorNamespace: 'new-link',
              tabindex: 3,
            }) : m('a.add-comment', {
              href: '#',
              onclick: (e) => { vnode.state.hasComment = true; },
              tabindex: 2,
            }, 'Add comment'),
          ]),
          m(FormGroup, [
            m(AutoCompleteTagForm, {
              tags: app.tags.getByCommunity(app.activeId()),
              featuredTags: app.tags.getByCommunity(app.activeId()).filter((ele) => activeEntityInfo.featuredTags.includes(`${ele.id}`)),
              updateFormData: (tagName: string, tagId?: number) => {
                vnode.state.form.tagName = tagName;
                vnode.state.form.tagId = tagId;
              },
              updateParentErrors: (err: string) => {
                if (err) vnode.state.error = err;
                else delete vnode.state.error;
                m.redraw();
              },
              tabindex: 4,
            }),
          ]),
          m(FormGroup, [
            m(Button, {
              class: !author ? 'disabled' : '',
              intent: 'primary',
              label: 'Create link',
              name: 'submission',
              onclick: () => {
                if (!vnode.state.error.url && !detectURL(vnode.state.form.url)) {
                  vnode.state.error.url = 'Must provide a valid URL.';
                }
                if (!Object.values(vnode.state.error).length) {
                  newLink(vnode.state.form, vnode.state.quillEditorState, author);
                }
                if (!vnode.state.error) {
                  $(vnode.dom).trigger('modalcomplete');
                  setTimeout(() => {
                    $(vnode.dom).trigger('modalexit');
                  }, 0);
                }
              },
            }),
          ]),
          error
            && (typeof error === 'string' || Object.keys(error).length)
            ? m('.error-message', [
              (typeof error === 'string')
                ? m('span', error)
                : Object.values(error).map((val) => m('span', `${val} `)),
            ])
            : m('.error-placeholder'),
        ]),
        //
        vnode.state.newType === 'Discussion' && m(Form, [
          typeSelector,
          m(FormGroup, [
            m(Input, {
              name: 'title',
              placeholder: 'Title',
              onchange: (e) => {
                vnode.state.form.title = (e as any).target.value;
              },
              tabindex: 1,
            }),
          ]),
          m(FormGroup, [
            m(QuillEditor, {
              contentsDoc: '',
              oncreateBind: (state) => {
                vnode.state.quillEditorState = state;
              },
              editorNamespace: 'new-discussion',
              tabindex: 2,
            }),
          ]),
          m(FormGroup, [
            m(AutoCompleteTagForm, {
              activeTag: vnode.state.activeTag || undefined,
              tags: app.tags.getByCommunity(app.activeId()),
              featuredTags: app.tags.getByCommunity(app.activeId()).filter((ele) => activeEntityInfo.featuredTags.includes(`${ele.id}`)),
              updateFormData: (tagName: string, tagId?: number) => {
                vnode.state.form.tagName = tagName;
                vnode.state.form.tagId = tagId;
              },
              updateParentErrors: (err: string) => {
                if (err) vnode.state.error = err;
                else delete vnode.state.error;
                m.redraw();
              },
              tabindex: 3,
            }),
          ]),
          m(FormGroup, [
            m(Button, {
              class: !author || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
              intent: 'none',
              onclick: () => {
                const { form, quillEditorState } = vnode.state;
                try {
                  saveDraft(form, quillEditorState, author);
                  $(vnode.dom).trigger('modalcomplete');
                  setTimeout(() => {
                    $(vnode.dom).trigger('modalexit');
                  }, 0);
                } catch (e) {
                  console.error(e);
                }
              },
              label: (vnode.state.uploadsInProgress > 0) ? 'Uploading...' : 'Save as draft',
              name: 'saving',
              tabindex: 4
            }),
            m(Button, {
              class: !author || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
              intent: 'primary',
              onclick: async () => {
                const { form, quillEditorState } = vnode.state;
                vnode.state.error = newThread(form, quillEditorState, author);
                if (!vnode.state.error) {
                  if (vnode.state.fromDraft) {
                    await app.drafts.delete(vnode.state.fromDraft);
                  }
                  $(vnode.dom).trigger('modalcomplete');
                  setTimeout(() => {
                    $(vnode.dom).trigger('modalexit');
                  }, 0);
                }
              },
              label: (vnode.state.uploadsInProgress > 0) ? 'Uploading...' : 'Create thread',
              name: 'submission',
              tabindex: 4
            }),
          ]),
          error
            && (typeof error === 'string' || Object.keys(error).length)
            ? m('.error-message', [
              (typeof error === 'string')
                ? m('span', error)
                : Object.values(error).map((val) => m('span', `${val} `)),
            ])
            : m('.error-placeholder'),
        ]),
      ]),
      !!app.login.discussionDrafts.length && m('.new-thread-form-sidebar', [
        m('h3', 'Saved drafts'),
        m(List, { interactive: true }, app.login.discussionDrafts.map((draft) => {
          const { body } = draft;
          let bodyComponent;
          if (body) {
            try {
              const doc = JSON.parse(body);
              doc.ops = doc.ops.slice(0, 3);
              bodyComponent = m(QuillFormattedText, { doc, hideFormatting: true });
            } catch (e) {
              bodyComponent = m(MarkdownFormattedText, { doc: body.slice(0, 200), hideFormatting: true });
            }
          }
          return m(ListItem, {
            contentLeft: [
              m('.discussion-draft-title', draft.title || 'Untitled'),
              m('.discussion-draft-body', draft.body.length
                ? bodyComponent
                : '')
            ],
            onclick: () => {
              if (body) {
                try {
                  const doc = JSON.parse(body);
                  vnode.state.quillEditorState.editor.setContents(doc);
                } catch (e) {
                  // TODO: figure out Markdown strategy
                  // const doc = body;
                }
              }
              const titleInput = document.querySelector("div.new-thread-form-body input[name='title']");
              (titleInput as HTMLInputElement).value = draft.title;
              vnode.state.form.title = draft.title;
              vnode.state.activeTag = draft.tag;
              vnode.state.fromDraft = draft.id;
              m.redraw();
            }
          });
        }))
      ])
    ]);
  }
};