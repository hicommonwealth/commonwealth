import React from 'react';
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

import {
  useNewThreadForm,
  useAuthorName,
  checkNewThreadErrors,
  updateTopicList,
} from './helpers';
import { ReactQuillEditor } from '../react_quill_editor';

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

      navigate(`/discussion/${result.id}`);
      updateTopicList(result.topic, app.chain);
    } catch (err) {
      console.log('err');
    } finally {
      setIsSaving(false);
    }
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
                  defaultTopic={threadTopic}
                  topics={topicsForSelector}
                  onChange={setThreadTopic}
                />
              )}
              <CWTextInput
                autoFocus
                placeholder="Title"
                value={threadTitle}
                tabIndex={2}
                onInput={(e) => setThreadTitle(e.target.value)}
              />
            </div>

            {!isDiscussion && (
              <CWTextInput
                placeholder="https://"
                value={threadUrl}
                tabIndex={3}
                onInput={(e) => setThreadUrl(e.target.value)}
              />
            )}

            <ReactQuillEditor
              contentDelta={threadContentDelta}
              setContentDelta={setThreadContentDelta}
            />

            <div className="buttons-row">
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
