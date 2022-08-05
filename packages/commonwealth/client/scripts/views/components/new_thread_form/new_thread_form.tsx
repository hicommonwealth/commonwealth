/* @jsx m */

import m from 'mithril';
import { capitalize } from 'lodash';
import $ from 'jquery';
import { List, ListItem } from 'construct-ui';

import 'components/new_thread_form.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { detectURL } from 'helpers/threads';
import {
  Topic,
  DiscussionDraft,
  Account,
  ThreadStage,
  ThreadKind,
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
import { NewThreadFormType, NewDraftErrors } from './types';
import { updateTopicList, checkNewThreadErrors } from './helpers';
import { CWTabBar, CWTab } from '../component_kit/cw_tabs';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import { getClasses } from '../component_kit/helpers';

type NewThreadFormAttrs = {
  hasTopics: boolean;
  isModal: boolean;
};

export class NewThreadForm implements m.ClassComponent<NewThreadFormAttrs> {
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
    author: Account<any>,
    stage = ThreadStage.Discussion
  ) {
    if (!this) throw new Error('no this');
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

  // TODO: This isn't working
  private async _loadDraft(draft: DiscussionDraft) {
    if (!this) throw new Error('no this');
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
      topicName: form.topicName,
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

  private _updateTopicState(topicName: string, topicId?: number) {
    localStorage.setItem(`${app.activeChainId()}-active-topic`, topicName);
    this.activeTopic = topicName;
    this.form.topicName = topicName;
    this.form.topicId = topicId;
  }

  oninit(vnode: m.VnodeDOM<NewThreadFormAttrs, this>) {
    const { isModal } = vnode.attrs;
    this.form = {
      topicName: null,
      topicId: null,
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

  view(vnode) {
    if (!app.chain) return;
    const { isModal, hasTopics } = vnode.attrs;
    const { fromDraft, saving, form } = this;
    const chainId = app.activeChainId();
    const author = app.user.activeAccount;
    const isAdmin = app.user.isAdminOfEntity({ chain: chainId });

    const discussionDrafts =
      app.user.discussionDrafts.store.getByCommunity(chainId);

    const defaultTemplate = localStorage.getItem(
      `${chainId}-active-topic-default-template`
    );

    const topicMissing = hasTopics && !this.form?.topicName;

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

    // private _getClass(isModal, draftCount) {
    //   if (!this) throw new Error('no this');
    //   return (
    //     `${this.form.kind === ThreadKind.Link ? 'link-post' : ''} ` +
    //     `${
    //       this.form.kind !== ThreadKind.Link && draftCount > 0 ? 'has-drafts' : ''
    //     } ` +
    //     `${isModal ? 'is-modal' : ''}`
    //   );
    // }

    return (
      <div
        class={getClasses<{ isModal?: boolean }>({ isModal }, 'NewThreadForm')}
        // class={this._getClass(isModal, discussionDrafts.length)}
        oncreate={(vvnode) => {
          $(vvnode.dom)
            .find('.cui-input input')
            .prop('autocomplete', 'off')
            .focus();
        }}
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
              iconName="expand"
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
        <div class="new-thread-form-body">
          {author?.profile && !author.profile.name && (
            <div class="set-display-name-callout">
              <CWText>You haven't set a display name yet.</CWText>
              <a
                href={`/${chainId}/account/${author.address}?base=${author.chain}`}
                onclick={(e) => {
                  e.preventDefault();
                  app.modals.create({
                    modal: EditProfileModal,
                    data: {
                      account: author,
                      refreshCallback: () => m.redraw(),
                    },
                  });
                }}
              >
                Set a display name
              </a>
            </div>
          )}
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
                  defaultValue={this.form.title}
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
                  name="submission"
                  tabindex={4}
                />
                <CWButton
                  disabled={disableSubmission}
                  onclick={async (e) => {
                    // TODO Graham 7-19-22: This needs to be reduced / cleaned up / broken out
                    const { quillEditorState } = this;
                    this.saving = true;
                    const title = $(e.target)
                      .closest('.NewThreadForm')
                      .find("input[name='new-thread-title']");
                    if (!this.form.title) {
                      this.form.title = title.val() as string;
                    }
                    const existingDraftId = this.recentlyDeletedDrafts.includes(
                      this.fromDraft
                    )
                      ? undefined
                      : this.fromDraft;
                    try {
                      await this._saveDraft(
                        form,
                        quillEditorState,
                        existingDraftId
                      );
                      this.saving = false;
                      if (isModal) {
                        notifySuccess('Draft saved');
                      }
                      m.redraw();
                    } catch (err) {
                      this.saving = false;
                      notifyError(err.message);
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
                  defaultValue={this.form.title}
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
                defaultValue={this.form.url}
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
        {!!discussionDrafts.length && this.form.kind === ThreadKind.Discussion && (
          <div class="new-thread-form-sidebar">
            <List interactive>
              {discussionDrafts
                .sort((a, b) => a.createdAt.unix() - b.createdAt.unix())
                .map((draft) => {
                  const { body } = draft;

                  let bodyComponent;

                  if (body) {
                    try {
                      const doc = JSON.parse(body);
                      if (!doc.ops) throw new Error();
                      doc.ops = doc.ops.slice(0, 3);
                      bodyComponent = (
                        <QuillFormattedText doc={doc} collapse hideFormatting />
                      );
                    } catch (e) {
                      bodyComponent = (
                        <MarkdownFormattedText
                          doc={body}
                          collapse
                          hideFormatting
                        />
                      );
                    }
                  }

                  return (
                    <ListItem
                      allowOnContentClick
                      selected={fromDraft === draft.id}
                      onclick={async () => {
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
                      contentRight={
                        <>
                          {fromDraft === draft.id ? (
                            <div class="discussion-draft-title-wrap">
                              <CWIcon iconName="edit" />
                              <div class="discussion-draft-title">
                                {draft.title || 'Untitled'}
                              </div>
                            </div>
                          ) : (
                            <div class="discussion-draft-title">
                              {draft.title || 'Untitled'}
                            </div>
                          )}
                          <div class="discussion-draft-body">
                            {draft.body.length ? bodyComponent : ''}
                          </div>
                          <div class="discussion-draft-actions">
                            <a
                              href="#"
                              onclick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const confirmed =
                                  await confirmationModalWithText(
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
                            </a>
                          </div>
                        </>
                      }
                    />
                  );
                })}
            </List>
          </div>
        )}
      </div>
    );
  }
}
