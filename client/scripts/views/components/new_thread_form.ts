/* eslint-disable guard-for-in */
import 'components/new_thread_form.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import Quill from 'quill-2.0-dev/quill';
import {
  Tabs, TabItem, Form, FormGroup, Input, Button,
  Icon, Icons, List, ListItem, Tag,
} from 'construct-ui';

import app from 'state';
import { OffchainTopic } from 'models';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import QuillEditor from 'views/components/quill_editor';
import TopicSelector from 'views/components/topic_selector';
import { detectURL, getLinkTitle, newLink, newThread, saveDraft } from 'views/pages/threads';

import QuillFormattedText from './quill_formatted_text';
import MarkdownFormattedText from './markdown_formatted_text';

interface IThreadForm {
  topicName?: string;
  topicId?: number;
  threadTitle?: string;
  linkTitle?: string;
  url?: string;
}

enum PostType {
  Discussion = 'Discussion',
  Link = 'Link',
}

export const checkForModifications = async (state, modalMsg) => {
  const { fromDraft } = state;
  const quill = state.quillEditorState.editor;
  const Delta = Quill.import('delta');
  let confirmed = true;

  if (state.quillEditorState.alteredText) {
    confirmed = await confirmationModalWithText(modalMsg)();
  }

  // If overwritten form body comes from a previous draft, we check whether
  // there have been changes made to the draft, and prompt with a confirmation
  // modal if there have been.
  const titleInput = document.querySelector("div.new-thread-form-body input[name='new-thread-title']");
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
  const titleInput = $(dom).find('div.new-thread-form-body input[name=\'new-thread-title\']');

  // First we check if the form has been updated, to avoid losing any unsaved form data
  const overwriteDraftMsg = 'Load this draft? Your current work will not be saved.';
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
  state.form.threadTitle = draft.title;

  localStorage.setItem(`${app.activeId()}-new-discussion-storedTitle`, state.form.threadTitle);
  state.activeTopic = draft.tag;
  state.form.topicName = draft.tag;
  state.fromDraft = draft.id;
  if (state.quillEditorState?.alteredText) {
    state.quillEditorState.alteredText = false;
  }
  m.redraw();
};

// export const cancelDraft = async (state) => {
//   if (!state.fromDraft) {
//     return;
//   }
//   // First we check if the form has been updated, to avoid
//   // losing any unsaved form data
//   const titleInput = document.querySelector("div.new-thread-form-body input[name='new-thread-title']");
//   const cancelDraftMessage = 'Discard edits? Your current work will not be saved.';
//   const confirmed = await checkForModifications(state, cancelDraftMessage);
//   if (!confirmed) return;
//   state.form.body = '';
//   state.form.title = '';
//   state.activeTopic = undefined;
//   state.fromDraft = NaN;
//   (titleInput as HTMLInputElement).value = '';
//   state.quillEditorState.editor.setText('\n');
//   m.redraw();
// };

export const NewThreadForm: m.Component<{
  isModal: boolean
  hasTopics: boolean,
}, {
  activeTopic: OffchainTopic | string | boolean,
  autoTitleOverride,
  form: IThreadForm,
  fromDraft?: number,
  postType: string,
  quillEditorState,
  overwriteConfirmationModal: boolean,
  recentlyDeletedDrafts: number[],
  saving: boolean,
  uploadsInProgress: number,
}> = {
  oninit: (vnode) => {
    const { isModal } = vnode.attrs;
    vnode.state.form = {};
    vnode.state.recentlyDeletedDrafts = [];
    vnode.state.uploadsInProgress = 0;
    vnode.state.overwriteConfirmationModal = false;
    try {
      vnode.state.activeTopic = isModal
        ? m.route.param('topic')
        : app.lastNavigatedFrom().split('/').indexOf('discussions') !== -1
          ? app.lastNavigatedFrom().split('/')[app.lastNavigatedFrom().split('/').indexOf('discussions') + 1]
          : undefined;
    } catch (e) {
      // couldn't extract activeTopic
    }
    if (localStorage.getItem(`${app.activeId()}-from-draft`)) {
      vnode.state.fromDraft = Number(localStorage.getItem(`${app.activeId()}-from-draft`));
      localStorage.removeItem(`${app.activeId()}-from-draft`);
    }
    if (vnode.state.postType === undefined) {
      vnode.state.postType = localStorage.getItem(`${app.activeId()}-post-type`) || PostType.Discussion;
    }
    if (vnode.state.postType === PostType.Discussion) {
      vnode.state.form.threadTitle = localStorage.getItem(`${app.activeId()}-new-discussion-storedTitle`);
    } else {
      vnode.state.form.url = localStorage.getItem(`${app.activeId()}-new-link-storedLink`);
      vnode.state.form.linkTitle = localStorage.getItem(`${app.activeId()}-new-link-storedTitle`);
    }
  },
  onremove: async (vnode) => {
    const { fromDraft, form, quillEditorState, postType, overwriteConfirmationModal } = vnode.state;
    if (postType === PostType.Discussion && !overwriteConfirmationModal) {
      if (quillEditorState?.alteredText) {
        let confirmed = false;
        const modalMsg = fromDraft
          ? 'Update saved draft?'
          : 'Save as draft?';
        confirmed = await confirmationModalWithText(modalMsg, null, 'Discard changes')();
        if (confirmed) {
          await saveDraft(form, quillEditorState, null, fromDraft);
          notifySuccess('Draft saved');
        }
      }
      localStorage.removeItem(`${app.activeId()}-new-discussion-storedTitle`);
      localStorage.removeItem(`${app.activeId()}-new-discussion-storedText`);
      localStorage.removeItem(`${app.activeId()}-active-tag`);
      localStorage.removeItem(`${app.activeId()}-post-type`);
    }
  },
  view: (vnode) => {
    if (!app.community && !app.chain) return;
    const author = app.user.activeAccount;
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;
    const { isModal, hasTopics } = vnode.attrs;
    if (vnode.state.quillEditorState?.container) {
      vnode.state.quillEditorState.container.tabIndex = 8;
    }
    const getUrlForLinkPost = _.debounce(async () => {
      try {
        const title = await getLinkTitle(vnode.state.form.url);
        if (!vnode.state.autoTitleOverride && title) {
          localStorage.setItem(`${app.activeId()}-new-link-storedTitle`, title);
          vnode.state.form.linkTitle = title;
        }
      } catch (err) {
        notifyError(err.message);
      }
      m.redraw();
    }, 750);

    const updateTopicState = (topicName: string, topicId?: number) => {
      localStorage.setItem(`${app.activeId()}-active-tag`, topicName);
      vnode.state.activeTopic = topicName;
      vnode.state.form.topicName = topicName;
      vnode.state.form.topicId = topicId;
    };

    const saveToLocalStorage = (type: PostType) => {
      if (type === PostType.Discussion) {
        if (vnode.state.form.threadTitle) {
          localStorage.setItem(`${app.activeId()}-new-discussion-storedTitle`, vnode.state.form.threadTitle);
        }
      } else {
        if (vnode.state.form.url) {
          localStorage.setItem(`${app.activeId()}-new-link-storedLink`, vnode.state.form.url);
        }
        if (vnode.state.form.linkTitle) {
          localStorage.setItem(`${app.activeId()}-new-link-storedTitle`, vnode.state.form.linkTitle);
        }
      }
    };

    const populateFromLocalStorage = (type: PostType) => {
      if (type === PostType.Discussion) {
        vnode.state.form.threadTitle = localStorage.getItem(`${app.activeId()}-new-discussion-storedTitle`);
      } else {
        vnode.state.form.url = localStorage.getItem(`${app.activeId()}-new-link-storedLink`);
        vnode.state.form.linkTitle = localStorage.getItem(`${app.activeId()}-new-link-storedTitle`);
      }
    };

    const clearLocalStorage = (type: PostType) => {
      if (type === PostType.Discussion) {
        localStorage.removeItem(`${app.activeId()}-new-discussion-storedText`);
        localStorage.removeItem(`${app.activeId()}-new-discussion-storedTitle`);
      } else if (localStorage.getItem(`${app.activeId()}-post-type`) === PostType.Link) {
        localStorage.removeItem(`${app.activeId()}-new-link-storedText`);
        localStorage.removeItem(`${app.activeId()}-new-link-storedTitle`);
        localStorage.removeItem(`${app.activeId()}-new-link-storedLink`);
      }
      localStorage.removeItem(`${app.activeId()}-active-tag`);
      localStorage.removeItem(`${app.activeId()}-post-type`);
    };

    const discussionDrafts = app.user.discussionDrafts.store.getByCommunity(app.activeId());
    const { fromDraft, postType, saving } = vnode.state;

    return m('.NewThreadForm', {
      class: `${postType === PostType.Link ? 'link-post' : ''} `
        + `${postType !== PostType.Link && discussionDrafts.length > 0 ? 'has-drafts' : ''} `
        + `${isModal ? 'is-modal' : ''}`,
      oncreate: (vvnode) => {
        $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      m('.new-thread-form-body', [
        m(FormGroup, [
          m(Tabs, {
            align: 'left',
            bordered: true,
            fluid: true,
          }, [
            m(TabItem, {
              label: PostType.Discussion,
              onclick: (e) => {
                saveToLocalStorage(PostType.Link);
                vnode.state.postType = PostType.Discussion;
                localStorage.setItem(`${app.activeId()}-post-type`, PostType.Discussion);
                populateFromLocalStorage(PostType.Discussion);
              },
              active: postType === PostType.Discussion,
            }),
            m(TabItem, {
              label: PostType.Link,
              onclick: (e) => {
                saveToLocalStorage(PostType.Discussion);
                vnode.state.postType = PostType.Link;
                localStorage.setItem(`${app.activeId()}-post-type`, PostType.Link);
                populateFromLocalStorage(PostType.Link);
              },
              active: postType === PostType.Link,
            }),
            m('.tab-spacer', { style: 'flex: 1' }),
            isModal && m.route.get() !== `${app.activeId()}/new/thread` && m(TabItem, {
              class: 'tab-right',
              label: [
                'Full editor',
                m(Icon, { name: Icons.ARROW_UP_RIGHT, style: 'margin-left: 5px;' }),
              ],
              onclick: (e) => {
                vnode.state.overwriteConfirmationModal = true;
                localStorage.setItem(`${app.activeId()}-from-draft`, `${fromDraft}`);
                m.route.set(`/${app.activeId()}/new/thread`);
                $(e.target).trigger('modalexit');
              },
            }),
          ]),
        ]),
        postType === PostType.Link && m(Form, [
          hasTopics
            ? m(FormGroup, { span: { xs: 12, sm: 4 }, order: 1 }, [
              m(TopicSelector, {
                defaultTopic: vnode.state.activeTopic || localStorage.getItem(`${app.activeId()}-active-tag`),
                topics: app.topics.getByCommunity(app.activeId()),
                featuredTopics: app.topics.getByCommunity(app.activeId())
                  .filter((ele) => activeEntityInfo.featuredTopics.includes(`${ele.id}`)),
                updateFormData: updateTopicState,
                tabindex: 1,
              }),
            ])
            : null,
          m(FormGroup, { span: { xs: 12, sm: (hasTopics ? 8 : 12) }, order: 2 }, [
            m(Input, {
              placeholder: 'https://',
              oninput: (e) => {
                const { value } = e.target as any;
                vnode.state.form.url = value;
                localStorage.setItem(`${app.activeId()}-new-link-storedLink`, vnode.state.form.url);
                if (detectURL(value)) getUrlForLinkPost();
              },
              defaultValue: vnode.state.form.url,
              tabindex: 2,
            }),
          ]),
          m(FormGroup, { order: 3 },  [
            m(Input, {
              class: 'new-thread-title',
              placeholder: 'Title',
              name: 'new-link-title',
              autocomplete: 'off',
              oninput: (e) => {
                const { value } = e.target as any;
                vnode.state.autoTitleOverride = true;
                vnode.state.form.linkTitle = value;
                localStorage.setItem(`${app.activeId()}-new-link-storedTitle`, vnode.state.form.linkTitle);
              },
              defaultValue: vnode.state.form.linkTitle,
              tabindex: 3,
            }),
          ]),
          m(FormGroup, { order: 4 }, [
            m(QuillEditor, {
              contentsDoc: '', // Prevent the editor from being filled in with previous content
              oncreateBind: (state) => {
                vnode.state.quillEditorState = state;
              },
              placeholder: 'Comment (optional)',
              editorNamespace: 'new-link',
              tabindex: 4,
            })
          ]),
          m(FormGroup, { order: 5 }, [
            m(Button, {
              intent: 'primary',
              label: 'Create thread',
              name: 'submit',
              disabled: !author || vnode.state.saving,
              onclick: async (e) => {
                if (!detectURL(vnode.state.form.url)) {
                  notifyError('Must provide a valid URL.');
                  return;
                }
                vnode.state.saving = true;
                if (!vnode.state.form.linkTitle) {
                  vnode.state.form.linkTitle = (
                    $(e.target).closest('.NewThreadForm').find('input[name=\'new-link-title\'').val() as string
                  );
                }
                try {
                  await newLink(vnode.state.form, vnode.state.quillEditorState, author);
                  vnode.state.saving = false;
                  if (isModal) {
                    $(e.target).trigger('modalcomplete');
                    setTimeout(() => {
                      $(e.target).trigger('modalexit');
                      clearLocalStorage(PostType.Link);
                    }, 0);
                  } else {
                    clearLocalStorage(PostType.Discussion);
                  }
                } catch (err) {
                  vnode.state.saving = false;
                  notifyError(err.message);
                }
              },
            }),
          ]),
        ]),
        //
        postType === PostType.Discussion && m(Form, [
          fromDraft
            ? m(FormGroup, { span: 2, order: { xs: 1, sm: 1 }, class: 'hidden-xs draft-badge-wrap' }, [
              m(Tag, {
                class: 'draft-badge',
                size: 'xs',
                rounded: true,
                label: 'Draft',
              })
            ])
            : null,
          hasTopics
            ? m(FormGroup, { span: { xs: 12, sm: 4 }, order: { xs: 2, sm: 2 } }, [
              m(TopicSelector, {
                defaultTopic: (vnode.state.activeTopic === false || vnode.state.activeTopic)
                  ? vnode.state.activeTopic
                  : localStorage.getItem(`${app.activeId()}-active-tag`),
                topics: app.topics.getByCommunity(app.activeId()),
                featuredTopics: app.topics.getByCommunity(app.activeId())
                  .filter((ele) => activeEntityInfo.featuredTopics.includes(`${ele.id}`)),
                updateFormData: updateTopicState,
                tabindex: 1,
              }),
            ])
            : null,
          m(FormGroup, { span: { xs: 12, sm: (hasTopics ? 8 : 12) + (fromDraft ? -2 : 0) }, order: 3 }, [
            m(Input, {
              name: 'new-thread-title',
              placeholder: 'Title',
              autocomplete: 'off',
              oninput: (e) => {
                const { value } = (e as any).target;
                if (vnode.state.quillEditorState && !vnode.state.quillEditorState.alteredText) {
                  vnode.state.quillEditorState.alteredText = true;
                }
                vnode.state.form.threadTitle = value;
                localStorage.setItem(`${app.activeId()}-new-discussion-storedTitle`, vnode.state.form.threadTitle);
              },
              defaultValue: vnode.state.form.threadTitle,
              tabindex: 2,
            }),
          ]),
          m(FormGroup, { order: 4 }, [
            m(QuillEditor, {
              contentsDoc: '',
              oncreateBind: (state) => {
                vnode.state.quillEditorState = state;
              },
              editorNamespace: 'new-discussion',
              tabindex: 3,
            }),
          ]),
          m(FormGroup, { order: 5 }, [
            m(Button, {
              disabled: !author || saving || vnode.state.uploadsInProgress > 0,
              intent: 'primary',
              onclick: async (e) => {
                vnode.state.saving = true;
                const { form, quillEditorState } = vnode.state;
                if (!vnode.state.form.threadTitle) {
                  vnode.state.form.threadTitle = (
                    $(e.target).closest('.NewThreadForm').find('input[name=\'new-thread-title\'').val() as string
                  );
                }
                try {
                  await newThread(form, quillEditorState, author);
                  vnode.state.overwriteConfirmationModal = true;
                  vnode.state.saving = false;
                  if (vnode.state.fromDraft && !vnode.state.recentlyDeletedDrafts.includes(fromDraft)) {
                    await app.user.discussionDrafts.delete(fromDraft);
                  }
                  if (isModal) {
                    setTimeout(() => {
                      $(e.target).trigger('modalexit');
                      clearLocalStorage(PostType.Discussion);
                    }, 0);
                  } else {
                    clearLocalStorage(PostType.Discussion);
                  }
                } catch (err) {
                  vnode.state.saving = false;
                  notifyError(err.message);
                }
              },
              label: (vnode.state.uploadsInProgress > 0)
                ? 'Uploading...' : 'Create thread',
              name: 'submission',
              tabindex: 4
            }),
            m(Button, {
              disabled: !author || saving || vnode.state.uploadsInProgress > 0
                || (fromDraft && !vnode.state.quillEditorState?.alteredText),
              intent: 'none',
              onclick: async (e) => {
                const { form, quillEditorState } = vnode.state;
                vnode.state.saving = true;
                const title = $(e.target).closest('.NewThreadForm').find('input[name=\'new-thread-title\']');
                if (!vnode.state.form.threadTitle) {
                  vnode.state.form.threadTitle = (title.val() as string);
                }
                const fromDraft_ = (vnode.state.recentlyDeletedDrafts.includes(vnode.state.fromDraft))
                  ? undefined
                  : vnode.state.fromDraft;
                try {
                  await saveDraft(form, quillEditorState, author, fromDraft_);
                  vnode.state.saving = false;
                  vnode.state.quillEditorState.alteredText = false;
                  if (isModal) {
                    notifySuccess('Draft saved');
                  }
                  clearLocalStorage(PostType.Discussion);
                  vnode.state.quillEditorState.editor.setContents([{ insert: '\n' }]);
                  title.val('');
                  vnode.state.activeTopic = false;
                  delete vnode.state.fromDraft;
                  vnode.state.form = {};
                  m.redraw();
                } catch (err) {
                  vnode.state.saving = false;
                  notifyError(err.message);
                }
              },
              label: fromDraft
                ? 'Update saved draft'
                : 'Save draft',
              name: 'save',
              tabindex: 5
            }),
          ]),
        ]),
      ]),
      !!discussionDrafts.length
      && postType === PostType.Discussion
      && m('.new-thread-form-sidebar', [
        m(List, {
          interactive: true
        }, discussionDrafts.sort((a, b) => a.createdAt - b.createdAt).map((draft) => {
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
            selected: fromDraft === draft.id,
            onclick: (e) => {
              const parent = $(e.target).closest('.NewThreadForm');
              loadDraft(parent, vnode.state, draft);
            },
            contentRight: [
              fromDraft === draft.id
                ? m('.discussion-draft-title-wrap', [
                  m(Icon, { name: Icons.EDIT }),
                  m('.discussion-draft-title', draft.title || 'Untitled'),
                ])
                : m('.discussion-draft-title', draft.title || 'Untitled'),
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
                      vnode.state.recentlyDeletedDrafts.push(draft.id);
                    } catch (err) {
                      notifyError(err.message);
                    }
                    m.redraw();
                  }
                }, 'Delete')
              ]),
            ],
          });
        })),
        // m(Button, {
        //   disabled: !author || vnode.state.uploadsInProgress > 0,
        //   intent: 'none',
        //   onclick: () => cancelDraft(vnode.state),
        //   label: 'Cancel editing draft',
        // }),
      ])
    ]);
  }
};
