import { QuestActionMeta } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import {
  isQuestActionComplete,
  isQuestComplete,
  QuestAction as QuestActionType,
  XPLog,
} from 'helpers/quest';
import { useFlag } from 'hooks/useFlag';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { fetchCachedNodes } from 'state/api/nodes';
import { useGetQuestByIdQuery } from 'state/api/quest';
import {
  useCancelQuestMutation,
  useDeleteQuestMutation,
} from 'state/api/quests';
import { useGetXPs } from 'state/api/user';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import useXPProgress from 'views/components/SublayoutHeader/XPProgressIndicator/useXPProgress';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { AuthModal, AuthModalType } from 'views/modals/AuthModal';
import { AuthOptions, AuthOptionTypes } from 'views/modals/AuthModal/types';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { z } from 'zod';
import { PageNotFound } from '../404';
import { buildRedirectURLFromContentId } from '../CreateQuest/QuestForm/helpers';
import QuestCard from '../ExplorePage/QuestList/QuestCard';
import QuestActionCard from './QuestActionCard';
import './QuestDetails.scss';
import TotalQuestXPTag from './TotalQuestXPTag';

const QuestDetails = ({ id }: { id: number }) => {
  const questId = parseInt(`${id}`) || 0;
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const xpEnabled = useFlag('xp');

  const { data: quest, isLoading } = useGetQuestByIdQuery({
    quest_id: questId,
    enabled: !!(xpEnabled && questId),
  });

  const { data: xpProgressions = [] } = useGetXPs({
    user_id: user.id,
    quest_id: questId,
    enabled: user.isLoggedIn && xpEnabled,
  });

  const [authModalConfig, setAuthModalConfig] = useState<{
    type: AuthModalType | undefined;
    options: AuthOptionTypes[] | undefined;
    specificAuthOption?: AuthOptions;
  }>({
    type: undefined,
    options: undefined,
    specificAuthOption: undefined,
  });

  const { mutateAsync: deleteQuest, isLoading: isDeletingQuest } =
    useDeleteQuestMutation();
  const { mutateAsync: cancelQuest, isLoading: isCancelingQuest } =
    useCancelQuestMutation();

  const isPendingAction = isDeletingQuest || isCancelingQuest;

  useRunOnceOnCondition({
    callback: () => {
      if (!quest?.id) return;

      if (
        (quest?.community_id &&
          !window.location.pathname.includes(quest.community_id)) ||
        (!quest?.community_id &&
          window.location.pathname !== `/quests/${quest.id}`)
      ) {
        navigate(
          `/quests/${questId}`,
          { replace: true },
          quest?.community_id || null,
        );
        return;
      }
    },
    shouldRun: !!quest,
  });

  const { pendingWeeklyQuests } = useXPProgress({ includeSystemQuests: true }); // show system quests in quest details

  const popoverProps = usePopover();

  if (!xpEnabled || !questId) {
    return <PageNotFound />;
  }

  if (isLoading) {
    return <CWCircleMultiplySpinner />;
  }

  if (!quest) {
    return <PageNotFound />;
  }

  const isSystemQuest = quest.id < 0;

  const handleActionStart = (action: z.infer<typeof QuestActionMeta>) => {
    const actionName = action.event_name;
    const actionContentId = action.content_id;

    // generic cases when actions have start link (i.e discord requires start link)
    if (action.start_link) {
      window.open(action.start_link, '_blank');
      return;
    }

    // specific cases when actions don't have start links
    switch (actionName) {
      case 'SignUpFlowCompleted': {
        setAuthModalConfig({
          type: AuthModalType.CreateAccount,
          options: ['wallets', 'sso'],
        });
        break;
      }
      case 'WalletLinked': {
        setAuthModalConfig({
          type: AuthModalType.SignIn,
          options: ['wallets'],
        });
        break;
      }
      case 'SSOLinked': {
        setAuthModalConfig({ type: AuthModalType.SignIn, options: ['sso'] });
        break;
      }
      case 'CommunityCreated': {
        // TODO: https://github.com/hicommonwealth/commonwealth/issues/11847
        // Update create community flow to select a specific chain via url params
        navigate(`/createCommunity`, {}, null);
        break;
      }
      case 'ThreadCreated': {
        if (actionContentId) {
          const url = buildRedirectURLFromContentId(actionContentId, {
            newThread: true,
          }).split(window.location.origin)[1];
          navigate(url, {}, null);
          return;
        }
        navigate(`/new/discussion`, {}, quest?.community_id || null);
        break;
      }
      case 'CommunityJoined': {
        navigate(
          quest?.community_id ? '' : `/explore`,
          {},
          quest?.community_id,
        );
        break;
      }
      case 'ThreadUpvoted':
      case 'CommentCreated': {
        if (actionContentId) {
          navigate(
            buildRedirectURLFromContentId(actionContentId).split(
              window.location.origin,
            )[1],
            {},
            null,
          );
          return;
        }
        if (quest.community_id) {
          navigate(`/${quest.community_id}/discussions`, {}, null);
          return;
        }
        navigate(`/dashboard/for-you`, {}, null);
        break;
      }
      case 'CommentUpvoted': {
        if (actionContentId) {
          navigate(
            actionContentId
              ? buildRedirectURLFromContentId(actionContentId).split(
                  window.location.origin,
                )[1]
              : `/explore?tab=threads`,
            {},
            null,
          );
          return;
        }
        if (quest.community_id) {
          navigate(`/${quest.community_id}/discussions`, {}, null);
          return;
        }
        navigate(`/dashboard/for-you`, {}, null);
        break;
      }
      case 'UserMentioned': {
        // TODO: user mention is not implemented in app
        break;
      }
      case 'TweetEngagement': {
        // Check if user has Twitter linked
        const hasTwitterLinked = user.addresses?.some(
          (address) => address.walletSsoSource === 'twitter',
        );

        if (hasTwitterLinked) {
          if (actionContentId) {
            window.open(
              buildRedirectURLFromContentId(actionContentId),
              '_blank',
            );
          } else {
            notifyError(`Linked twitter tweet url is invalid`);
          }
        } else {
          // Open Twitter SSO modal if Twitter isn't linked
          setAuthModalConfig({
            type: AuthModalType.SignIn,
            options: ['sso'],
            specificAuthOption: 'x', // only show twitter option
          });
        }
        break;
      }
      case 'DiscordServerJoined': {
        // Check if user has Discord linked and if there's a start link
        const hasDiscordLinked = user.addresses?.some(
          (address) => address.walletSsoSource === 'discord',
        );

        if (!action.start_link) {
          // requires a start link
          notifyError(`Start link is invalid for this action`);
          return;
        }

        if (hasDiscordLinked && action.start_link) {
          window.open(action.start_link, '_blank');
        } else {
          // Open Discord SSO modal if Discord isn't linked
          setAuthModalConfig({
            type: AuthModalType.SignIn,
            options: ['sso'],
            specificAuthOption: 'discord', // only show discord option
          });
        }
        break;
      }
      case 'MembershipsRefreshed': {
        if (actionContentId) {
          navigate(
            buildRedirectURLFromContentId(actionContentId).split(
              window.location.origin,
            )[1],
            {},
            null,
          );
        } else {
          notifyError(`Linked group url is invalid`);
        }
        break;
      }
      case 'XpChainEventCreated': {
        // build block explorer url with contract address and redirect to it
        try {
          const foundAction = quest?.action_metas?.find(
            (x) => x.event_name === `XpChainEventCreated`,
          );
          if (!foundAction) throw new Error(`Invalid url`);

          const foundBlockExplorer = fetchCachedNodes()?.find(
            (x) => x.id === foundAction?.ChainEventXpSource?.chain_node_id,
          )?.block_explorer;
          if (!foundBlockExplorer) throw new Error(`Invalid url`);

          const url = `${foundBlockExplorer}/address/${foundAction?.ChainEventXpSource?.contract_address}`;
          window.open(url, '_blank');
        } catch {
          notifyError(`Failed to redirect to block explorer`);
        }
        break;
      }
      case 'LaunchpadTokenRecordCreated': {
        navigate(`/createTokenCommunity`, {}, null);
        break;
      }
      case 'LaunchpadTokenTraded': {
        if (quest.community_id) {
          navigate(`/${quest.community_id}/discussions`, {}, null);
          return;
        }
        navigate(`/explore?tab=tokens`);
        break;
      }
      case 'CommunityGoalReached': {
        if (quest.community_id) {
          navigate(`/${quest.community_id}/discussions`, {}, null);
          return;
        }
        navigate(`/explore?tab=communities`);
        break;
      }
      case 'RecurringContestManagerDeployed': {
        if (quest.community_id) {
          navigate(
            `/${quest.community_id}/contests/launch`,
            {},
            quest.community_id || null,
          );
        } else {
          // If no community context, navigate to community selection for contest creation
          navigate('/explore?tab=communities', {}, null);
        }
        break;
      }
      default:
        return;
    }
  };

  const handleQuestAbort = () => {
    const handleAsync = async () => {
      try {
        if (isDeletionAllowed) {
          await deleteQuest({ quest_id: quest.id });
        } else {
          await cancelQuest({ quest_id: quest.id });
        }

        notifySuccess(`Quest ${isDeletionAllowed ? 'deleted' : 'canceled'}!`);
        navigate('/explore', {}, null);
      } catch (e) {
        console.log(e);
        notifyError(
          `Failed to ${isDeletionAllowed ? 'delete' : 'cancel'} quest`,
        );
      }
    };

    openConfirmation({
      title: `Confirm Quest ${isDeletionAllowed ? 'Deletion' : 'Cancelation'}!`,
      // eslint-disable-next-line max-len
      description: (
        <>
          Are you sure you want to {isDeletionAllowed ? 'delete' : 'cancel'}{' '}
          this quest. <br />
          <br />
          {isDeletionAllowed
            ? 'Deletion would remove this quest and its sub-tasks entirely for every user.'
            : // eslint-disable-next-line max-len
              `With cancellation, users who earned any aura for this quest will retain that aura. However new submissions to this quest won't be allowed and won't reward any aura to users.`}
        </>
      ),
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
          onClick: () => {},
        },
        {
          label: 'Confirm',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: () => {
            handleAsync().catch(console.error);
          },
        },
      ],
    });
  };

  const handleQuestCardCTAClick = (_questId: number, communityId?: string) => {
    navigate(`/quests/${_questId}`, {}, communityId || null);
  };

  const handleLeaderboardClick = () => {
    navigate('/leaderboard', {}, null);
  };

  const isStarted = moment().isSameOrAfter(moment(quest.start_date));
  const isEnded = moment().isSameOrAfter(moment(quest.end_date));
  const isDeletionAllowed = !isStarted || isEnded;

  const isSiteAdmin = Permissions.isSiteAdmin();

  const xpAwarded = Math.min(quest.xp_awarded, quest.max_xp_to_end);

  const isCompleted = isQuestComplete({
    questStartDate: new Date(quest.start_date),
    questEndDate: new Date(quest.end_date),
    questActions:
      (quest.action_metas as z.infer<typeof QuestActionMeta>[]) || [],
    xpLogs: xpProgressions as unknown as XPLog[],
  });

  const getQuestActionBlockedReason = () => {
    if ((isSystemQuest && user.isLoggedIn) || !isStarted || isEnded) {
      if (isSystemQuest && user.isLoggedIn)
        return 'Only available for new users';
      if (!isStarted) return 'Only available when quest starts';
      if (isEnded) return 'Unavailable, quest has ended';
    }

    return undefined;
  };

  const getXpLogsForActions = (action: QuestActionType) => {
    return xpProgressions
      .filter((log) => log.action_meta_id === action.id)
      .map((log) => ({
        id: log.action_meta_id,
        createdAt: new Date(log.event_created_at),
      }));
  };

  return (
    <CWPageLayout>
      <section className="QuestDetails">
        <CWText type="h2" className="header">
          Quest Details
        </CWText>
        <CWDivider />
        <div className="content">
          <div className="header">
            <img
              className="featured-img"
              src={quest.image_url}
              alt="featured-image"
            />
            <div className="quest-meta">
              <CWText type="h3">
                {quest.name}{' '}
                {isCompleted && <CWTag type="active" label="Completed" />}
              </CWText>
              <CWText type="b1">{quest.description}</CWText>
              <CWText className="timeline">
                From&ensp;
                {withTooltip(
                  <CWTag
                    type="group"
                    label={moment(quest.start_date).format('DD/MM/YYYY')}
                    classNames="cursor-pointer"
                  />,
                  moment(quest.start_date).toLocaleString(),
                  true,
                )}
                &ensp;to&ensp;
                {withTooltip(
                  <CWTag
                    type="group"
                    label={moment(quest.end_date).format('DD/MM/YYYY')}
                    classNames="cursor-pointer"
                  />,
                  moment(quest.end_date).toLocaleString(),
                  true,
                )}
              </CWText>
              <div className="progress">
                <div className="progress-label">
                  <CWText type="caption">
                    Rewarded {xpAwarded} / Max {quest.max_xp_to_end}
                  </CWText>
                  <CWPopover
                    body={
                      <div>
                        <CWText type="b2">
                          Indicates the maximum Aura allocation before this
                          quest is considered complete.
                        </CWText>
                        <br />

                        <CWText type="b2">
                          The quest automatically transitions to completed
                          status, if max Aura is alloted before quest end date.
                        </CWText>
                      </div>
                    }
                    placement="top-start"
                    {...popoverProps}
                  />
                  <CWIconButton
                    iconName="question"
                    iconSize="small"
                    onMouseEnter={popoverProps.handleInteraction}
                    onMouseLeave={popoverProps.handleInteraction}
                  />
                </div>

                <progress
                  className={clsx('progress-bar', { isEnded })}
                  value={xpAwarded}
                  max={quest.max_xp_to_end}
                />
              </div>
              {isSiteAdmin && (
                <>
                  <CWDivider />
                  <div className="manage-options">
                    <div className="w-fit">
                      {withTooltip(
                        <CWButton
                          label="Update"
                          onClick={() => navigate(`/quests/${quest.id}/update`)}
                          buttonType="primary"
                          iconLeft="notePencil"
                          disabled={isStarted || isEnded || isPendingAction}
                        />,
                        'Updates only allowed in pre-live stage',
                        isStarted || isEnded,
                      )}
                    </div>
                    <div className="w-fit">
                      {withTooltip(
                        <CWButton
                          label={isDeletionAllowed ? 'Delete' : 'Cancel'}
                          onClick={handleQuestAbort}
                          buttonType="destructive"
                          iconLeft="trash"
                          disabled={isEnded || isPendingAction}
                        />,
                        isEnded
                          ? 'Deletion not allowed for non-active quests'
                          : '',
                        isEnded,
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <CWDivider />
          <div className="quest-actions">
            <div className="header">
              <CWText type="h4" fontWeight="semiBold">
                Complete action to earn aura
              </CWText>
              <TotalQuestXPTag
                questId={quest.id}
                questStartDate={new Date(quest.start_date)}
                questEndDate={new Date(quest.end_date)}
                questActions={
                  (quest.action_metas as z.infer<typeof QuestActionMeta>[]) ||
                  []
                }
              />
            </div>
            <CWDivider />
            <div className="list">
              {(quest.action_metas || [])?.map((action, index) => (
                <QuestActionCard
                  key={action.id}
                  actionNumber={index + 1}
                  onActionStart={handleActionStart}
                  questAction={action as QuestActionType}
                  questStartDate={new Date(quest.start_date)}
                  questEndDate={new Date(quest.end_date)}
                  isActionCompleted={isQuestActionComplete(
                    new Date(quest.start_date),
                    new Date(quest.end_date),
                    action as QuestActionType,
                    xpProgressions as unknown as XPLog[],
                  )}
                  xpLogsForActions={getXpLogsForActions(
                    action as QuestActionType,
                  )}
                  canStartAction={
                    isSystemQuest
                      ? !user.isLoggedIn && isStarted && !isEnded
                      : isStarted && !isEnded
                  }
                  actionStartBlockedReason={getQuestActionBlockedReason()}
                />
              ))}
            </div>
          </div>
        </div>
        {pendingWeeklyQuests?.activeWeeklyQuests?.length > 0 && isCompleted && (
          <div className="suggested-quests">
            <CWText type="h3">Suggested Quests</CWText>
            <div className="list">
              {pendingWeeklyQuests.activeWeeklyQuests.slice(0, 3).map((q) => {
                return (
                  <QuestCard
                    key={q.id}
                    name={q.name}
                    description={q.description}
                    communityId={q.community_id || ''}
                    iconURL={q.image_url}
                    xpPointsElement={
                      <TotalQuestXPTag
                        questId={q.id}
                        questStartDate={new Date(q.start_date)}
                        questEndDate={new Date(q.end_date)}
                        questActions={
                          (q.action_metas as z.infer<
                            typeof QuestActionMeta
                          >[]) || []
                        }
                        hideGainedXp
                      />
                    }
                    tasks={{
                      total: q.action_metas?.length || 0,
                      completed: (quest.action_metas || [])
                        .map((action) =>
                          isQuestActionComplete(
                            new Date(q.start_date),
                            new Date(q.end_date),
                            action as QuestActionType,
                            xpProgressions as unknown as XPLog[],
                          ),
                        )
                        .filter(Boolean).length,
                    }}
                    startDate={new Date(q.start_date)}
                    endDate={new Date(q.end_date)}
                    onCTAClick={() =>
                      handleQuestCardCTAClick(q.id, q.community_id || '')
                    }
                    onLeaderboardClick={handleLeaderboardClick}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>
      <AuthModal
        type={authModalConfig.type}
        onClose={() =>
          setAuthModalConfig({ type: undefined, options: undefined })
        }
        showWalletsFor={
          (app?.chain?.base as Exclude<ChainBase, ChainBase.NEAR>) || undefined
        }
        {...(authModalConfig.specificAuthOption && {
          showAuthOptionFor: authModalConfig.specificAuthOption,
        })}
        showAuthOptionTypesFor={authModalConfig.options}
        isOpen={!!(authModalConfig.type && authModalConfig.options)}
      />
    </CWPageLayout>
  );
};

export default QuestDetails;
