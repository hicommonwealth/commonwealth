import 'components/new_thread_form.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import Quill from 'quill-2.0-dev/quill';
import {
  Tabs, TabItem, Form, FormGroup, Input, Button,
  ButtonGroup, Icon, Icons, Grid, Col, Tooltip, List, ListItem
} from 'construct-ui';

import app from 'state';
import { OffchainTag } from 'models';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import QuillEditor from 'views/components/quill_editor';
import TagSelector from 'views/components/tag_selector';
import { detectURL, getLinkTitle, newLink, newThread, saveDraft } from 'views/pages/threads';

import QuillFormattedText from './quill_formatted_text';
import MarkdownFormattedText from './markdown_formatted_text';

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

  // First we check if the form has been updated, to avoid losing any unsaved form data
  const overwriteDraftMsg = 'Load this draft? Your current work will will not be saved.';
  const confirmed = await checkForModifications(state, overwriteDraftMsg);
  if (!confirmed) return;

  // Now we populate the form with its new contents
  let newDraftMarkdown;
  let newDraftDelta;
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
  if (newDraftDelta) {
    state.quillEditorState.editor.setContents(newDraftDelta);
  } else if (newDraftMarkdown) {
    state.quillEditorState.editor.setText(newDraftMarkdown);
  }
  titleInput.val(draft.title);
  state.form.title = draft.title;
  localStorage.setItem(`${app.activeId()}-new-discussion-storedTitle`, state.form.title);
  state.activeTag = draft.tag;
  state.form.tagName = draft.tag;
  state.fromDraft = draft.id;
  m.redraw();
};

// export const cancelDraft = async (state) => {
//   if (!state.fromDraft) {
//     return;
//   }
//   // First we check if the form has been updated, to avoid
//   // losing any unsaved form data
//   const titleInput = document.querySelector("div.new-thread-form-body input[name='title']");
//   const cancelDraftMessage = 'Discard edits? Your current work will not be saved.';
//   const confirmed = await checkForModifications(state, cancelDraftMessage);
//   if (!confirmed) return;
//   state.form.body = '';
//   state.form.title = '';
//   state.activeTag = undefined;
//   state.fromDraft = NaN;
//   (titleInput as HTMLInputElement).value = '';
//   state.quillEditorState.editor.setText('\n');
//   m.redraw();
// };

export const NewThreadForm: m.Component<{
  header: boolean,
  isModal: boolean
}, {
  activeTag: OffchainTag | string,
  autoTitleOverride,
  form: IThreadForm,
  fromDraft?: number,
  newType: string,
  quillEditorState,
  recentlySaved: number[],
  saving: boolean,
  uploadsInProgress: number,
}> = {
  oninit: (vnode_) => {
    vnode_.state.form = {};
    vnode_.state.recentlySaved = [];
    vnode_.state.uploadsInProgress = 0;
    if (vnode_.state.newType === undefined) {
      vnode_.state.newType = localStorage.getItem(`${app.activeId()}-post-type`);
      if (!vnode_.state.newType) vnode_.state.newType = 'Discussion';
    }
    const editorNamespace = vnode_.state.newType === 'Link' ? 'new-link' : 'new-discussion';
    if (!vnode_.state.form.title) {
      vnode_.state.form.title = localStorage.getItem(`${app.activeId()}-${editorNamespace}-storedTitle`);
    }
    if (editorNamespace === 'new-link' && !vnode_.state.form.url) {
      vnode_.state.form.url = localStorage.getItem(`${app.activeId()}-new-link-storedLink`);
    }
    console.log(vnode_.state.form);
  },
  view: (vnode) => {
    if (!app.community && !app.chain) return;
    const author = app.user.activeAccount;
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;
    const { isModal } = vnode.attrs;
    if (vnode.state.quillEditorState?.container) vnode.state.quillEditorState.container.tabIndex = 8;

    // init
    // if (!vnode.state.recentlySaved) vnode.state.recentlySaved = [];
    // if (vnode.state.form === undefined) vnode.state.form = {};
    // if (vnode.state.error === undefined) vnode.state.error = {};
    // if (vnode.state.uploadsInProgress === undefined) vnode.state.uploadsInProgress = 0;
    // if (vnode.state.newType === undefined) {
    //   vnode.state.newType = localStorage.getItem(`${app.activeId()}-post-type`);
    //   if (!vnode.state.newType) vnode.state.newType = 'Discussion';
    // }
    const getUrlForLinkPost = _.debounce(async () => {
      const res = await getLinkTitle(vnode.state.form.url);
      if (res === '404: Not Found' || res === '500: Server Error') {
        notifyError(res);
      } else {
        if (!vnode.state.autoTitleOverride) vnode.state.form.title = res;
      }
      m.redraw();
    }, 750);

    const editorNamespace = vnode.state.newType === 'Link' ? 'new-link' : 'new-discussion';

    const saveToLocalStorage = () => {
      // start commenting out selectively to avoid redundancy
      localStorage.setItem(`${app.activeId()}-${editorNamespace}-storedText`,
        vnode.state.quillEditorState.markdownMode
          ? vnode.state.quillEditorState.editor.getText()
          : JSON.stringify(vnode.state.quillEditorState.editor.getContents()));
      if (vnode.state.form.title) {
        localStorage.setItem(`${app.activeId()}-${editorNamespace}-storedTitle`, vnode.state.form.title);
      }
      if (localStorage.getItem(`${app.activeId()}-post-type`) === 'Link' && vnode.state.form.url) {
        localStorage.setItem(`${app.activeId()}-new-link-storedLink`, vnode.state.form.url);
      }
    };

    const discussionDrafts = app.user.discussionDrafts.store.getByCommunity(app.activeId());
    const { newType, saving } = vnode.state;

    return m('.NewThreadForm', {
      class: `${newType === 'Link' ? 'link-post' : ''} ${discussionDrafts.length > 0 ? 'has-drafts' : ''}`,
      oncreate: (vvnode) => {
        $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      m('.new-thread-form-body', [
        vnode.attrs.header && m('h2.page-title', 'New Thread'),
        m(FormGroup, [
          m(Tabs, {
            align: 'left',
            bordered: true,
            fluid: true,
          }, [
            m(TabItem, {
              label: 'Discussion',
              onclick: (e) => {
                saveToLocalStorage();
                vnode.state.newType = 'Discussion';
                localStorage.setItem(`${app.activeId()}-post-type`, 'Discussion');
              },
              active: newType === 'Discussion',
            }),
            m(TabItem, {
              label: 'Link',
              onclick: (e) => {
                saveToLocalStorage();
                vnode.state.newType = 'Link';
                localStorage.setItem(`${app.activeId()}-post-type`, 'Link');
              },
              active: newType === 'Link',
            }),
            m('.tab-spacer', { style: 'flex: 1' }),
            isModal && m.route.get() !== `${app.activeId()}/new/thread` && m(TabItem, {
              class: 'tab-right',
              label: [
                'Full editor',
                m(Icon, { name: Icons.ARROW_UP_RIGHT, style: 'margin-left: 5px;' }),
              ],
              onclick: (e) => {
                m.route.set(`/${app.activeId()}/new/thread`);
                $(e.target).trigger('modalexit');
                // TODO: transfer any discussion or link into the page editor
              },
            }),
          ]),
        ]),
        newType === 'Link' && m(Form, [
          m(FormGroup, [
            m(Input, {
              placeholder: 'https://',
              onchange: (e) => {
                const { value } = e.target as any;
                vnode.state.form.url = value;
                localStorage.setItem(`${app.activeId()}-new-link-storedLink`, vnode.state.form.url);
                if (detectURL(value)) getUrlForLinkPost();
              },
              defaultValue: localStorage.getItem(`${app.activeId()}-new-link-storedLink`),
              tabindex: 1,
            }),
          ]),
          m(FormGroup, [
            m(Input, {
              class: 'new-thread-title',
              placeholder: 'Title',
              name: 'title',
              onchange: (e) => {
                const { value } = e.target as any;
                vnode.state.autoTitleOverride = true;
                vnode.state.form.title = value;
                localStorage.setItem(`${app.activeId()}-new-link-storedTitle`, vnode.state.form.title);
              },
              defaultValue: localStorage.getItem(`${app.activeId()}-new-link-storedTitle`),
              tabindex: 1,
            }),
          ]),
          m(FormGroup, [
            m(QuillEditor, {
              contentsDoc: '', // Prevent the editor from being filled in with previous content
              oncreateBind: (state) => {
                vnode.state.quillEditorState = state;
              },
              placeholder: 'Comment (optional)',
              editorNamespace: 'new-link',
              tabindex: 3,
            })
          ]),
          m(FormGroup, [
            m(TagSelector, {
              tags: app.tags.getByCommunity(app.activeId()),
              featuredTags: app.tags.getByCommunity(app.activeId())
                .filter((ele) => activeEntityInfo.featuredTags.includes(`${ele.id}`)),
              updateFormData: (tagName: string, tagId?: number) => {
                vnode.state.form.tagName = tagName;
                vnode.state.form.tagId = tagId;
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
              onclick: async (e) => {
                if (!detectURL(vnode.state.form.url)) {
                  notifyError('Must provide a valid URL.');
                } else {
                  try {
                    await newLink(vnode.state.form, vnode.state.quillEditorState, author);
                    vnode.state.saving = false;
                    if (isModal) {
                      $(e.target).trigger('modalcomplete');
                      setTimeout(() => {
                        $(e.target).trigger('modalexit');
                      }, 0);
                    }
                  } catch (err) {
                    notifyError(err);
                  }
                }
              },
            }),
          ]),
          // error
          //   && (typeof error === 'string' || Object.keys(error).length)
          //   ? m('.error-message', [
          //     (typeof error === 'string')
          //       ? m('span', error)
          //       : Object.values(error).map((val) => m('span', `${val} `)),
          //   ])
          //   : m('.error-placeholder'),
        ]),
        //
        newType === 'Discussion' && m(Form, [
          m(FormGroup, [
            m(Input, {
              name: 'title',
              placeholder: 'Title',
              onchange: (e) => {
                vnode.state.form.title = (e as any).target.value;
                localStorage.setItem(`${app.activeId()}-new-discussion-storedTitle`, vnode.state.form.title);
              },
              defaultValue: localStorage.getItem(`${app.activeId()}-new-discussion-storedTitle`),
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
            m(TagSelector, {
              activeTag: vnode.state.activeTag,
              tags: app.tags.getByCommunity(app.activeId()),
              featuredTags: app.tags.getByCommunity(app.activeId()).filter((ele) => activeEntityInfo.featuredTags.includes(`${ele.id}`)),
              updateFormData: (tagName: string, tagId?: number) => {
                vnode.state.form.tagName = tagName;
                vnode.state.form.tagId = tagId;
              },
              tabindex: 3,
            }),
          ]),
          m(FormGroup, [
            m(Button, {
              class: !author || saving || vnode.state.uploadsInProgress > 0
                ? 'disabled' : '',
              intent: 'primary',
              onclick: async (e) => {
                vnode.state.saving = true;
                const { form, quillEditorState } = vnode.state;
                if (!vnode.state.form.title) {
                  vnode.state.form.title = ($(document).find('input[name=\'title\'').val() as string);
                }
                try {
                  await newThread(form, quillEditorState, author);
                  vnode.state.saving = false;
                  localStorage.removeItem(`${app.activeId()}-${editorNamespace}-storedText`);
                  localStorage.removeItem(`${app.activeId()}-${editorNamespace}-storedTitle`);
                  localStorage.removeItem(`${app.activeId()}-post-type`);
                  const { fromDraft } = vnode.state;
                  if (fromDraft && !vnode.state.recentlySaved.includes(fromDraft)) {
                    await app.user.discussionDrafts.delete(fromDraft);
                  }
                  setTimeout(() => {
                    $(e.target).trigger('modalexit');
                  }, 0);
                } catch (err) {
                  notifyError(err);
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
              onclick: (e) => {
                const { form, quillEditorState } = vnode.state;
                vnode.state.saving = true;
                if (!vnode.state.form.title) {
                  vnode.state.form.title = ($(document).find('input[name=\'title\'').val() as string);
                }
                try {
                  saveDraft(form, quillEditorState, author, vnode.state.fromDraft);
                  if (isModal) {
                    notifySuccess('Draft saved');
                    localStorage.removeItem(`${app.activeId()}-${editorNamespace}-storedText`);
                    localStorage.removeItem(`${app.activeId()}-${editorNamespace}-storedTitle`);
                    localStorage.removeItem(`${app.activeId()}-post-type`);
                    setTimeout(() => {
                      $(e.target).trigger('modalexit');
                    }, 0);
                  }
                  m.route.set(`/${app.activeId()}`);
                } catch (err) {
                  notifyError(err);
                }
              },
              label: 'Save as draft',
              name: 'save',
              tabindex: 4
            }),
          ]),
          // error
          //   && (typeof error === 'string' || Object.keys(error).length)
          //   ? m('.error-message', [
          //     (typeof error === 'string')
          //       ? m('span', error)
          //       : Object.values(error).map((val) => m('span', `${val} `)),
          //   ])
          //   : m('.error-placeholder'),
        ]),
      ]),
      !!discussionDrafts.length && m('.new-thread-form-sidebar', [
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
                : ''),
              m('.discussion-draft-actions', [
                m('a', {
                  href: '#',
                  onclick: async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      await app.user.discussionDrafts.delete(draft.id);
                      vnode.state.recentlySaved.push(draft.id);
                    } catch (err) {
                      notifyError(err);
                    }
                    m.redraw();
                  }
                }, 'Delete')
              ]),
            ],
            onclick: (e) => {
              const parent = $(e.target).closest('.NewThreadForm');
              loadDraft(parent, vnode.state, draft);
            },
            selected: vnode.state.fromDraft === draft.id
          });
        })),
        // m(Button, {
        //   class: !author || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
        //   intent: 'none',
        //   onclick: () => cancelDraft(vnode.state),
        //   label: 'Cancel editing draft',
        // }),
      ])
    ]);
  }
};
