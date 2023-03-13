/* @jsx m */

import { navigateToSubpage } from 'router';
import ClassComponent from 'class_component';

import 'components/new_thread_form.scss';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import type { DraftParams } from 'controllers/server/drafts';
import { detectURL } from 'helpers/threads';
import $ from 'jquery';
import { capitalize } from 'lodash';
import m from 'mithril';
import type { DiscussionDraft, Topic } from 'models';
import { ThreadKind, ThreadStage } from 'models';

import app from 'state';
import { confirmationModalWithText } from '../../modals/confirm_modal';
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
import type AddressAccount from 'models/AddressAccount';

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
    author: AddressAccount,
    stage = ThreadStage.Discussion
  ) {
    const body = quillEditorState.textContentsAsString;
    quillEditorState.disable();
    checkNewThreadErrors(form, body);

    const { session, action, hash } = await app.sessions.signThread({
      community: app.activeChainId(),
      title: form.title,
      body,
      link: form.url,
      topic: form.topic.id,
    });

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

    m.redraw();
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

  oninit(vnode: m.Vnode<NewThreadFormAttrs>) {
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

  view(vnode: m.Vnode<NewThreadFormAttrs>) {
    if (!app.chain) return;
    const { isModal, hasTopics } = vnode.attrs;
    const { fromDraft, saving, form } = this;
    const chainId = app.activeChainId();
    const author = app.user.activeAddressAccount;
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
        class={getClasses<{ isModal?: boolean }>({ isModal }, 'NewThreadForm')}
      >
        <div class="new-thread-header">
          <CWTabBar>
            <CWTab
              label={capitalize(ThreadKind.Discussion)}
              onclick={() => {
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
              onclick={() => {
                this._saveToLocalStorage();
                this.form.kind = ThreadKind.Link;
                localStorage.setItem(`${chainId}-post-type`, ThreadKind.Link);
                this._populateFromLocalStorage();
              }}
              isSelected={this.form.kind === ThreadKind.Link}
            />
          </CWTabBar>
          {isModal && m.route.get() !== `${chainId}/new/discussion` && (
            <CWButton
              label="Full editor"
              iconLeft="expand"
              buttonType="tertiary-blue"
              onclick={(e) => {
                this.overwriteConfirmationModal = true;
                localStorage.setItem(`${chainId}-from-draft`, `${fromDraft}`);
                navigateToSubpage('/new/discussion');
                $(e.target).trigger('modalexit');
              }}
            />
          )}
        </div>
        <div class="new-thread-body">
          <div class="new-thread-form-inputs">
            {this.form.kind === ThreadKind.Discussion && (
              <>
                {!!fromDraft && <CWText className="draft-text">Draft</CWText>}
                <div class="topics-and-title-row">
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
                      tabindex={1}
                    />
                  )}
                  <CWTextInput
                    autofocus
                    name="new-thread-title"
                    placeholder="Title"
                    oninput={(e) => {
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
                    tabindex={2}
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
                  tabindex={3}
                />
                <div class="buttons-row">
                  <CWButton
                    disabled={disableSubmission}
                    onclick={async (e) => {
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
                        if (err) notifyError(err.message);
                        m.redraw();
                      }
                    }}
                    label={
                      this.uploadsInProgress > 0
                        ? 'Uploading...'
                        : 'Create thread'
                    }
                    name="submission"
                    tabindex={4}
                  />
                  <CWButton
                    disabled={disableSubmission}
                    buttonType="tertiary-blue"
                    onclick={async (e) => {
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
                        m.redraw();
                      } catch (err) {
                        this.saving = false;
                        if (err) notifyError(err.message);
                        m.redraw();
                      }
                    }}
                    label={fromDraft ? 'Update saved draft' : 'Save draft'}
                    name="save"
                    tabindex={5}
                  />
                </div>
              </>
            )}
            {this.form.kind === ThreadKind.Link && hasTopics && (
              <>
                <div class="topics-and-title-row">
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
                    tabindex={1}
                  />
                  <CWTextInput
                    placeholder="Title"
                    name="new-link-title"
                    oninput={(e) => {
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
                    tabindex={3}
                  />
                </div>
                <CWTextInput
                  placeholder="https://"
                  oninput={(e) => {
                    e.redraw = false; // do not redraw on input
                    const { value } = e.target as any;
                    this.form.url = value;
                    localStorage.setItem(
                      `${chainId}-new-link-storedLink`,
                      this.form.url
                    );
                  }}
                  value={this.form.url}
                  tabindex={2}
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
                  tabindex={4}
                />
                <CWButton
                  label="Create thread"
                  name="submit"
                  disabled={disableSubmission}
                  onclick={async (e) => {
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
              <div class="drafts-list-container">
                <CWText
                  type="h5"
                  fontWeight="semiBold"
                  className="drafts-list-title-text"
                >
                  Drafts
                </CWText>
                <div class="drafts-list">
                  {discussionDrafts
                    .sort((a, b) => a.createdAt.unix() - b.createdAt.unix())
                    .map((draft) => {
                      const title = draft.title || 'Untitled';

                      return (
                        <div
                          class={getClasses<{ isSelected: boolean }>(
                            { isSelected: fromDraft === draft.id },
                            'draft-item'
                          )}
                          onclick={async (e) => {
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
                          <div class="draft-title">
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
                            onclick={async (e) => {
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
