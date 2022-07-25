/* @jsx m */
/* eslint-disable guard-for-in */
import 'components/new_thread_form.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import {
  Callout,
  Tabs,
  TabItem,
  Form,
  FormGroup,
  Input,
  Button,
  List,
  ListItem,
  Tag,
} from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';

import { detectURL } from 'helpers/threads';
import {
  OffchainTopic,
  DiscussionDraft,
  Account,
  OffchainThreadStage,
} from 'models';

import { notifySuccess, notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';

import { DraftParams } from 'controllers/server/drafts';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { EditProfileModal } from '../../modals/edit_profile_modal';
import { TopicSelector } from '../topic_selector';

import { QuillEditorComponent } from '../quill/quill_editor_component';
import { QuillFormattedText } from '../quill/quill_formatted_text';
import { MarkdownFormattedText } from '../quill/markdown_formatted_text';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { QuillEditor } from '../quill/quill_editor';
import { INewThreadForm, NewDraftErrors, ThreadKind } from './types';
import { updateTopicList, checkNewThreadErrors } from './helpers';

type NewThreadFormAttrs = {
  isModal: boolean;
  hasTopics: boolean;
};

export class NewThreadForm implements m.ClassComponent<NewThreadFormAttrs> {
  activeTopic: OffchainTopic | string | boolean;
  autoTitleOverride: boolean;
  form: INewThreadForm;
  fromDraft?: number;
  threadKind: string;
  quillEditorState: QuillEditor;
  overwriteConfirmationModal: boolean;
  recentlyDeletedDrafts: number[];
  saving: boolean;
  uploadsInProgress: number;

  private _getClass(isModal, draftCount) {
    return (
      `${this.form.kind === ThreadKind.Link ? 'link-post' : ''} ` +
      `${
        this.form.kind !== ThreadKind.Link && draftCount > 0 ? 'has-drafts' : ''
      } ` +
      `${isModal ? 'is-modal' : ''}`
    );
  }

  private async _newThread(
    form: INewThreadForm,
    quillEditorState: QuillEditor,
    author: Account<any>,
    stage = OffchainThreadStage.Discussion
  ) {
    const bodyText = quillEditorState.textContentsAsString;
    quillEditorState.disable();
    checkNewThreadErrors(form, bodyText);

    try {
      const result = await app.threads.create(
        author.address,
        form.kind,
        stage,
        app.activeChainId(),
        form.title,
        form.topicName,
        form.topicId,
        bodyText
      );

      navigateToSubpage(`/discussion/${result.id}`);
      updateTopicList(result.topic, app.chain);
    } catch (e) {
      quillEditorState.enable();
      throw new Error(e);
    }
  }

  private async _loadDraft(draft: DiscussionDraft) {
    this.quillEditorState.loadDocument(draft.body);
    this.form.title = draft.title;
    this.form.topicName = draft.topic;
    this.activeTopic = draft.topic;
    this.fromDraft = draft.id;

    localStorage.setItem(
      `${app.activeChainId()}-new-discussion-storedTitle`,
      draft.title
    );

    if (this.quillEditorState.alteredText) {
      this.quillEditorState.alteredText = false;
    }
  }

  private async _saveDraft(
    form: INewThreadForm,
    quillEditorState: QuillEditor,
    existingDraftId?: number
  ) {
    if (!quillEditorState || quillEditorState.isBlank()) {
      throw new Error(NewDraftErrors.InsufficientData);
    }

    const draftParams: DraftParams = {
      title: form.title,
      body: quillEditorState.textContentsAsString,
      topicName: form.topicName,
      attachments: [], // TODO: Hookup attachments
    };

    const action = existingDraftId ? 'edit' : 'create';
    if (existingDraftId) draftParams['id'] = existingDraftId;

    try {
      await app.user.discussionDrafts[action](draftParams);
    } catch (err) {
      notifyError(err);
      throw new Error(err);
    }
  }

  private _clearLocalStorage() {
    if (this.form.kind === ThreadKind.Discussion) {
      localStorage.removeItem(
        `${app.activeChainId()}-new-discussion-storedText`
      );
      localStorage.removeItem(
        `${app.activeChainId()}-new-discussion-storedTitle`
      );
    } else if (
      localStorage.getItem(`${app.activeChainId()}-post-type`) ===
      ThreadKind.Link
    ) {
      localStorage.removeItem(`${app.activeChainId()}-new-link-storedText`);
      localStorage.removeItem(`${app.activeChainId()}-new-link-storedTitle`);
      localStorage.removeItem(`${app.activeChainId()}-new-link-storedLink`);
    }
    localStorage.removeItem(`${app.activeChainId()}-active-topic`);
    localStorage.removeItem(
      `${app.activeChainId()}-active-topic-default-template`
    );
    localStorage.removeItem(`${app.activeChainId()}-post-type`);
  }

  private _populateFromLocalStorage() {
    if (this.form.kind === ThreadKind.Discussion) {
      this.form.title = localStorage.getItem(
        `${app.activeChainId()}-new-discussion-storedTitle`
      );
    } else {
      this.form.url = localStorage.getItem(
        `${app.activeChainId()}-new-link-storedLink`
      );
      this.form.title = localStorage.getItem(
        `${app.activeChainId()}-new-link-storedTitle`
      );
    }
  }

  private _saveToLocalStorage() {
    if (this.form.kind === ThreadKind.Discussion) {
      if (this.form.title) {
        localStorage.setItem(
          `${app.activeChainId()}-new-discussion-storedTitle`,
          this.form.title
        );
      }
    } else {
      if (this.form.url) {
        localStorage.setItem(
          `${app.activeChainId()}-new-link-storedLink`,
          this.form.url
        );
      }
      if (this.form.title) {
        localStorage.setItem(
          `${app.activeChainId()}-new-link-storedTitle`,
          this.form.title
        );
      }
    }
  }

  private _updateTopicState(topicName: string, topicId?: number) {
    localStorage.setItem(`${app.activeChainId()}-active-topic`, topicName);
    this.activeTopic = topicName;
    this.form.topicName = topicName;
    this.form.topicId = topicId;
  }

  oninit(vnode: m.VnodeDOM<NewThreadFormAttrs, this>) {
    const { isModal } = vnode.attrs;
    this.form = { topicName: null, topicId: null, title: null, kind: null };
    this.recentlyDeletedDrafts = [];
    this.uploadsInProgress = 0;
    this.overwriteConfirmationModal = false;
    try {
      this.activeTopic = isModal
        ? m.route.param('topic')
        : app.lastNavigatedFrom().split('/').indexOf('discussions') !== -1
        ? app.lastNavigatedFrom().split('/')[
            app.lastNavigatedFrom().split('/').indexOf('discussions') + 1
          ]
        : undefined;
    } catch (e) {
      // couldn't extract activeTopic
    }
    if (localStorage.getItem(`${app.activeChainId()}-from-draft`)) {
      this.fromDraft = Number(
        localStorage.getItem(`${app.activeChainId()}-from-draft`)
      );
      localStorage.removeItem(`${app.activeChainId()}-from-draft`);
    }
    if (this.threadKind === undefined) {
      this.threadKind =
        localStorage.getItem(`${app.activeChainId()}-post-type`) ||
        ThreadKind.Discussion;
    }
    if (this.threadKind === ThreadKind.Discussion) {
      this.form.title = localStorage.getItem(
        `${app.activeChainId()}-new-discussion-storedTitle`
      );
    } else {
      this.form.url = localStorage.getItem(
        `${app.activeChainId()}-new-link-storedLink`
      );
      this.form.title = localStorage.getItem(
        `${app.activeChainId()}-new-link-storedTitle`
      );
    }
  }

  async onremove() {
    const {
      fromDraft,
      form,
      quillEditorState,
      threadKind,
      overwriteConfirmationModal,
    } = this;
    if (threadKind === ThreadKind.Discussion && !overwriteConfirmationModal) {
      if (quillEditorState?.alteredText) {
        let confirmed = false;
        const modalMsg = fromDraft ? 'Update saved draft?' : 'Save as draft?';
        confirmed = await confirmationModalWithText(
          modalMsg,
          null,
          'Discard changes'
        )();
        if (confirmed) {
          await this._saveDraft(form, quillEditorState, fromDraft);
          notifySuccess('Draft saved');
        }
      }
      localStorage.removeItem(
        `${app.activeChainId()}-new-discussion-storedTitle`
      );
      localStorage.removeItem(
        `${app.activeChainId()}-new-discussion-storedText`
      );
      localStorage.removeItem(`${app.activeChainId()}-active-topic`);
      localStorage.removeItem(
        `${app.activeChainId()}-active-topic-default-template`
      );
      localStorage.removeItem(`${app.activeChainId()}-post-type`);
    }
  }

  view(vnode) {
    if (!app.chain) return;
    const { isModal, hasTopics } = vnode.attrs;
    const { fromDraft, saving, form } = this;
    const chainId = app.activeChainId();
    const author = app.user.activeAccount;
    const isAdmin = app.user.isAdminOfEntity({ chain: chainId });
    const threadKind = form.kind;

    const discussionDrafts =
      app.user.discussionDrafts.store.getByCommunity(chainId);
    const defaultTemplate = localStorage.getItem(
      `${chainId}-active-topic-default-template`
    );

    const topicMissing = hasTopics && !this.form?.topicName;
    const linkContentMissing = threadKind === ThreadKind.Link && !this.form.url;
    const discussionContentMissing =
      threadKind === ThreadKind.Discussion &&
      (this.quillEditorState?.isBlank() || !this.form?.title);
    const disableSave = !author || saving || this.uploadsInProgress > 0;
    const disableSubmission =
      disableSave ||
      topicMissing ||
      linkContentMissing ||
      discussionContentMissing;

    return m(
      '.NewThreadForm',
      {
        class: this._getClass(isModal, discussionDrafts.length),
        oncreate: (vvnode) => {
          $(vvnode.dom)
            .find('.cui-input input')
            .prop('autocomplete', 'off')
            .focus();
        },
      },
      [
        m('.new-thread-form-body', [
          m(FormGroup, [
            m(
              Tabs,
              {
                align: 'left',
                bordered: true,
                fluid: true,
              },
              [
                m(TabItem, {
                  label: ThreadKind.Discussion,
                  onclick: (e) => {
                    this._saveToLocalStorage();
                    this.form.kind = ThreadKind.Discussion;
                    localStorage.setItem(
                      `${chainId}-post-type`,
                      ThreadKind.Discussion
                    );
                    this._populateFromLocalStorage();
                  },
                  active: threadKind === ThreadKind.Discussion,
                }),
                m(TabItem, {
                  label: ThreadKind.Link,
                  onclick: (e) => {
                    this._saveToLocalStorage();
                    this.form.kind = ThreadKind.Link;
                    localStorage.setItem(
                      `${chainId}-post-type`,
                      ThreadKind.Link
                    );
                    this._populateFromLocalStorage();
                  },
                  active: threadKind === ThreadKind.Link,
                }),
                m('.tab-spacer', { style: 'flex: 1' }),
                isModal &&
                  m.route.get() !== `${chainId}/new/discussion` &&
                  m(TabItem, {
                    class: 'tab-right',
                    label: [
                      'Full editor',
                      m(CWIcon, {
                        iconName: 'expand',
                      }),
                    ],
                    onclick: (e) => {
                      this.overwriteConfirmationModal = true;
                      localStorage.setItem(
                        `${chainId}-from-draft`,
                        `${fromDraft}`
                      );
                      navigateToSubpage('/new/discussion');
                      $(e.target).trigger('modalexit');
                    },
                  }),
              ]
            ),
          ]),
          author?.profile &&
            !author.profile.name &&
            m(Callout, {
              class: 'no-profile-callout',
              intent: 'primary',
              content: [
                "You haven't set a display name yet. ",
                m(
                  'a',
                  {
                    href: `/${chainId}/account/${author.address}?base=${author.chain}`,
                    onclick: (e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: EditProfileModal,
                        data: {
                          account: author,
                          refreshCallback: () => m.redraw(),
                        },
                      });
                    },
                  },
                  'Set a display name'
                ),
              ],
            }),
          threadKind === ThreadKind.Link &&
            m(Form, [
              hasTopics
                ? m(FormGroup, { span: { xs: 12, sm: 5 }, order: 1 }, [
                    m(TopicSelector, {
                      defaultTopic:
                        this.activeTopic ||
                        localStorage.getItem(`${chainId}-active-topic`),
                      topics:
                        app.topics &&
                        app.topics.getByCommunity(chainId).filter((t) => {
                          return (
                            isAdmin ||
                            t.tokenThreshold.isZero() ||
                            !TopicGateCheck.isGatedTopic(t.name)
                          );
                        }),
                      updateFormData: this._updateTopicState,
                      tabindex: 1,
                    }),
                  ])
                : null,
              m(
                FormGroup,
                { span: { xs: 12, sm: hasTopics ? 7 : 12 }, order: 2 },
                [
                  m(Input, {
                    placeholder: 'https://',
                    oninput: (e) => {
                      e.redraw = false; // do not redraw on input
                      const { value } = e.target as any;
                      this.form.url = value;
                      localStorage.setItem(
                        `${chainId}-new-link-storedLink`,
                        this.form.url
                      );
                    },
                    defaultValue: this.form.url,
                    tabindex: 2,
                  }),
                ]
              ),
              m(FormGroup, { order: 3 }, [
                m(Input, {
                  class: 'new-thread-title',
                  placeholder: 'Title',
                  name: 'new-link-title',
                  autocomplete: 'off',
                  oninput: (e) => {
                    e.redraw = false; // do not redraw on input
                    const { value } = e.target as any;
                    this.autoTitleOverride = true;
                    this.form.title = value;
                    localStorage.setItem(
                      `${chainId}-new-link-storedTitle`,
                      this.form.title
                    );
                  },
                  defaultValue: this.form.title,
                  tabindex: 3,
                }),
              ]),
              m(FormGroup, { order: 4 }, [
                m(QuillEditorComponent, {
                  contentsDoc: '', // Prevent the editor from being filled in with previous content
                  oncreateBind: (state: QuillEditor) => {
                    this.quillEditorState = state;
                    if (defaultTemplate) {
                      state.loadDocument(defaultTemplate);
                    }
                  },
                  placeholder: 'Comment (optional)',
                  editorNamespace: 'new-link',
                  imageUploader: true,
                  tabindex: 4,
                }),
              ]),
              m(FormGroup, { order: 5 }, [
                m(Button, {
                  intent: 'primary',
                  label: 'Create thread',
                  name: 'submit',
                  disabled: disableSubmission,
                  rounded: true,
                  onclick: async (e) => {
                    if (!detectURL(this.form.url)) {
                      notifyError('Must provide a valid URL.');
                      return;
                    }
                    this.saving = true;
                    if (!this.form.title) {
                      this.form.title = $(e.target)
                        .closest('.NewThreadForm')
                        .find("input[name='new-link-title'")
                        .val() as string;
                    }
                    try {
                      await this._newThread(
                        this.form,
                        this.quillEditorState,
                        author
                      );
                      this.saving = false;
                      if (isModal) {
                        $(e.target).trigger('modalcomplete');
                        setTimeout(() => {
                          $(e.target).trigger('modalexit');
                          this._clearLocalStorage();
                        }, 0);
                      } else {
                        this._clearLocalStorage();
                      }
                    } catch (err) {
                      this.saving = false;
                      notifyError(err.message);
                    }
                  },
                }),
              ]),
            ]),
          //
          threadKind === ThreadKind.Discussion &&
            m(Form, [
              fromDraft
                ? m(
                    FormGroup,
                    {
                      span: 2,
                      order: { xs: 1, sm: 1 },
                      class: 'hidden-xs draft-badge-wrap',
                    },
                    [
                      m(Tag, {
                        class: 'draft-badge',
                        size: 'xs',
                        rounded: true,
                        label: 'Draft',
                      }),
                    ]
                  )
                : null,
              hasTopics
                ? m(
                    FormGroup,
                    { span: { xs: 12, sm: 5 }, order: { xs: 2, sm: 2 } },
                    [
                      m(TopicSelector, {
                        defaultTopic:
                          this.activeTopic === false || this.activeTopic
                            ? this.activeTopic
                            : localStorage.getItem(`${chainId}-active-topic`),
                        topics:
                          app.topics &&
                          app.topics.getByCommunity(chainId).filter((t) => {
                            return (
                              isAdmin ||
                              t.tokenThreshold.isZero() ||
                              !TopicGateCheck.isGatedTopic(t.name)
                            );
                          }),
                        updateFormData: this._updateTopicState,
                        tabindex: 1,
                      }),
                    ]
                  )
                : null,
              m(
                FormGroup,
                {
                  span: {
                    xs: 12,
                    sm: (hasTopics ? 7 : 12) + (fromDraft ? -2 : 0),
                  },
                  order: 3,
                },
                [
                  m(Input, {
                    name: 'new-thread-title',
                    placeholder: 'Title',
                    autocomplete: 'off',
                    oninput: (e) => {
                      e.redraw = false; // do not redraw on input
                      const { value } = (e as any).target;
                      if (
                        this.quillEditorState &&
                        !this.quillEditorState.alteredText
                      ) {
                        this.quillEditorState.alteredText = true;
                      }
                      this.form.title = value;
                      localStorage.setItem(
                        `${chainId}-new-discussion-storedTitle`,
                        this.form.title
                      );
                    },
                    defaultValue: this.form.title,
                    tabindex: 2,
                  }),
                ]
              ),
              m(FormGroup, { order: 4 }, [
                m(QuillEditorComponent, {
                  contentsDoc: '',
                  oncreateBind: (state: QuillEditor) => {
                    this.quillEditorState = state;
                    if (defaultTemplate) {
                      state.loadDocument(defaultTemplate);
                    }
                  },
                  editorNamespace: 'new-discussion',
                  imageUploader: true,
                  tabindex: 3,
                }),
              ]),
              m(FormGroup, { order: 5 }, [
                m(Button, {
                  disabled: disableSubmission,
                  intent: 'primary',
                  rounded: true,
                  onclick: async (e) => {
                    this.saving = true;
                    const { quillEditorState } = this;
                    if (!form.title) {
                      this.form.title = $(e.target)
                        .closest('.NewThreadForm')
                        .find("input[name='new-thread-title'")
                        .val() as string;
                    }
                    try {
                      await this._newThread(form, quillEditorState, author);
                      this.overwriteConfirmationModal = true;
                      this.saving = false;
                      if (
                        this.fromDraft &&
                        !this.recentlyDeletedDrafts.includes(fromDraft)
                      ) {
                        await app.user.discussionDrafts.delete(fromDraft);
                      }
                      if (isModal) {
                        setTimeout(() => {
                          $(e.target).trigger('modalexit');
                          this._clearLocalStorage();
                        }, 0);
                      } else {
                        this._clearLocalStorage();
                      }
                    } catch (err) {
                      this.saving = false;
                      notifyError(err.message);
                    }
                  },
                  label:
                    this.uploadsInProgress > 0
                      ? 'Uploading...'
                      : 'Create thread',
                  name: 'submission',
                  tabindex: 4,
                }),
                m(Button, {
                  disabled: disableSubmission,
                  intent: 'none',
                  rounded: true,
                  onclick: async (e) => {
                    // TODO Graham 7-19-22: This needs to be reduced / cleaned up / broken out
                    const { quillEditorState } = this;
                    this.saving = true;
                    const title = $(e.target)
                      .closest('.NewThreadForm')
                      .find("input[name='new-thread-title']");
                    if (!this.form.title) {
                      this.form.title = title.val() as string;
                    }
                    const fromDraft_ = this.recentlyDeletedDrafts.includes(
                      this.fromDraft
                    )
                      ? undefined
                      : this.fromDraft;
                    try {
                      await this._saveDraft(form, quillEditorState, fromDraft_);
                      this.saving = false;
                      if (isModal) {
                        notifySuccess('Draft saved');
                      }
                      this._clearLocalStorage();
                      quillEditorState.resetEditor();
                      title.val('');
                      this.activeTopic = false;
                      delete this.fromDraft;
                      this.form = {
                        topicName: null,
                        topicId: null,
                        title: null,
                        kind: ThreadKind.Discussion,
                      };
                      m.redraw();
                    } catch (err) {
                      this.saving = false;
                      notifyError(err.message);
                    }
                  },
                  label: fromDraft ? 'Update saved draft' : 'Save draft',
                  name: 'save',
                  tabindex: 5,
                }),
              ]),
            ]),
        ]),
        !!discussionDrafts.length &&
          threadKind === ThreadKind.Discussion &&
          m('.new-thread-form-sidebar', [
            m(
              List,
              {
                interactive: true,
              },
              discussionDrafts
                .sort((a, b) => a.createdAt.unix() - b.createdAt.unix())
                .map((draft) => {
                  const { body } = draft;
                  let bodyComponent;
                  if (body) {
                    try {
                      const doc = JSON.parse(body);
                      if (!doc.ops) throw new Error();
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
                    onclick: async () => {
                      const { alteredText, isBlank } = this.quillEditorState;
                      if (isBlank() || alteredText) {
                        const confirmed = await confirmationModalWithText(
                          'Load draft? Your current work will not be saved.'
                        )();
                        if (!confirmed) return;
                      }
                      this._loadDraft(draft);
                    },
                    contentRight: [
                      fromDraft === draft.id
                        ? m('.discussion-draft-title-wrap', [
                            m(CWIcon, { iconName: 'edit' }),
                            m(
                              '.discussion-draft-title',
                              draft.title || 'Untitled'
                            ),
                          ])
                        : m(
                            '.discussion-draft-title',
                            draft.title || 'Untitled'
                          ),
                      m(
                        '.discussion-draft-body',
                        draft.body.length ? bodyComponent : ''
                      ),
                      m('.discussion-draft-actions', [
                        m(
                          'a',
                          {
                            href: '#',
                            onclick: async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const confirmed = await confirmationModalWithText(
                                'Are you sure you want to delete this draft?'
                              )();
                              if (confirmed) {
                                try {
                                  await app.user.discussionDrafts.delete(
                                    draft.id
                                  );
                                  this.recentlyDeletedDrafts.push(draft.id);
                                  if (this.fromDraft === draft.id) {
                                    delete this.fromDraft;
                                    m.redraw();
                                  }
                                } catch (err) {
                                  notifyError(err.message);
                                }
                                m.redraw();
                              }
                            },
                          },
                          'Delete'
                        ),
                      ]),
                    ],
                  });
                })
            ),
          ]),
      ]
    );
  }
}
