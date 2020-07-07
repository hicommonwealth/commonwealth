import 'components/new_thread_form.scss';

import m, { VnodeDOM } from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import Quill from 'quill-2.0-dev/quill';
import { Form, FormGroup, Input, Button, ButtonGroup, Icons, Grid, Col, Tooltip, List, ListItem } from 'construct-ui';

import app from 'state';
import QuillEditor from 'views/components/quill_editor';
import AutoCompleteTagForm from 'views/components/autocomplete_tag_form';
import { detectURL, getLinkTitle, newLink, newThread, saveDraft } from 'views/pages/threads';
import { OffchainTag } from 'client/scripts/models';
import QuillFormattedText from './quill_formatted_text';
import MarkdownFormattedText from './markdown_formatted_text';
import { confirmationModalWithText } from '../modals/confirm_modal';
import { notifySuccess } from '../../controllers/app/notifications';

interface IState {
  activeTag: OffchainTag | string,
  autoTitleOverride,
  error,
  form: IThreadForm,
  fromDraft?: number,
  hasComment: boolean,
  newType: string,
  quillEditorState,
  saving: boolean,
  uploadsInProgress: number,
}

interface IThreadForm {
  tagName?: string;
  tagId?: number;
  title?: string;
  url?: string;
}

export const checkForModifications = async (state, modalMsg) => {
  const { fromDraft } = state;
  const quill = state.quillEditorState.editor;
  const Delta = Quill.import('delta');

  // If overwritten form body comes from a previous draft, we check whether
  // there have been changes made to the draft, and prompt with a confirmation
  // modal if there have been.

  const titleInput = document.querySelector("div.new-thread-form-body input[name='title']");
  let confirmed = true;
  if (fromDraft) {
    let formBodyDelta;
    let formBodyMarkdown;
    if (state.quillEditorState.markdownMode) {
      formBodyMarkdown = quill.getText();
    } else {
      formBodyDelta = quill.getContents();
    }

    const discardedDraft = app.user.discussionDrafts.store
      .getByCommunity(app.activeId())
      .filter((d) => d.id === fromDraft)[0];
    let discardedDelta;
    let discardedMarkdown;
    try {
      discardedDelta = new Delta(JSON.parse(discardedDraft.body));
    } catch {
      discardedMarkdown = discardedDraft.body;
    }
    const titleIsChanged = discardedDraft.title
      && (titleInput as HTMLInputElement).value !== discardedDraft.title;
    const bodyIsChanged = formBodyDelta
      ? !_.isEqual(formBodyDelta, discardedDelta)
      : formBodyMarkdown
        ? formBodyMarkdown !== discardedMarkdown
        : false;
    if (bodyIsChanged || titleIsChanged) {
      confirmed = await confirmationModalWithText(modalMsg)();
    }
  } else if (quill.getLength() > 1) {
    confirmed = await confirmationModalWithText(modalMsg)();
  }
  return confirmed;
};

export const loadDraft = async (dom, state, draft) => {
  const titleInput = $(dom).find('div.new-thread-form-body input[name=\'title\']');
  // First we check if the form has been updated, to avoid
  // losing any unsaved form data
  const overwriteDraftMsg = 'Load draft? Current form will not be saved.';
  const confirmed = await checkForModifications(state, overwriteDraftMsg);
  if (!confirmed) return;

  // Now we populate the form with its new contents
  let newDraftMarkdown;
  let newDraftDelta;
  console.log(draft.body);
  if (draft.body) {
    try {
      newDraftDelta = JSON.parse(draft.body);
    } catch (e) {
      newDraftMarkdown = draft.body;
    }
  }
  // If the text format of the loaded draft differs from the current editor's mode,
  // we update the current editor's mode accordingly, to preserve formatting
  if (newDraftDelta && state.quillEditorState.markdownMode) {
    state.quillEditorState.markdownMode = false;
  } else if (newDraftMarkdown && !state.quillEditorState.markdownMode) {
    state.quillEditorState.markdownMode = true;
  }
  console.log({newDraftDelta, newDraftMarkdown});
  if (newDraftDelta) {
    state.quillEditorState.editor.setContents(newDraftDelta);
  } else if (newDraftMarkdown) {
    state.quillEditorState.editor.setText(newDraftMarkdown);
  }
  titleInput.val(draft.title);
  state.form.title = draft.title;
  state.activeTag = draft.tag;
  state.form.tagName = draft.tag;
  state.fromDraft = draft.id;
  m.redraw();
};

export const cancelDraft = async (state) => {
  if (!state.fromDraft) {
    return;
  }
  // First we check if the form has been updated, to avoid
  // losing any unsaved form data
  const titleInput = document.querySelector("div.new-thread-form-body input[name='title']");
  const cancelDraftMessage = 'Cancel editing draft? Current form will not be saved.';
  const confirmed = await checkForModifications(state, cancelDraftMessage);
  if (!confirmed) return;
  state.form.body = '';
  state.form.title = '';
  state.activeTag = undefined;
  state.fromDraft = NaN;
  (titleInput as HTMLInputElement).value = '';
  state.quillEditorState.editor.setText('\n');
  m.redraw();
};

export const NewThreadForm: m.Component<{ header: boolean, isModal: boolean }, IState> = {
  view: (vnode: VnodeDOM<{ header: boolean, isModal: boolean }, IState>) => {
    const author = app.user.activeAccount;
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;
    const { isModal } = vnode.attrs;
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

    const discussionDrafts = app.user.discussionDrafts.store.getByCommunity(app.activeId());
    const { saving } = vnode.state;

    const editorNamespace = vnode.state.newType === 'Link' ? 'new-link' : 'new-discussion';

    return m('.NewThreadForm', {
      oncreate: (vvnode) => {
        $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      m('.new-thread-form-body', [
        vnode.attrs.header
        && m('h2.page-title', 'New Post'),
        vnode.state.newType === 'Link'
        && m(Form, [
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
              featuredTags: app.tags.getByCommunity(app.activeId())
                .filter((ele) => activeEntityInfo.featuredTags.includes(`${ele.id}`)),
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
              name: 'submit',
              onclick: () => {
                if (!vnode.state.error.url && !detectURL(vnode.state.form.url)) {
                  vnode.state.error.url = 'Must provide a valid URL.';
                }
                if (!Object.values(vnode.state.error).length) {
                  newLink(vnode.state.form, vnode.state.quillEditorState, author);
                }
                if (isModal && !vnode.state.error) {
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
        vnode.state.newType === 'Discussion'
        && m(Form, [
          typeSelector,
          m(FormGroup, [
            m(Input, {
              name: 'title',
              placeholder: 'Title',
              onchange: (e) => {
                vnode.state.form.title = (e as any).target.value;
                localStorage.setItem('new-discussion-storedTitle', vnode.state.form.title);
              },
              value: localStorage.getItem('new-discussion-storedTitle'),
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
              activeTag: vnode.state.activeTag,
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
              class: !author || saving || vnode.state.uploadsInProgress > 0
                ? 'disabled' : '',
              intent: 'primary',
              onclick: async () => {
                vnode.state.saving = true;
                const { form, quillEditorState } = vnode.state;
                if (!vnode.state.form.title) {
                  vnode.state.form.title = ($(vnode.dom).find('input[name=\'title\'').val() as string);
                }
                vnode.state.error = await newThread(form, quillEditorState, author);
                vnode.state.saving = false;
                if (!vnode.state.error) {
                  localStorage.removeItem(`${editorNamespace}-storedText`);
                  localStorage.removeItem(`${editorNamespace}-storedTitle`);
                  if (vnode.state.fromDraft) {
                    await app.user.discussionDrafts.delete(vnode.state.fromDraft);
                  }
                  setTimeout(() => {
                    $(vnode.dom).trigger('modalexit');
                  }, 0);
                }
              },
              label: (vnode.state.uploadsInProgress > 0)
                ? 'Uploading...' : 'Create thread',
              name: 'submission',
              tabindex: 4
            }),
            m(Button, {
              class: !author || saving || vnode.state.uploadsInProgress > 0
                ? 'disabled' : '',
              intent: 'none',
              onclick: () => {
                const { form, quillEditorState } = vnode.state;
                try {
                  vnode.state.saving = true;
                  console.log(form);
                  vnode.state.error = saveDraft(form, quillEditorState, author, vnode.state.fromDraft);
                  vnode.state.saving = false;
                  if (isModal && !vnode.state.error?.draft) {
                    notifySuccess('Draft saved');
                    localStorage.removeItem(`${editorNamespace}-storedText`);
                    localStorage.removeItem(`${editorNamespace}-storedTitle`);
                    setTimeout(() => {
                      $(vnode.dom).trigger('modalexit');
                    }, 0);
                  } else if (!vnode.state.error?.draft) {
                    m.route.set(`/${app.activeId()}`);
                  }
                } catch (e) {
                  console.error(e);
                }
              },
              label: 'Save as draft',
              name: 'save',
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
      !!discussionDrafts.length
      && m('.new-thread-form-sidebar', [
        m('h2', 'Saved drafts'),
        m(List, { interactive: true }, discussionDrafts.map((draft) => {
          const { body } = draft;
          let bodyComponent;
          if (body) {
            try {
              const doc = JSON.parse(body);
              doc.ops = doc.ops.slice(0, 3);
              bodyComponent = m(QuillFormattedText, {
                doc,
                collapse: true,
                hideFormatting: true,
              });
            } catch (e) {
              bodyComponent = m(MarkdownFormattedText, {
                doc: body,
                collapse: true,
                hideFormatting: true,
              });
            }
          }
          return m(ListItem, {
            allowOnContentClick: true,
            contentLeft: [
              m('.discussion-draft-title', draft.title || 'Untitled'),
              m('.discussion-draft-body', draft.body.length
                ? bodyComponent
                : '')
            ],
            onclick: () => loadDraft(vnode.dom, vnode.state, draft),
            selected: vnode.state.fromDraft === draft.id
          });
        })),
        m(Button, {
          class: !author || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
          intent: 'none',
          onclick: () => cancelDraft(vnode.state),
          label: 'Cancel draft',
        }),
      ])
    ]);
  }
};
