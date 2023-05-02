import React, { useEffect, useMemo } from 'react';
import { capitalize } from 'lodash';

import 'components/new_thread_form.scss';

import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { notifyError } from 'controllers/app/notifications';
import { ThreadKind, ThreadStage } from 'models';
import app from 'state';
import { detectURL } from 'helpers/threads';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWButton } from 'views/components/component_kit/cw_button';
import { TopicSelector } from 'views/components/topic_selector';
import { useCommonNavigate } from 'navigation/helpers';

type NewThreadDraft = {
  topicId: number;
  title: string;
  body: DeltaStatic;
};

import {
  useNewThreadForm,
  useAuthorName,
  checkNewThreadErrors,
  updateTopicList,
} from './helpers';
import { ReactQuillEditor } from '../react_quill_editor';
import {
  createDeltaFromText,
  getTextFromDelta,
} from '../react_quill_editor/utils';
import { useDraft } from 'hooks/useDraft';
import { DeltaStatic } from 'quill';

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();

  const chainId = app.chain.id;
  const hasTopics = !!app.topics.getByCommunity(chainId).length;
  const author = app.user.activeAccount;
  const { authorName } = useAuthorName();
  const isAdmin = app.roles.isAdminOfEntity({ chain: chainId });

  const {
    threadTitle,
    setThreadTitle,
    threadKind,
    setThreadKind,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    threadContentDelta,
    setThreadContentDelta,
    setIsSaving,
    isDisabled,
  } = useNewThreadForm(authorName, hasTopics);

  const isDiscussion = threadKind === ThreadKind.Discussion;

  const topicsForSelector = app.topics?.getByCommunity(chainId)?.filter((t) => {
    return (
      isAdmin ||
      t.tokenThreshold.isZero() ||
      !TopicGateCheck.isGatedTopic(t.name)
    );
  });

  const { saveDraft, restoreDraft, clearDraft } = useDraft<NewThreadDraft>(
    `new-thread-${chainId}-info`
  );

  const isPopulated = useMemo(() => {
    return threadTitle || getTextFromDelta(threadContentDelta).length > 0;
  }, [threadContentDelta, threadTitle]);

  const handleNewThreadCreation = async () => {
    if (!isDiscussion && !detectURL(threadUrl)) {
      notifyError('Must provide a valid URL.');
      return;
    }

    const deltaString = JSON.stringify(threadContentDelta);

    checkNewThreadErrors(
      { threadKind, threadUrl, threadTitle, threadTopic },
      deltaString
    );

    setIsSaving(true);

    await app.sessions.signThread({
      community: app.activeChainId(),
      title: threadTitle,
      body: deltaString,
      link: threadUrl,
      topic: threadTopic,
    });

    try {
      const result = await app.threads.create(
        author.address,
        threadKind,
        ThreadStage.Discussion,
        app.activeChainId(),
        threadTitle,
        threadTopic,
        deltaString,
        threadUrl
      );

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(`/discussion/${result.id}`);
      updateTopicList(result.topic, app.chain);
    } catch (err) {
      console.log('err', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setThreadTitle('');
    setThreadTopic(
      topicsForSelector.find((t) => t.name.includes('General')) || null
    );
    setThreadContentDelta(createDeltaFromText(''));
  };

  // on content updated, save draft
  useEffect(() => {
    const draft = {
      topicId: threadTopic?.id || 0,
      title: threadTitle,
      body: threadContentDelta,
    };
    if (!draft.topicId && !draft.title && !draft.body) {
      return;
    }
    saveDraft(draft);
  }, [saveDraft, threadTopic, threadTitle, threadContentDelta]);

  // on init, restore draft
  useEffect(() => {
    if (!topicsForSelector.length) {
      return;
    }
    const draft = restoreDraft();

    // select General topic by default
    if (!draft) {
      const topic =
        topicsForSelector.find((t) => t.name.includes('General')) || null;
      setThreadTopic(topic);
      return;
    }

    const { topicId, title, body } = draft;
    const topic =
      topicsForSelector.find((t) => t.id === topicId) ||
      topicsForSelector.find((t) => t.name.includes('General')) ||
      null;
    setThreadTopic(topic);
    setThreadTitle(title);
    setThreadContentDelta(body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="NewThreadForm">
        <div className="new-thread-header">
          <CWTabBar>
            <CWTab
              label={capitalize(ThreadKind.Discussion)}
              isSelected={threadKind === ThreadKind.Discussion}
              onClick={() => setThreadKind(ThreadKind.Discussion)}
            />
            <CWTab
              label={capitalize(ThreadKind.Link)}
              isSelected={threadKind === ThreadKind.Link}
              onClick={() => setThreadKind(ThreadKind.Link)}
            />
          </CWTabBar>
        </div>
        <div className="new-thread-body">
          <div className="new-thread-form-inputs">
            <div className="topics-and-title-row">
              {hasTopics && (
                <TopicSelector
                  topics={topicsForSelector}
                  value={threadTopic}
                  onChange={setThreadTopic}
                />
              )}
              <CWTextInput
                autoFocus
                placeholder="Title"
                value={threadTitle}
                tabIndex={1}
                onInput={(e) => setThreadTitle(e.target.value)}
              />
            </div>

            {!isDiscussion && (
              <CWTextInput
                placeholder="https://"
                value={threadUrl}
                tabIndex={2}
                onInput={(e) => setThreadUrl(e.target.value)}
              />
            )}

            <ReactQuillEditor
              contentDelta={threadContentDelta}
              setContentDelta={setThreadContentDelta}
            />

            <div className="buttons-row">
              {isPopulated && (
                <CWButton
                  label={'Cancel'}
                  onClick={handleCancel}
                  tabIndex={3}
                  buttonType="secondary-blue"
                />
              )}
              <CWButton
                label={
                  app.user.activeAccount
                    ? 'Create thread'
                    : 'Join community to create'
                }
                disabled={isDisabled}
                onClick={handleNewThreadCreation}
                tabIndex={4}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
