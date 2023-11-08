import 'components/NewThreadForm.scss';
import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import { parseCustomStages } from 'helpers';
import { featureFlags } from 'helpers/feature-flags';
import { detectURL, getThreadActionTooltipText } from 'helpers/threads';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo } from 'react';
import app from 'state';
import {
  useFetchGroupsQuery,
  useRefreshMembershipQuery,
} from 'state/api/groups';
import { useCreateThreadMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useJoinCommunity from 'views/components/Header/useJoinCommunity';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { TopicSelector } from 'views/components/topic_selector';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import { ThreadKind, ThreadStage } from '../../../models/types';
import Permissions from '../../../utils/Permissions';
import { CWText } from '../../components/component_kit/cw_text';
import CWBanner from '../../components/component_kit/new_designs/CWBanner';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { ReactQuillEditor } from '../react_quill_editor';
import {
  createDeltaFromText,
  getTextFromDelta,
  serializeDelta,
} from '../react_quill_editor/utils';
import { checkNewThreadErrors, useNewThreadForm } from './helpers';

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const { data: groups = [] } = useFetchGroupsQuery({
    chainId: app.activeChainId(),
    includeMembers: true,
    includeTopics: true,
  });

  const { data: memberships = [] } = useRefreshMembershipQuery({
    chainId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
  });

  const chainId = app.chain.id;
  const hasTopics = topics?.length;
  const isAdmin = Permissions.isCommunityAdmin();

  const topicsForSelector = topics?.reduce(
    (acc, t) => {
      if (
        isAdmin ||
        t.tokenThreshold.isZero() ||
        !app.chain.isGatedTopic(t.id)
      ) {
        acc.enabledTopics.push(t);
      } else {
        acc.disabledTopics.push(t);
      }
      return acc;
    },
    { enabledTopics: [], disabledTopics: [] },
  );

  const {
    threadTitle,
    setThreadTitle,
    threadKind,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    threadContentDelta,
    setThreadContentDelta,
    setIsSaving,
    isDisabled,
    clearDraft,
  } = useNewThreadForm(chainId, topicsForSelector.enabledTopics);

  const gatedGroupsMatchingTopic = groups?.filter((x) =>
    x?.topics?.find((y) => y?.id === threadTopic.id),
  );

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const restrictedTopicIds = memberships
    .filter((x) => x.rejectReason)
    .map((x) => parseInt(`${x.topicId}`));

  const {
    mutateAsync: createThread,
    error: createThreadError,
    reset: resetCreateThreadMutation,
  } = useCreateThreadMutation({
    chainId: app.activeChainId(),
  });

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetCreateThreadMutation,
    error: createThreadError,
  });

  const isDiscussion = threadKind === ThreadKind.Discussion;

  const isPopulated = useMemo(() => {
    return threadTitle || getTextFromDelta(threadContentDelta).length > 0;
  }, [threadContentDelta, threadTitle]);

  const showGatingBanner = useMemo(() => {
    if (!memberships) return;

    const memberFilter = memberships.filter(
      (x) => Number(x.topicId) === threadTopic.id,
    );

    const isMember = memberFilter.some((member) => member.isAllowed);

    return memberFilter.length > 0 && !isMember;
  }, [memberships, threadTopic.id]);

  const handleNewThreadCreation = async () => {
    if (restrictedTopicIds.includes(threadTopic.id)) {
      notifyError('Topic is gated!');
      return;
    }

    if (!isDiscussion && !detectURL(threadUrl)) {
      notifyError('Must provide a valid URL.');
      return;
    }

    const deltaString = JSON.stringify(threadContentDelta);

    checkNewThreadErrors(
      { threadKind, threadUrl, threadTitle, threadTopic },
      deltaString,
      !!hasTopics,
    );

    setIsSaving(true);

    try {
      const thread = await createThread({
        address: app.user.activeAccount.address,
        kind: threadKind,
        stage: app.chain.meta.customStages
          ? parseCustomStages(app.chain.meta.customStages)[0]
          : ThreadStage.Discussion,
        chainId: app.activeChainId(),
        title: threadTitle,
        topic: threadTopic,
        body: serializeDelta(threadContentDelta),
        url: threadUrl,
        authorProfile: app.user.activeAccount.profile,
      });

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(`/discussion/${thread.id}`);
    } catch (err) {
      if (err instanceof SessionKeyError) {
        return;
      }
      console.error(err?.responseJSON?.error || err?.message);
      notifyError('Failed to create thread');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setThreadTitle('');
    setThreadTopic(
      topicsForSelector.enabledTopics.find((t) => t.name.includes('General')) ||
        null,
    );
    setThreadContentDelta(createDeltaFromText(''));
  };

  const showBanner = !hasJoinedCommunity && isBannerVisible;

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!hasJoinedCommunity,
    isThreadTopicGated: restrictedTopicIds.includes(threadTopic.id),
  });

  return (
    <>
      <div className="NewThreadForm">
        <div className="header">
          <CWText type="h2" fontWeight="medium">
            Create Discussion
          </CWText>
        </div>
        <div className="new-thread-body">
          <div className="new-thread-form-inputs">
            <div className="topics-and-title-row">
              {hasTopics && (
                <TopicSelector
                  enabledTopics={topicsForSelector.enabledTopics}
                  disabledTopics={topicsForSelector.disabledTopics}
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
              isDisabled={
                restrictedTopicIds.includes(threadTopic.id) ||
                !hasJoinedCommunity
              }
              tooltipLabel={
                disabledActionsTooltipText || 'Join community to submit'
              }
            />

            <div className="buttons-row">
              {isPopulated && hasJoinedCommunity && (
                <CWButton
                  buttonType="tertiary"
                  onClick={handleCancel}
                  tabIndex={3}
                  label="Cancel"
                />
              )}
              <CWButton
                label="Submit"
                disabled={isDisabled || !hasJoinedCommunity}
                onClick={handleNewThreadCreation}
                tabIndex={4}
                buttonWidth="wide"
              />
            </div>

            {showBanner && (
              <JoinCommunityBanner
                onClose={handleCloseBanner}
                onJoin={handleJoinCommunity}
              />
            )}
          </div>
        </div>
        {featureFlags.gatingEnabled && showGatingBanner && (
          <div className="gatingBanner">
            <CWBanner
              title="This topic is gated"
              body="Only members within the following group(s) can interact with this topic:"
              type="info"
              footer={
                <div className="gating-tags">
                  {gatedGroupsMatchingTopic.map((t) => (
                    <CWTag key={t.id} label={t.name} type="referendum" />
                  ))}
                </div>
              }
              buttons={[
                {
                  label: 'See all groups',
                  onClick: () => navigate('/members?tab=groups'),
                },
                { label: 'Learn more about gating' },
              ]}
              onClose={() => !!showGatingBanner}
            />
          </div>
        )}
      </div>
      {JoinCommunityModals}
      {RevalidationModal}
    </>
  );
};
