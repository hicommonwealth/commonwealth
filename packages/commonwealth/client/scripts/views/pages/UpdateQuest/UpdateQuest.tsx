import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { useFlag } from 'hooks/useFlag';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { fetchCachedNodes } from 'state/api/nodes';
import { useGetQuestByIdQuery } from 'state/api/quest';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../404';
import QuestForm from '../CreateQuest/QuestForm';
import { QuestAction } from '../CreateQuest/QuestForm/QuestActionSubForm';
import {
  buildURLFromContentId,
  inferContentIdTypeFromContentId,
} from '../CreateQuest/QuestForm/helpers';
import { QuestTypes } from '../CreateQuest/QuestForm/types';
import './UpdateQuest.scss';

const UpdateQuest = ({ id }: { id: number }) => {
  const questId = parseInt(`${id}`) || 0;

  const xpEnabled = useFlag('xp');

  const user = useUserStore();
  const navigate = useCommonNavigate();

  const { data: quest, isLoading: isLoadingQuest } = useGetQuestByIdQuery({
    quest_id: questId,
    enabled: !!(xpEnabled && questId),
  });

  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: quest?.community_id || '',
      enabled: !!quest?.community_id,
    });

  useRunOnceOnCondition({
    callback: () => {
      // it will be defined, adding to avoid ts errors
      if (!quest) return;

      // redirect to community quest update page if on global quest update page
      if (
        quest?.community_id &&
        !window.location.pathname.includes(quest.community_id)
      ) {
        navigate(
          `/${quest.community_id}/quests/${quest.id}/update`,
          { replace: true },
          null,
        );
        return;
      }

      // redirect to global quest update page if on community quest update page
      if (
        !quest?.community_id &&
        window.location.pathname !== `/quests/${quest.id}/update`
      ) {
        navigate(`/quests/${quest.id}/update`, { replace: true }, null);
        return;
      }
    },
    shouldRun: !!quest,
  });

  if (!xpEnabled || !user.isLoggedIn || !Permissions.isSiteAdmin())
    return <PageNotFound />;

  if (isLoadingQuest || (quest?.community_id && isLoadingCommunity))
    return <CWCircleMultiplySpinner />;

  if (!quest || (quest?.community_id && !community)) return <PageNotFound />;

  const isStarted = moment().isSameOrAfter(moment(quest.start_date));
  const isEnded = moment().isSameOrAfter(moment(quest.end_date));

  // TODO: 11069 remove after platform get quest fixes are in
  if (quest?.action_metas?.[0]) {
    quest.action_metas[0].ChainEventXpSource = {
      chain_node_id: 1358,
      contract_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      event_signature:
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      tx_hash:
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      quest_action_meta_id: 53,
      active: true,
      created_at: `2025-04-11T16:37:12.769Z`,
      updated_at: `2025-04-11T16:37:12.769Z`,
    } as any;
  }

  return (
    <CWPageLayout>
      <div className="UpdateQuest">
        <div className="header">
          <CWText type="h2">Update Quest</CWText>
        </div>
        {isStarted || isEnded ? (
          <>
            <CWText>Updates only allowed in pre-live stage</CWText>
            <CWButton
              label="Explore Quests"
              onClick={() => navigate('/explore')}
            />
          </>
        ) : (
          <QuestForm
            mode="update"
            questId={quest.id}
            initialValues={{
              description: quest.description || '',
              end_date: quest.end_date,
              image: quest.image_url,
              name: quest.name,
              start_date: quest.start_date,
              max_xp_to_end: `${quest.max_xp_to_end}`,
              quest_type: quest.quest_type as QuestTypes,
              ...(quest.community_id &&
                community && {
                  community: {
                    label: {
                      imageURL: community?.icon_url || '',
                      name: community.name || '',
                    },
                    value: quest.community_id,
                  },
                }),
              subForms: (quest.action_metas || [])?.map((action) => ({
                participationLimit:
                  action.participation_limit ||
                  QuestParticipationLimit.OncePerQuest,
                participationPeriod:
                  action.participation_period || QuestParticipationPeriod.Daily,
                participationTimesPerPeriod:
                  action.participation_times_per_period || 1,
                action: action.event_name as QuestAction,
                // pass creator xp value (not fractional percentage)
                creatorRewardAmount: `${Math.round(action.creator_reward_weight * action.reward_amount)}`,
                rewardAmount: `${action.reward_amount}`,
                instructionsLink: action.instructions_link || '',
                contentIdScope: inferContentIdTypeFromContentId(
                  action.event_name as QuestAction,
                  action.content_id || undefined,
                ),
                contentLink: buildURLFromContentId(action.content_id || ''),
                noOfLikes: `${action.QuestTweet?.like_cap || 0}`,
                noOfRetweets: `${action.QuestTweet?.retweet_cap || 0}`,
                noOfReplies: `${action.QuestTweet?.replies_cap || 0}`,
                contractAddress: `${action.ChainEventXpSource?.contract_address || ''}`,
                ethChainId: action.ChainEventXpSource?.chain_node_id
                  ? `${
                      fetchCachedNodes()?.find(
                        (x) =>
                          x.id === action.ChainEventXpSource?.chain_node_id,
                      )?.ethChainId || ''
                    }`
                  : ``,
                eventSignature: `${action.ChainEventXpSource?.event_signature || ''}`,
                // TODO: 11069 fix type + add tx_hash in response
                transactionHash: `${(action.ChainEventXpSource as any)?.tx_hash || ''}`,
              })),
            }}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default UpdateQuest;
