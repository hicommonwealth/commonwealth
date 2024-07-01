import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import { parseCustomStages } from 'helpers';
import { getThreadActionTooltipText } from 'helpers/threads';
import { useFlag } from 'hooks/useFlag';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import {
  useFetchGroupsQuery,
  useRefreshMembershipQuery,
} from 'state/api/groups';
import { useCreateThreadMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { z } from 'zod';
import useAppStatus from '../../../hooks/useAppStatus';
import { ThreadKind, ThreadStage } from '../../../models/types';
import Permissions from '../../../utils/Permissions';
import { CWText } from '../../components/component_kit/cw_text';
import { CWGatedTopicBanner } from '../component_kit/CWGatedTopicBanner';
import { CWForm } from '../component_kit/new_designs/CWForm';
import { CWSelectList } from '../component_kit/new_designs/CWSelectList';
import { ReactQuillEditor } from '../react_quill_editor';
import {
  createDeltaFromText,
  getTextFromDelta,
  serializeDelta,
} from '../react_quill_editor/utils';
import ContestThreadBanner from './ContestThreadBanner';
import './NewThreadForm.scss';
import { checkIsTopicInContest, useNewThreadForm } from './helpers';
import { createThreadValidationSchema } from './validation';

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();
  const contestsEnabled = useFlag('contest');

  const [submitEntryChecked, setSubmitEntryChecked] = useState(false);

  const { isAddedToHomeScreen } = useAppStatus();

  const { data: topics = [] } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const { contestsData, isContestAvailable } = useCommunityContests();

  const sortedTopics = [...topics].sort((a, b) => a.name.localeCompare(b.name));
  const communityId = app.chain.id;
  const hasTopics = sortedTopics?.length;
  const isAdmin = Permissions.isCommunityAdmin() || Permissions.isSiteAdmin();
  const topicsForSelector = hasTopics ? sortedTopics : [];

  const {
    threadTitle,
    setThreadTitle,
    threadTopic,
    setThreadTopic,
    threadContentDelta,
    setThreadContentDelta,
    setIsSaving,
    clearDraft,
    canShowGatingBanner,
    setCanShowGatingBanner,
  } = useNewThreadForm(communityId, topicsForSelector);

  const isTopicInContest = checkIsTopicInContest(contestsData, threadTopic?.id);

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { data: groups = [] } = useFetchGroupsQuery({
    communityId: app.activeChainId(),
    includeTopics: true,
  });
  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const {
    mutateAsync: createThread,
    error: createThreadError,
    reset: resetCreateThreadMutation,
  } = useCreateThreadMutation({
    communityId: app.activeChainId(),
  });

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetCreateThreadMutation,
    error: createThreadError,
  });

  const isPopulated = useMemo(() => {
    return threadTitle || getTextFromDelta(threadContentDelta).length > 0;
  }, [threadContentDelta, threadTitle]);

  const isTopicGated = !!(memberships || []).find((membership) =>
    membership.topicIds.includes(threadTopic?.id),
  );
  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      membership.topicIds.includes(threadTopic?.id) && membership.isAllowed,
  );
  const gatedGroupNames = groups
    .filter((group) =>
      group.topics.find((topic) => topic.id === threadTopic?.id),
    )
    .map((group) => group.name);
  const isRestrictedMembership =
    !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

  const handleCancel = () => {
    setThreadTitle('');
    setThreadTopic(
      ((topicsForSelector || [])?.find((t) => t?.name?.includes('General')) ||
        null) as any,
    );
    setThreadContentDelta(createDeltaFromText(''));
  };

  const showBanner = !hasJoinedCommunity && isBannerVisible;
  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!hasJoinedCommunity,
    isThreadTopicGated: isRestrictedMembership,
  });

  const contestThreadBannerVisible =
    contestsEnabled && isContestAvailable && isTopicInContest;
  const isDisabledBecauseOfContestsConsent =
    contestThreadBannerVisible && !submitEntryChecked;

  const initialValues = {
    ...(!!location.search &&
      threadTopic?.name &&
      threadTopic?.id && {
        topic: {
          label: threadTopic?.name,
          value: `${threadTopic?.id}`,
        },
      }),
  };

  const handleSubmit = async (
    values: z.infer<typeof createThreadValidationSchema>,
  ) => {
    console.log('values => ', values);

    // if (isRestrictedMembership) {
    //   notifyError('Topic is gated!');
    //   return;
    // }

    // if (!isDiscussion && !detectURL(threadUrl)) {
    //   notifyError('Must provide a valid URL.');
    //   return;
    // }

    // const deltaString = JSON.stringify(threadContentDelta);

    // checkNewThreadErrors(
    //   { threadKind, threadUrl, threadTitle, threadTopic },
    //   deltaString,
    //   !!hasTopics,
    // );

    setIsSaving(true);

    try {
      const thread = await createThread({
        address: app.user.activeAccount.address,
        kind: ThreadKind.Discussion,
        stage: app.chain.meta.customStages
          ? parseCustomStages(app.chain.meta.customStages)[0]
          : ThreadStage.Discussion,
        communityId: app.activeChainId(),
        title: values.title,
        topic: topics.find((x) => x.name === values.topic?.label) as any,
        body: serializeDelta(values.body),
        url: '',
        // @ts-expect-error <StrictNullChecks/>
        authorProfile: app.user.activeAccount.profile,
        isPWA: isAddedToHomeScreen,
      });

      // setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(`/discussion/${thread.id}`);
    } catch (err) {
      if (err instanceof SessionKeyError) {
        return;
      }
      console.error(err.response.data.error || err?.message);
      notifyError('Failed to create thread');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWatch = (
    values: z.infer<typeof createThreadValidationSchema>,
  ) => {
    if (values.topic) {
      setCanShowGatingBanner(true);
      setThreadTopic(
        // @ts-expect-error <StrictNullChecks/>
        topicsForSelector.find((t) => `${t.id}` === values.topic.value),
      );
    }
  };

  return (
    <>
      <CWPageLayout>
        <div className="NewThreadForm">
          <CWText type="h2" fontWeight="medium" className="header">
            Create thread
          </CWText>
          <CWForm
            onSubmit={handleSubmit}
            onErrors={(errors) => console.log('errors => ', errors)}
            validationSchema={createThreadValidationSchema}
            initialValues={initialValues}
            onWatch={handleWatch}
            className="new-thread-body"
          >
            <div className="new-thread-form-inputs">
              <CWTextInput
                fullWidth
                autoFocus
                placeholder="Title"
                hookToForm
                name="title"
              />

              {!!hasTopics && (
                <CWSelectList
                  options={sortedTopics.map((topic) => ({
                    label: topic?.name,
                    value: `${topic?.id}`,
                  }))}
                  placeholder="Select topic"
                  hookToForm
                  name="topic"
                />
              )}

              <ReactQuillEditor
                isDisabled={isRestrictedMembership || !hasJoinedCommunity}
                tooltipLabel={
                  typeof disabledActionsTooltipText === 'function'
                    ? disabledActionsTooltipText?.('submit')
                    : disabledActionsTooltipText
                }
                placeholder="Enter text or drag images and media here. Use the tab button to see your formatted post."
                name="body"
                hookToForm
              />

              {contestThreadBannerVisible && (
                <ContestThreadBanner
                  submitEntryChecked={submitEntryChecked}
                  onSetSubmitEntryChecked={setSubmitEntryChecked}
                />
              )}

              <div className="buttons-row">
                {isPopulated && hasJoinedCommunity && (
                  <CWButton
                    buttonType="tertiary"
                    onClick={handleCancel}
                    label="Cancel"
                    containerClassName="no-pad"
                    type="button"
                  />
                )}
                <CWButton
                  label="Create thread"
                  // disabled={
                  //   isDisabled ||
                  //   !hasJoinedCommunity ||
                  //   isDisabledBecauseOfContestsConsent
                  // }
                  containerClassName="no-pad"
                  type="submit"
                />
              </div>

              {showBanner && (
                <JoinCommunityBanner
                  onClose={handleCloseBanner}
                  onJoin={handleJoinCommunity}
                />
              )}

              {isRestrictedMembership && canShowGatingBanner && (
                <div>
                  <CWGatedTopicBanner
                    groupNames={gatedGroupNames}
                    onClose={() => setCanShowGatingBanner(false)}
                  />
                </div>
              )}
            </div>
          </CWForm>
        </div>
      </CWPageLayout>
      {JoinCommunityModals}
      {RevalidationModal}
    </>
  );
};
