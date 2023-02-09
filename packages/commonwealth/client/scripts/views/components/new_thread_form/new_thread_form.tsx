import React from 'react';

import {
  ClassComponent,
  getRoute,
  getRouteParam,
  redraw,
} from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import { navigateToSubpage } from 'router';

import 'components/new_thread_form.scss';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import type { DraftParams } from 'controllers/server/drafts';
import { detectURL } from 'helpers/threads';
import $ from 'jquery';
import { capitalize } from 'lodash';
import type { Account, DiscussionDraft, Topic } from 'models';
import { ThreadKind, ThreadStage } from 'models';

import app from 'state';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { EditProfileModal } from '../../modals/edit_profile_modal';
import { CWButton } from '../component_kit/cw_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWTab, CWTabBar } from '../component_kit/cw_tabs';
import { CWText } from '../component_kit/cw_text';
import { CWTextInput } from '../component_kit/cw_text_input';
import { getClasses } from '../component_kit/helpers';
import { renderQuillTextBody } from '../quill/helpers';
import type { QuillEditor } from '../quill/quill_editor';
import { QuillEditorComponent } from '../quill/quill_editor_component';
import { TopicSelector } from '../topic_selector';
import { checkNewThreadErrors, updateTopicList } from './helpers';
import type { NewThreadFormType } from './types';
import { NewDraftErrors } from './types';

type NewThreadFormAttrs = {
  hasTopics: boolean;
  isModal: boolean;
};

export class NewThreadForm extends ClassComponent<NewThreadFormAttrs> {
  activeTopic: Topic | string | boolean;
  autoTitleOverride: boolean;
  form: NewThreadFormType;
  fromDraft?: number;
  quillEditorState: QuillEditor;
  overwriteConfirmationModal: boolean;
  recentlyDeletedDrafts: number[];
  saving: boolean;
  uploadsInProgress: number;

  private async _newThread(
    form: NewThreadFormType,
    quillEditorState: QuillEditor,
    author: Account,
    stage = ThreadStage.Discussion
  ) {
    const body = quillEditorState.textContentsAsString;
    quillEditorState.disable();
    checkNewThreadErrors(form, body);

    try {
      const result = await app.threads.create(
        author.address,
        form.kind,
        stage,
        app.activeChainId(),
        form.title,
        form.topic,
        body,
        form.url
      );

      navigateToSubpage(`/discussion/${result.id}`);
      updateTopicList(result.topic, app.chain);
    } catch (e) {
      quillEditorState.enable();
      throw new Error(e);
    }
  }

  // TODO: This isn't working
  private async _loadDraft(draft: DiscussionDraft) {
    if (!this) throw new Error('no this');
    this.quillEditorState.loadDocument(draft.body);
    const titleEle = document.querySelector(
      'input[name="new-thread-title"]'
    ) as HTMLInputElement;
    titleEle.value = draft.title;
    this.form.title = draft.title;
    this.form.topic = app.topics.getByName(draft.topic, draft.chain);
    this.activeTopic = this.form.topic;
    this.fromDraft = draft.id;

    localStorage.setItem(
      `${app.activeChainId()}-new-discussion-storedTitle`,
      draft.title
    );

    if (this.quillEditorState.alteredText) {
      this.quillEditorState.alteredText = false;
    }

    redraw();
  }

  private async _saveDraft(
    form: NewThreadFormType,
    quillEditorState: QuillEditor,
    existingDraftId?: number
  ) {
    if (!quillEditorState || quillEditorState.isBlank()) {
      throw new Error(NewDraftErrors.InsufficientData);
    }

    const draftParams: DraftParams = {
      title: form.title,
      body: quillEditorState.textContentsAsString,
      topicName: form.topic.name,
      attachments: [], // TODO: Hookup attachments
    };

    const action = existingDraftId ? 'edit' : 'create';
    if (existingDraftId) draftParams['existingDraftId'] = existingDraftId;
    try {
      await app.user.discussionDrafts[action](draftParams);
    } catch (err) {
      notifyError(err);
      throw new Error(err);
    }
  }

  private _populateFromLocalStorage() {
    if (!this) throw new Error('no this');
    if (this.form.kind === ThreadKind.Discussion) {
      this.form.title = localStorage.getItem(
        `${app.activeChainId()}-new-discussion-storedTitle`
      );
    } else if (this.form.kind === ThreadKind.Link) {
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
    } else if (this.form.kind === ThreadKind.Link) {
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

  private _updateTopicState(topic: Topic) {
    localStorage.setItem(`${app.activeChainId()}-active-topic`, topic.name);
    this.activeTopic = topic;
    this.form.topic = topic;
  }

  oninit(vnode: ResultNode<NewThreadFormAttrs>) {
    const { isModal } = vnode.attrs;
    this.form = {
      topic: null,
      title: null,
      kind: ThreadKind.Discussion,
    };
    this.recentlyDeletedDrafts = [];
    this.uploadsInProgress = 0;
    this.overwriteConfirmationModal = false;
    try {
      this.activeTopic = isModal
        ? getRouteParam('topic')
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
    if (this.form.kind === undefined) {
      this.form.kind = ThreadKind.Discussion;
    }
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

  async onremove() {
    const { fromDraft, form, quillEditorState, overwriteConfirmationModal } =
      this;
    if (
      this.form.kind === ThreadKind.Discussion &&
      !overwriteConfirmationModal
    ) {
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

  view(vnode: ResultNode<NewThreadFormAttrs>) {
    if (!app.chain) return;
    const { isModal, hasTopics } = vnode.attrs;
    const { fromDraft, saving, form } = this;
    const chainId = app.activeChainId();
    const author = app.user.activeAccount;
    const isAdmin = app.roles.isAdminOfEntity({ chain: chainId });

    const discussionDrafts =
      app.user.discussionDrafts.store.getByCommunity(chainId);

    const defaultTemplate = localStorage.getItem(
      `${chainId}-active-topic-default-template`
    );

    const topicMissing = hasTopics && !this.form?.topic;

    const linkContentMissing =
      this.form.kind === ThreadKind.Link && !this.form.url;

    const discussionContentMissing =
      this.form.kind === ThreadKind.Discussion &&
      (this.quillEditorState?.isBlank() || !this.form?.title);

    const disableSave = !author || saving || this.uploadsInProgress > 0;

    const disableSubmission =
      disableSave ||
      topicMissing ||
      linkContentMissing ||
      discussionContentMissing;

    return (
      <div
        className={getClasses<{ isModal?: boolean }>(
          { isModal },
          'NewThreadForm'
        )}
      >
        <div className="new-thread-header">
          <CWTabBar>
            <CWTab
              label={capitalize(ThreadKind.Discussion)}
              onClick={() => {
                this._saveToLocalStorage();
                this.form.kind = ThreadKind.Discussion;
                localStorage.setItem(
                  `${chainId}-post-type`,
                  ThreadKind.Discussion
                );
                this._populateFromLocalStorage();
              }}
              isSelected={this.form.kind === ThreadKind.Discussion}
            />
            <CWTab
              label={capitalize(ThreadKind.Link)}
              onClick={() => {
                this._saveToLocalStorage();
                this.form.kind = ThreadKind.Link;
                localStorage.setItem(`${chainId}-post-type`, ThreadKind.Link);
                this._populateFromLocalStorage();
              }}
              isSelected={this.form.kind === ThreadKind.Link}
            />
          </CWTabBar>
          {isModal && getRoute() !== `${chainId}/new/discussion` && (
            <CWButton
              label="Full editor"
              iconLeft="expand"
              buttonType="tertiary-blue"
              onClick={(e) => {
                this.overwriteConfirmationModal = true;
                localStorage.setItem(`${chainId}-from-draft`, `${fromDraft}`);
                navigateToSubpage('/new/discussion');
                $(e.target).trigger('modalexit');
              }}
            />
          )}
        </div>
        <div className="new-thread-body">
          <div className="new-thread-form-inputs">
            {author?.profile && !author.profile.name && (
              <div className="set-display-name-callout">
                <CWText>You haven't set a display name yet.</CWText>
                <a
                  href={`/${chainId}/account/${author.address}?base=${author.chain.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    app.modals.create({
                      modal: EditProfileModal,
                      data: {
                        account: author,
                        refreshCallback: () => redraw(),
                      },
                    });
                    redraw();
                  }}
                >
                  Set a display name
                </a>
              </div>
            )}
            {this.form.kind === ThreadKind.Discussion && (
              <>
                {!!fromDraft && <CWText className="draft-text">Draft</CWText>}
                <div className="topics-and-title-row">
                  {hasTopics && (
                    <TopicSelector
                      defaultTopic={
                        this.activeTopic === false || this.activeTopic
                          ? this.activeTopic
                          : localStorage.getItem(`${chainId}-active-topic`)
                      }
                      topics={
                        app.topics &&
                        app.topics.getByCommunity(chainId).filter((t) => {
                          return (
                            isAdmin ||
                            t.tokenThreshold.isZero() ||
                            !TopicGateCheck.isGatedTopic(t.name)
                          );
                        })
                      }
                      updateFormData={this._updateTopicState.bind(this)}
                      tabIndex={1}
                    />
                  )}
                  <CWTextInput
                    autoFocus
                    name="new-thread-title"
                    placeholder="Title"
                    onInput={(e) => {
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
                    }}
                    value={this.form.title}
                    tabIndex={2}
                  />
                </div>
                <QuillEditorComponent
                  contentsDoc=""
                  oncreateBind={(state: QuillEditor) => {
                    this.quillEditorState = state;
                    if (defaultTemplate) {
                      state.loadDocument(defaultTemplate);
                    }
                  }}
                  editorNamespace="new-discussion"
                  imageUploader
                  tabIndex={3}
                />
                <div className="buttons-row">
                  <CWButton
                    disabled={disableSubmission}
                    onClick={async (e) => {
                      this.saving = true;

                      try {
                        await this._newThread(
                          form,
                          this.quillEditorState,
                          author
                        );
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
                            this.quillEditorState.clearLocalStorage();
                          }, 0);
                        } else {
                          this.quillEditorState.clearLocalStorage();
                        }
                      } catch (err) {
                        this.saving = false;
                        notifyError(err.message);
                      }
                    }}
                    label={
                      this.uploadsInProgress > 0
                        ? 'Uploading...'
                        : 'Create thread'
                    }
                    tabIndex={4}
                  />
                  <CWButton
                    disabled={disableSubmission}
                    buttonType="tertiary-blue"
                    onClick={async (e) => {
                      // TODO Graham 7-19-22: This needs to be reduced / cleaned up / broken out
                      this.saving = true;

                      const existingDraftId =
                        this.recentlyDeletedDrafts.includes(this.fromDraft)
                          ? undefined
                          : this.fromDraft;

                      try {
                        await this._saveDraft(
                          form,
                          this.quillEditorState,
                          existingDraftId
                        );
                        this.saving = false;
                        if (isModal) {
                          notifySuccess('Draft saved');
                        }
                        redraw();
                      } catch (err) {
                        this.saving = false;
                        notifyError(err.message);
                      }
                    }}
                    label={fromDraft ? 'Update saved draft' : 'Save draft'}
                    tabIndex={5}
                  />
                </div>
              </>
            )}
            {this.form.kind === ThreadKind.Link && hasTopics && (
              <>
                <div className="topics-and-title-row">
                  <TopicSelector
                    defaultTopic={
                      this.activeTopic ||
                      localStorage.getItem(`${chainId}-active-topic`)
                    }
                    topics={
                      app.topics &&
                      app.topics.getByCommunity(chainId).filter((t) => {
                        return (
                          isAdmin ||
                          t.tokenThreshold.isZero() ||
                          !TopicGateCheck.isGatedTopic(t.name)
                        );
                      })
                    }
                    updateFormData={this._updateTopicState.bind(this)}
                    tabIndex={1}
                  />
                  <CWTextInput
                    placeholder="Title"
                    name="new-link-title"
                    onInput={(e) => {
                      e.redraw = false; // do not redraw on input
                      const { value } = e.target as any;
                      this.autoTitleOverride = true;
                      this.form.title = value;
                      localStorage.setItem(
                        `${chainId}-new-link-storedTitle`,
                        this.form.title
                      );
                    }}
                    value={this.form.title}
                    tabIndex={3}
                  />
                </div>
                <CWTextInput
                  placeholder="https://"
                  onInput={(e) => {
                    e.redraw = false; // do not redraw on input
                    const { value } = e.target as any;
                    this.form.url = value;
                    localStorage.setItem(
                      `${chainId}-new-link-storedLink`,
                      this.form.url
                    );
                  }}
                  value={this.form.url}
                  tabIndex={2}
                />
                <QuillEditorComponent
                  contentsDoc="" // Prevent the editor from being filled in with previous content
                  oncreateBind={(state: QuillEditor) => {
                    this.quillEditorState = state;
                    if (defaultTemplate) {
                      state.loadDocument(defaultTemplate);
                    }
                  }}
                  placeholder="Comment (optional)"
                  editorNamespace="new-link"
                  imageUploader
                  tabIndex={4}
                />
                <CWButton
                  label="Create thread"
                  disabled={disableSubmission}
                  onClick={async (e) => {
                    if (!detectURL(this.form.url)) {
                      notifyError('Must provide a valid URL.');
                      return;
                    }

                    this.saving = true;

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
                          this.quillEditorState.clearLocalStorage();
                        }, 0);
                      } else {
                        this.quillEditorState.clearLocalStorage();
                      }
                    } catch (err) {
                      this.saving = false;
                      notifyError(err.message);
                    }
                  }}
                />
              </>
            )}
          </div>
          {!!discussionDrafts.length &&
            this.form.kind === ThreadKind.Discussion && (
              <div className="drafts-list-container">
                <CWText
                  type="h5"
                  fontWeight="semiBold"
                  className="drafts-list-title-text"
                >
                  Drafts
                </CWText>
                <div className="drafts-list">
                  {discussionDrafts
                    .sort((a, b) => a.createdAt.unix() - b.createdAt.unix())
                    .map((draft) => {
                      const title = draft.title || 'Untitled';

                      return (
                        <div
                          className={getClasses<{ isSelected: boolean }>(
                            { isSelected: fromDraft === draft.id },
                            'draft-item'
                          )}
                          onClick={async (e) => {
                            e.preventDefault();
                            if (
                              !this.quillEditorState.isBlank() ||
                              this.quillEditorState.alteredText
                            ) {
                              const confirmed = await confirmationModalWithText(
                                'Load draft? Your current work will not be saved.'
                              )();
                              if (!confirmed) return;
                            }
                            this._loadDraft(draft);
                          }}
                        >
                          <div className="draft-title">
                            {fromDraft === draft.id ? (
                              <>
                                <CWIcon iconName="write" iconSize="small" />
                                <CWText
                                  fontWeight="semiBold"
                                  noWrap
                                  title={title}
                                >
                                  {title}
                                </CWText>
                              </>
                            ) : (
                              <CWText
                                fontWeight="semiBold"
                                noWrap
                                title={title}
                              >
                                {title}
                              </CWText>
                            )}
                          </div>
                          {draft.body.length > 0 &&
                            renderQuillTextBody(draft.body, {
                              hideFormatting: true,
                              collapse: true,
                            })}
                          <CWText
                            className="draft-delete-text"
                            onClick={async (e) => {
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
                                    redraw();
                                  }
                                } catch (err) {
                                  notifyError(err.message);
                                }
                                redraw();
                              }
                            }}
                          >
                            Delete
                          </CWText>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }
}
