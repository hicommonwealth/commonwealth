import useRunOnceOnCondition from 'client/scripts/hooks/useRunOnceOnCondition';
import { buildUpdateGroupInput } from 'client/scripts/state/api/groups/editGroup';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import Group from 'models/Group';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo, useState } from 'react';
import { useBrowserAnalyticsTrack } from 'shared/hooks/useBrowserAnalyticsTrack';
import app from 'state';
import { useEditGroupMutation, useFetchGroupsQuery } from 'state/api/groups';
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
  TRUST_LEVEL_SPECIFICATION,
} from '../../common/constants';
import { convertRequirementAmountFromWeiToTokens } from '../../common/helpers';
import { DeleteGroupModal } from '../DeleteGroupModal';
import { GroupForm } from '../common/GroupForm';
import { GroupTrustLevelOptions } from '../common/GroupForm/RequirementSubForm/helpers';
import { makeGroupDataBaseAPIPayload } from '../common/helpers';
import './UpdateCommunityGroupPage.scss';

const UpdateCommunityGroupPage = ({ groupId }: { groupId: string }) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const communityId = app.activeChainId() || '';
  const { mutateAsync: editGroup, isPending: isUpdatingGroup } =
    useEditGroupMutation({
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

  useRunOnceOnCondition({
    callback: () => setAllowedAddresses(initialAllowlist),
    shouldRun: initialAllowlist?.length > 0,
  });

  const { isAddedToHomeScreen } = useAppStatus();

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

  const getInitialValues = () => {
    return {
      groupName: foundGroup.name,
      groupDescription: foundGroup.description,
      groupImageUrl: foundGroup.groupImageUrl || '',
      requirements: (foundGroup?.requirements || [])
        .filter((r) => r?.data?.source || r.rule === TRUST_LEVEL_SPECIFICATION)
        .map((requirement) =>
          requirement.rule === TRUST_LEVEL_SPECIFICATION
            ? {
                requirementType: {
                  value: TRUST_LEVEL_SPECIFICATION,
                  label:
                    requirementTypes.find(
                      (requirementType) =>
                        requirementType.value === TRUST_LEVEL_SPECIFICATION,
                    )?.label || '',
                },
                requirementTrustLevel: {
                  value: `${requirement?.data?.minimum_trust_level}`,
                  label:
                    GroupTrustLevelOptions.find(
                      (requirementType) =>
                        requirementType.value.toString() ===
                        requirement?.data?.minimum_trust_level?.toString(),
                    )?.label || '',
                },
              }
            : {
                requirementType: {
                  value: requirement.data.source.source_type,
                  label:
                    requirementTypes.find(
                      (requirementType) =>
                        requirementType.value ===
                        requirement.data.source.source_type,
                    )?.label || '',
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
                  label:
                    chainTypes?.find(
                      (chain) =>
                        chain.value ==
                        (requirement.data.source.cosmos_chain_id ||
                          requirement.data.source.evm_chain_id ||
                          requirement.data.source.solana_network ||
                          requirement.data.source.sui_network),
                    )?.label || '',
                },
                requirementContractAddress:
                  requirement.data.source.contract_address ||
                  requirement.data.source.object_id ||
                  requirement.data.source.collection_id ||
                  '',
                requirementCoinType: requirement.data.source.coin_type || '',
                // API doesn't return this, api internally uses the "more than" option, so we set it here explicitly
                requirementCondition: conditionTypes.find(
                  (condition) => condition.value === AMOUNT_CONDITIONS.MORE,
                ),
              },
        ),
      requirementsToFulfill:
        foundGroup.requirementsToFulfill === foundGroup.requirements.length
          ? ('ALL' as const)
          : foundGroup.requirementsToFulfill || 0,
      topics: (foundGroup.topics || []).map((topic) => ({
        label: topic.name,
        value: topic.id,
        is_private: topic.is_private,
        permission: topic.permissions || [],
      })),
    };
  };

  return (
    <>
      <GroupForm
        formType="edit"
        initialValues={getInitialValues()}
        onSubmit={(values) => {
          const payload = makeGroupDataBaseAPIPayload(values, allowedAddresses);
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
        isSubmitting={isUpdatingGroup}
        onDelete={() => setIsDeleteModalOpen(true)}
        allowedAddresses={allowedAddresses}
        setAllowedAddresses={setAllowedAddresses}
      />
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
