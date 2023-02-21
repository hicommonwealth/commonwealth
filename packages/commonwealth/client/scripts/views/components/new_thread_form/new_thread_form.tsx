import React, { useEffect, useState } from 'react';
import app from 'state';
import type { Topic, Account, DiscussionDraft } from 'models';
import { ThreadKind, ThreadStage } from 'models';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';
import { capitalize } from 'lodash';
import { _DEPRECATED_getRoute, redraw } from 'mithrilInterop';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { EditProfileModal } from 'views/modals/edit_profile_modal';
import { TopicSelector } from 'views/components/topic_selector';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { notifyError } from 'controllers/app/notifications';
import { detectURL } from 'helpers/threads';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { renderQuillTextBody } from 'views/components/quill/helpers';
import { useCommonNavigate } from 'navigation/helpers';
import type { NewThreadFormType } from 'views/components/new_thread_form/types';
import { NewDraftErrors } from 'views/components/new_thread_form/types';
import {
  checkNewThreadErrors,
  updateTopicList,
} from 'views/components/new_thread_form/helpers';
import type { DraftParams } from 'controllers/server/drafts';
import 'components/new_thread_form.scss';

interface NewThreadFormProps {
  hasTopics: boolean;
}

const getFromDraftValueFromLocalStorage = () => {
  const fromDraft = localStorage.getItem(`${app.activeChainId()}-from-draft`);
  localStorage.removeItem(`${app.activeChainId()}-from-draft`);

  return fromDraft ? Number(fromDraft) : undefined;
};

export const NewThreadForm = ({ hasTopics }: NewThreadFormProps) => {
  const navigate = useCommonNavigate();
  const [activeTopic, setActiveTopic] = useState<Topic>(null);
  const [form, setForm] = useState<NewThreadFormType>({
    topic: null,
    title: localStorage.getItem(`${app.activeChainId()}-new-link-storedTitle`),
    url: localStorage.getItem(`${app.activeChainId()}-new-link-storedLink`),
    kind: ThreadKind.Discussion,
  });
  const [fromDraft, setFromDraft] = useState(
    getFromDraftValueFromLocalStorage()
  );
  const [quillEditorState, setQuillEditorState] = useState<QuillEditor>(null);
  const [overwriteConfirmationModal, setOverwriteConfirmationModal] =
    useState(false);
  const [recentlyDeletedDrafts, setRecentlyDeletedDrafts] = useState<number[]>(
    []
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (form.kind === ThreadKind.Discussion && !overwriteConfirmationModal) {
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
    };
  }, [form.kind, overwriteConfirmationModal]);

  if (!app.chain) {
    return;
  }

  const chainId = app.activeChainId();
  const author = app.user.activeAccount;
  const isAdmin = app.roles.isAdminOfEntity({ chain: chainId });

  const discussionDrafts =
    app.user.discussionDrafts.store.getByCommunity(chainId);

  const defaultTemplate = localStorage.getItem(
    `${chainId}-active-topic-default-template`
  );

  const topicMissing = hasTopics && !form?.topic;

  const linkContentMissing = form.kind === ThreadKind.Link && !form.url;

  const discussionContentMissing =
    form.kind === ThreadKind.Discussion &&
    (quillEditorState?.isBlank() || !form?.title);

  const disableSave = !author || saving;

  const disableSubmission =
    disableSave ||
    topicMissing ||
    linkContentMissing ||
    discussionContentMissing;

  const _saveToLocalStorage = () => {
    if (form.kind === ThreadKind.Discussion) {
      if (form.title) {
        localStorage.setItem(
          `${app.activeChainId()}-new-discussion-storedTitle`,
          form.title
        );
      }
    } else if (form.kind === ThreadKind.Link) {
      if (form.url) {
        localStorage.setItem(
          `${app.activeChainId()}-new-link-storedLink`,
          form.url
        );
      }
      if (form.title) {
        localStorage.setItem(
          `${app.activeChainId()}-new-link-storedTitle`,
          form.title
        );
      }
    }
  };

  const _populateFromLocalStorage = () => {
    if (form.kind === ThreadKind.Discussion) {
      form.title = localStorage.getItem(
        `${app.activeChainId()}-new-discussion-storedTitle`
      );
    } else if (form.kind === ThreadKind.Link) {
      form.url = localStorage.getItem(
        `${app.activeChainId()}-new-link-storedLink`
      );
      form.title = localStorage.getItem(
        `${app.activeChainId()}-new-link-storedTitle`
      );
    }
  };

  const _updateTopicState = (topic: Topic) => {
    localStorage.setItem(`${app.activeChainId()}-active-topic`, topic.name);
    setActiveTopic(topic);
    setForm((prevState) => ({ ...prevState, topic }));
  };

  const _newThread = async (
    _form: NewThreadFormType,
    _quillEditorState: QuillEditor,
    _author: Account,
    stage = ThreadStage.Discussion
  ) => {
    const body = quillEditorState.textContentsAsString;
    quillEditorState.disable();
    checkNewThreadErrors(_form, body);

    try {
      const result = await app.threads.create(
        _author.address,
        _form.kind,
        stage,
        app.activeChainId(),
        _form.title,
        _form.topic,
        body,
        form.url
      );

      navigate(`/discussion/${result.id}`);
      updateTopicList(result.topic, app.chain);
    } catch (e) {
      _quillEditorState.enable();
      throw new Error(e);
    }
  };

  const _saveDraft = async (
    _form: NewThreadFormType,
    _quillEditorState: QuillEditor,
    _existingDraftId?: number
  ) => {
    if (!_quillEditorState || _quillEditorState.isBlank()) {
      throw new Error(NewDraftErrors.InsufficientData);
    }

    const draftParams: DraftParams = {
      title: _form.title,
      body: _quillEditorState.textContentsAsString,
      topicName: _form.topic.name,
      attachments: [], // TODO: Hookup attachments
    };

    const action = _existingDraftId ? 'edit' : 'create';

    if (_existingDraftId) {
      draftParams['existingDraftId'] = _existingDraftId;
    }

    try {
      await app.user.discussionDrafts[action](draftParams);
    } catch (err) {
      notifyError(err);
      throw new Error(err);
    }
  };

  const _loadDraft = (draft: DiscussionDraft) => {
    quillEditorState.loadDocument(draft.body);

    const newTopic = app.topics.getByName(draft.topic, draft.chain);
    setForm((prevState) => ({
      ...prevState,
      title: draft.title,
      topic: newTopic,
    }));

    setActiveTopic(newTopic);
    setFromDraft(draft.id);

    localStorage.setItem(
      `${app.activeChainId()}-new-discussion-storedTitle`,
      draft.title
    );

    if (quillEditorState.alteredText) {
      setQuillEditorState(
        (prevState) =>
          ({
            ...prevState,
            alteredText: false,
          } as QuillEditor)
      );
    }

    redraw();
  };

  return (
    <div className="NewThreadForm">
      <div className="new-thread-header">
        <CWTabBar>
          <CWTab
            label={capitalize(ThreadKind.Discussion)}
            onClick={() => {
              _saveToLocalStorage();
              form.kind = ThreadKind.Discussion;
              localStorage.setItem(
                `${chainId}-post-type`,
                ThreadKind.Discussion
              );
              _populateFromLocalStorage();
            }}
            isSelected={form.kind === ThreadKind.Discussion}
          />
          <CWTab
            label={capitalize(ThreadKind.Link)}
            onClick={() => {
              _saveToLocalStorage();
              form.kind = ThreadKind.Link;
              localStorage.setItem(`${chainId}-post-type`, ThreadKind.Link);
              _populateFromLocalStorage();
            }}
            isSelected={form.kind === ThreadKind.Link}
          />
        </CWTabBar>
        {_DEPRECATED_getRoute() !== `${chainId}/new/discussion` && (
          <CWButton
            label="Full editor"
            iconLeft="expand"
            buttonType="tertiary-blue"
            onClick={(e) => {
              setOverwriteConfirmationModal(true);
              localStorage.setItem(`${chainId}-from-draft`, `${fromDraft}`);
              navigate('/new/discussion');
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
                  // TODO convert to new modal approach
                  e.preventDefault();
                  app.modals.create({
                    modal: EditProfileModal,
                    data: {
                      account: author,
                      refreshCallback: () => redraw(),
                    },
                  });
                }}
              >
                Set a display name
              </a>
            </div>
          )}
          {form.kind === ThreadKind.Discussion && (
            <>
              {!!fromDraft && <CWText className="draft-text">Draft</CWText>}
              <div className="topics-and-title-row">
                {hasTopics && (
                  <TopicSelector
                    defaultTopic={
                      activeTopic ||
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
                    updateFormData={_updateTopicState.bind(this)}
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

                    if (quillEditorState && !quillEditorState.alteredText) {
                      quillEditorState.alteredText = true;
                    }

                    form.title = value;

                    localStorage.setItem(
                      `${chainId}-new-discussion-storedTitle`,
                      form.title
                    );
                  }}
                  value={form.title}
                  tabIndex={2}
                />
              </div>
              <QuillEditorComponent
                contentsDoc=""
                oncreateBind={(state: QuillEditor) => {
                  setQuillEditorState(state);

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
                    setSaving(true);

                    try {
                      await _newThread(form, quillEditorState, author);
                      setOverwriteConfirmationModal(true);
                      setSaving(false);

                      if (
                        fromDraft &&
                        !recentlyDeletedDrafts.includes(fromDraft)
                      ) {
                        await app.user.discussionDrafts.delete(fromDraft);
                      }

                      quillEditorState.clearLocalStorage();
                    } catch (err) {
                      setSaving(false);
                      notifyError(err.message);
                    }
                  }}
                  label="Create thread"
                  tabIndex={4}
                />
                <CWButton
                  disabled={disableSubmission}
                  buttonType="tertiary-blue"
                  onClick={async (e) => {
                    setSaving(true);

                    const existingDraftId = recentlyDeletedDrafts.includes(
                      fromDraft
                    )
                      ? undefined
                      : fromDraft;

                    try {
                      await _saveDraft(form, quillEditorState, existingDraftId);
                      setSaving(false);
                      redraw();
                    } catch (err) {
                      setSaving(false);
                      notifyError(err.message);
                    }
                  }}
                  label={fromDraft ? 'Update saved draft' : 'Save draft'}
                  tabIndex={5}
                />
              </div>
            </>
          )}
          {form.kind === ThreadKind.Link && hasTopics && (
            <>
              <div className="topics-and-title-row">
                <TopicSelector
                  defaultTopic={
                    activeTopic ||
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
                  updateFormData={_updateTopicState.bind(this)}
                  tabIndex={1}
                />
                <CWTextInput
                  placeholder="Title"
                  name="new-link-title"
                  onInput={(e) => {
                    e.redraw = false; // do not redraw on input
                    const { value } = e.target as any;
                    setForm((prevState) => ({ ...prevState, title: value }));
                    localStorage.setItem(
                      `${chainId}-new-link-storedTitle`,
                      form.title
                    );
                  }}
                  value={form.title}
                  tabIndex={3}
                />
              </div>
              <CWTextInput
                placeholder="https://"
                onInput={(e) => {
                  e.redraw = false; // do not redraw on input
                  const { value } = e.target as any;
                  setForm((prevState) => ({ ...prevState, url: value }));
                  localStorage.setItem(
                    `${chainId}-new-link-storedLink`,
                    form.url
                  );
                }}
                value={form.url}
                tabIndex={2}
              />
              <QuillEditorComponent
                contentsDoc="" // Prevent the editor from being filled in with previous content
                oncreateBind={(state: QuillEditor) => {
                  setQuillEditorState(state);

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
                  if (!detectURL(form.url)) {
                    notifyError('Must provide a valid URL.');
                    return;
                  }

                  setSaving(true);

                  try {
                    await _newThread(form, quillEditorState, author);
                    setSaving(false);

                    quillEditorState.clearLocalStorage();
                  } catch (err) {
                    setSaving(false);
                    notifyError(err.message);
                  }
                }}
              />
            </>
          )}
        </div>
        {!!discussionDrafts.length && form.kind === ThreadKind.Discussion && (
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
                          !quillEditorState.isBlank() ||
                          quillEditorState.alteredText
                        ) {
                          const confirmed = await confirmationModalWithText(
                            'Load draft? Your current work will not be saved.'
                          )();
                          if (!confirmed) return;
                        }
                        _loadDraft(draft);
                      }}
                    >
                      <div className="draft-title">
                        {fromDraft === draft.id ? (
                          <>
                            <CWIcon iconName="write" iconSize="small" />
                            <CWText fontWeight="semiBold" noWrap title={title}>
                              {title}
                            </CWText>
                          </>
                        ) : (
                          <CWText fontWeight="semiBold" noWrap title={title}>
                            {title}
                          </CWText>
                        )}
                      </div>
                      {draft.body.length > 0 &&
                        renderQuillTextBody(draft.body, {
                          hideFormatting: true,
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
                              await app.user.discussionDrafts.delete(draft.id);
                              setRecentlyDeletedDrafts((prevState) => [
                                ...prevState,
                                draft.id,
                              ]);
                              if (fromDraft === draft.id) {
                                setFromDraft(null);
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
};
