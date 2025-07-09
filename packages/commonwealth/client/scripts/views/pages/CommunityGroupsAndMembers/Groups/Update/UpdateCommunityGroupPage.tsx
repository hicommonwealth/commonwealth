import { useFlag } from 'client/scripts/hooks/useFlag';
import { buildUpdateGroupInput } from 'client/scripts/state/api/groups/editGroup';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import Group from 'models/Group';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo, useState } from 'react';
import app from 'state';
import { useEditGroupMutation, useFetchGroupsQuery } from 'state/api/groups';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { MixpanelPageViewEvent } from '../../../../../../../shared/analytics/types';
import useAppStatus from '../../../../../hooks/useAppStatus';
import { LoadingIndicator } from '../../../../components/LoadingIndicator/LoadingIndicator';
import { PageNotFound } from '../../../404';
import {
  AMOUNT_CONDITIONS,
  chainTypes,
  conditionTypes,
  requirementTypes,
} from '../../common/constants';
import { convertRequirementAmountFromWeiToTokens } from '../../common/helpers';
import { DeleteGroupModal } from '../DeleteGroupModal';
import { GroupForm } from '../common/GroupForm';
import GroupFormNew from '../common/GroupFormNew';
import { makeGroupDataBaseAPIPayload } from '../common/helpers';
import './UpdateCommunityGroupPage.scss';

const UpdateCommunityGroupPage = ({ groupId }: { groupId: string }) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const communityId = app.activeChainId() || '';
  const { data: topicsData = [] } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });
  const { mutateAsync: editGroup } = useEditGroupMutation({
    communityId,
  });
  const { data: groups = [], isLoading } = useFetchGroupsQuery({
    communityId,
    includeTopics: true,
    enabled: !!communityId,
  });
  // @ts-expect-error <StrictNullChecks/>
  const foundGroup: Group = groups.find(
    (group) => group.id === parseInt(`${groupId}`),
  );

  const initialAllowlist = useMemo(() => {
    return foundGroup?.requirements
      .filter((r) => r?.rule === 'allow') // Filter only the allowlist rules
      .flatMap((r) => r?.data?.allow || []); // Flatten and aggregate all addresses
  }, [foundGroup]);

  const [allowedAddresses, setAllowedAddresses] = useState<string[]>(
    initialAllowlist ?? [],
  );

  const { isAddedToHomeScreen } = useAppStatus();

  const useNewGroupForm = useFlag('newGroupForm');

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.GROUPS_EDIT_PAGE_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });

  if (
    !user.isLoggedIn ||
    !(Permissions.isCommunityAdmin() || Permissions.isSiteAdmin()) ||
    (!foundGroup && !isLoading)
  ) {
    return <PageNotFound />;
  }

  if (isLoading) {
    return <LoadingIndicator />;
  }

  // Minimal mapping for new form initialValue
  const newFormInitialValue = {
    community_id: foundGroup.communityId,
    group_id: foundGroup.id,
    metadata: {
      name: foundGroup.name,
      description: foundGroup.description || '',
      groupImageUrl: foundGroup.groupImageUrl || '',
      required_requirements: foundGroup.requirementsToFulfill,
    },
    requirements: foundGroup.requirements,
    topics: (foundGroup.topics || []).map((topic) => ({
      id: topic.id,
      is_private: topic.is_private,
      permissions: topic.permissions || [],
    })),
  };

  const sortedTopics = (topicsData || []).sort((a, b) =>
    a?.name?.localeCompare(b.name),
  );
  const topicOptions = sortedTopics
    .filter((topic) => typeof topic.id === 'number')
    .map((topic) => ({ label: topic.name, value: topic.id as number }));

  return (
    <>
      {useNewGroupForm ? (
        <GroupFormNew
          mode="edit"
          initialValue={newFormInitialValue}
          topics={topicOptions}
          onSuccess={() => {
            notifySuccess('Group Updated');
            navigate(`/members?tab=groups`);
          }}
        />
      ) : (
        <GroupForm
          formType="edit"
          initialValues={{
            groupName: foundGroup.name,
            groupDescription: foundGroup.description,
            groupImageUrl: foundGroup.groupImageUrl || '',
            // @ts-expect-error <StrictNullChecks/>
            requirements: foundGroup.requirements
              .filter((r) => r?.data?.source) // filter erc groups
              .map((requirement) => ({
                requirementType: {
                  value: requirement.data.source.source_type,
                  label: requirementTypes.find(
                    (requirementType) =>
                      requirementType.value ===
                      requirement.data.source.source_type,
                  )?.label,
                },
                requirementTokenId: requirement.data.source.token_id,
                requirementAmount: convertRequirementAmountFromWeiToTokens(
                  requirement.data.source.source_type,
                  requirement.data.threshold.trim(),
                ),
                requirementChain: {
                  value: `${
                    requirement.data.source.cosmos_chain_id ||
                    requirement.data.source.evm_chain_id ||
                    requirement.data.source.solana_network ||
                    requirement.data.source.sui_network ||
                    0
                  }`,
                  label: chainTypes?.find(
                    (chain) =>
                      chain.value ==
                      (requirement.data.source.cosmos_chain_id ||
                        requirement.data.source.evm_chain_id ||
                        requirement.data.source.solana_network ||
                        requirement.data.source.sui_network),
                  )?.label,
                },
                requirementContractAddress:
                  requirement.data.source.contract_address ||
                  requirement.data.source.object_id ||
                  '',
                requirementCoinType: requirement.data.source.coin_type || '',
                // API doesn't return this, api internally uses the "more than" option, so we set it here explicitly
                requirementCondition: conditionTypes.find(
                  (condition) => condition.value === AMOUNT_CONDITIONS.MORE,
                ),
              })),
            requirementsToFulfill:
              foundGroup.requirementsToFulfill ===
              foundGroup.requirements.length
                ? 'ALL'
                : foundGroup.requirementsToFulfill,
            topics: (foundGroup.topics || []).map((topic) => ({
              label: topic.name,
              value: topic.id,
              is_private: topic.is_private,
              permission: topic.permissions || [],
            })),
          }}
          onSubmit={(values) => {
            const payload = makeGroupDataBaseAPIPayload(
              values,
              allowedAddresses,
            );
            const input = buildUpdateGroupInput({
              ...payload,
              groupId: groupId,
            });

            editGroup(input)
              .then(() => {
                notifySuccess('Group Updated');
                navigate(`/members?tab=groups`);
              })
              .catch(() => {
                notifyError('Failed to update group');
              });
          }}
          onDelete={() => setIsDeleteModalOpen(true)}
          allowedAddresses={allowedAddresses}
          setAllowedAddresses={setAllowedAddresses}
        />
      )}
      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        groupId={foundGroup.id}
        groupName={foundGroup.name}
        gatedTopics={(foundGroup?.topics || []).map((topic) => topic.name)}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};

export default UpdateCommunityGroupPage;
