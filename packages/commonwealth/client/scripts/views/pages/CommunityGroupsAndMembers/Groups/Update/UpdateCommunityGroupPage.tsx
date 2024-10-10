import { buildUpdateGroupInput } from 'client/scripts/state/api/groups/editGroup';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import Group from 'models/Group';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useEditGroupMutation, useFetchGroupsQuery } from 'state/api/groups';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { MixpanelPageViewEvent } from '../../../../../../../shared/analytics/types';
import useAppStatus from '../../../../../hooks/useAppStatus';
import { PageNotFound } from '../../../404';
import { PageLoading } from '../../../loading';
import {
  AMOUNT_CONDITIONS,
  chainTypes,
  conditionTypes,
  requirementTypes,
} from '../../common/constants';
import { convertRequirementAmountFromWeiToTokens } from '../../common/helpers';
import { DeleteGroupModal } from '../DeleteGroupModal';
import { GroupForm } from '../common/GroupForm';
import { makeGroupDataBaseAPIPayload } from '../common/helpers';
import './UpdateCommunityGroupPage.scss';

const UpdateCommunityGroupPage = ({ groupId }: { groupId: string }) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const communityId = app.activeChainId() || '';
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

  useEffect(() => {
    if (initialAllowlist) {
      setAllowedAddresses(initialAllowlist);
    }
  }, [initialAllowlist]);

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.GROUPS_EDIT_PAGE_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });

  if (
    !user.isLoggedIn ||
    !(Permissions.isCommunityAdmin() || Permissions.isSiteAdmin())
  ) {
    return <PageNotFound />;
  }

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <>
      <GroupForm
        formType="edit"
        initialValues={{
          groupName: foundGroup.name,
          groupDescription: foundGroup.description,
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
                  0
                }`,
                label: chainTypes?.find(
                  (chain) =>
                    chain.value ==
                    (requirement.data.source.cosmos_chain_id ||
                      requirement.data.source.evm_chain_id),
                )?.label,
              },
              requirementContractAddress:
                requirement.data.source.contract_address || '',
              // API doesn't return this, api internally uses the "more than" option, so we set it here explicitly
              requirementCondition: conditionTypes.find(
                (condition) => condition.value === AMOUNT_CONDITIONS.MORE,
              ),
            })),
          requirementsToFulfill:
            foundGroup.requirementsToFulfill === foundGroup.requirements.length
              ? 'ALL'
              : foundGroup.requirementsToFulfill,
          topics: (foundGroup.topics || []).map((topic) => ({
            label: topic.name,
            value: topic.id,
            permission: topic.permission,
          })),
        }}
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
