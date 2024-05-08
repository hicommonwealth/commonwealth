import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import _ from 'lodash';
import Group from 'models/Group';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useEditGroupMutation, useFetchGroupsQuery } from 'state/api/groups';
import useGroupMutationBannerStore from 'state/ui/group';
import Permissions from 'utils/Permissions';
import { MixpanelPageViewEvent } from '../../../../../../../shared/analytics/types';
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
  const [allowListIds, setAllowListIds] = useState<number[]>([]);
  const { setShouldShowGroupMutationBannerForCommunity } =
    useGroupMutationBannerStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { mutateAsync: editGroup } = useEditGroupMutation({
    communityId: app.activeChainId(),
  });
  const { data: groups = [], isLoading } = useFetchGroupsQuery({
    communityId: app.activeChainId(),
    includeTopics: true,
  });
  const foundGroup: Group = groups.find(
    (group) => group.id === parseInt(`${groupId}`),
  );

  useBrowserAnalyticsTrack({
    payload: { event: MixpanelPageViewEvent.GROUPS_EDIT_PAGE_VIEW },
  });

  if (
    !app.isLoggedIn() ||
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
          requirements: foundGroup.requirements.map((requirement) => ({
            requirementType: {
              value: requirement.data.source.source_type,
              label: requirementTypes.find(
                (requirementType) =>
                  requirementType.value === requirement.data.source.source_type,
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
              label: chainTypes.find(
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
          })),
        }}
        onSubmit={(values) => {
          const payload = makeGroupDataBaseAPIPayload(values);
          const finalPayload = {
            ...payload,
            groupId: groupId,
          };

          // if requirements are equal, then don't send them to api
          const isRequirementsEqual = _.isEqual(
            foundGroup.requirements,
            payload.requirements,
          );
          if (isRequirementsEqual) {
            delete finalPayload.requirements;
          }

          editGroup(finalPayload)
            .then(() => {
              notifySuccess('Group Updated');
              if (!isRequirementsEqual) {
                setShouldShowGroupMutationBannerForCommunity(
                  app.activeChainId(),
                  true,
                );
              }
              navigate(`/members?tab=groups`);
            })
            .catch(() => {
              notifyError('Failed to update group');
            });
        }}
        onDelete={() => setIsDeleteModalOpen(true)}
        allowListIds={allowListIds}
        setAllowListIds={setAllowListIds}
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
