import 'components/NewThreadForm.scss';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { parseCustomStages } from 'helpers';
import { detectURL } from 'helpers/threads';
import { capitalize } from 'lodash';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo } from 'react';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { TopicSelector } from 'views/components/topic_selector';
import { ThreadKind, ThreadStage } from '../../../models/types';
import Permissions from '../../../utils/Permissions';
import { ReactQuillEditor } from '../react_quill_editor';
import {
  createDeltaFromText,
  getTextFromDelta,
  serializeDelta,
} from '../react_quill_editor/utils';
import { checkNewThreadErrors, useNewThreadForm } from './helpers';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });
  const chainId = app.chain.id;
  const hasTopics = topics?.length;
  const isAdmin = Permissions.isCommunityAdmin();

  const topicsForSelector =
    topics ||
    [].filter((t) => {
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
  } = useNewThreadForm(chainId, topicsForSelector);

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
      deltaString,
      !!hasTopics
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
        app.user.activeAccount.address,
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
                  buttonType="tertiary"
                  onClick={handleCancel}
                  tabIndex={3}
                  label="Cancel"
                />
              )}
              <CWButton
                label={
                  app.user.activeAccount ? 'Post' : 'Join community to create'
                }
                disabled={isDisabled}
                onClick={handleNewThreadCreation}
                tabIndex={4}
                buttonWidth="wide"
              />
            </div>

            <CWBanner
              className="join-community-banner"
              title="Want to contribute to this discussion?"
              body="Join now to engage in discussions, leave comments, reply to others,
                    upvote content, and enjoy a host of additional features."
              buttons={[{ label: 'Join community', buttonType: 'primary' }]}
            />
          </div>
        </div>
      </div>
    </>
  );
};
