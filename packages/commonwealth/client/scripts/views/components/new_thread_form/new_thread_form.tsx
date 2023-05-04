import React, { useMemo } from 'react';
import { capitalize } from 'lodash';

import 'components/new_thread_form.scss';

import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { notifyError } from 'controllers/app/notifications';
import { ThreadKind, ThreadStage } from 'models';
import app from 'state';
import { parseCustomStages } from 'helpers';
import { detectURL } from 'helpers/threads';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWButton } from 'views/components/component_kit/cw_button';
import { TopicSelector } from 'views/components/topic_selector';
import { useCommonNavigate } from 'navigation/helpers';

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
  serializeDelta,
} from '../react_quill_editor/utils';

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();

  const chainId = app.chain.id;
  const hasTopics = !!app.topics.getByCommunity(chainId).length;
  const author = app.user.activeAccount;
  const { authorName } = useAuthorName();
  const isAdmin = app.roles.isAdminOfEntity({ chain: chainId });

  const topicsForSelector = app.topics?.getByCommunity(chainId)?.filter((t) => {
    return (
      isAdmin ||
      t.tokenThreshold.isZero() ||
      !TopicGateCheck.isGatedTopic(t.name)
    );
  });

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
    clearDraft,
  } = useNewThreadForm(chainId, authorName, topicsForSelector);

  const isDiscussion = threadKind === ThreadKind.Discussion;

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

    await app.sessions.signThread(author.address, {
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
        app.chain.meta.customStages
          ? parseCustomStages(app.chain.meta.customStages)[0]
          : ThreadStage.Discussion,
        app.activeChainId(),
        threadTitle,
        threadTopic,
        serializeDelta(threadContentDelta),
        threadUrl
      );

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(`/discussion/${result.id}`);
      updateTopicList(result.topic, app.chain);
    } catch (err) {
      console.error(err);
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
