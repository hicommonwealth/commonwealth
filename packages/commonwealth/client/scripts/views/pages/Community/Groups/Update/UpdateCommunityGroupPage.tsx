import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { featureFlags } from 'helpers/feature-flags';
import Group from 'models/Group';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useEditGroupMutation, useFetchGroupsQuery } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import { PageNotFound } from '../../../404';
import { PageLoading } from '../../../loading';
import {
  AMOUNT_CONDITIONS,
  chainTypes,
  conditionTypes,
  requirementTypes
} from '../../common/constants';
import { DeleteGroupModal } from '../DeleteGroupModal';
import { GroupForm } from '../common/GroupForm';
import { makeGroupDataBaseAPIPayload } from '../common/helpers';
import './UpdateCommunityGroupPage.scss';

const UpdateCommunityGroupPage = ({ groupId }: { groupId: string }) => {
  const navigate = useCommonNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { mutateAsync: editGroup } = useEditGroupMutation({
    chainId: app.activeChainId()
  });
  const { data: groups = [], isLoading } = useFetchGroupsQuery({
    chainId: app.activeChainId(),
    includeTopics: true
  });
  const foundGroup: Group = groups.find((x) => x.id === parseInt(`${groupId}`));

  if (
    !featureFlags.gatingEnabled ||
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
          requirements: foundGroup.requirements.map((x) => ({
            requirementType: {
              value: x.data.source.source_type,
              label: requirementTypes.find(
                (y) => y.value === x.data.source.source_type
              )?.label
            },
            requirementAmount: x.data.threshold,
            requirementTokenId: x.data.source.token_id,
            requirementChain: {
              value: `${
                x.data.source.cosmos_chain_id || x.data.source.evm_chain_id || 0
              }`,
              label: chainTypes.find(
                (c) =>
                  c.value == x.data.source.cosmos_chain_id ||
                  x.data.source.evm_chain_id
              )?.label
            },
            requirementContractAddress: x.data.source.contract_address || '',
            // API doesn't return this, api internally uses the "more than" option, so we set it here explicitly
            requirementCondition: conditionTypes.find(
              (y) => y.value === AMOUNT_CONDITIONS.MORE
            ),
          })),
          requirementsToFulfill:
            foundGroup.requirementsToFulfill === foundGroup.requirements.length
              ? 'ALL'
              : foundGroup.requirementsToFulfill,
          topics: (foundGroup.topics || []).map((x) => ({
            label: x.name,
            value: x.id
          }))
        }}
        onSubmit={(values) => {
          const payload = makeGroupDataBaseAPIPayload(values);

          editGroup({
            ...payload,
            groupId: groupId
          })
            .then(() => {
              notifySuccess('Group Updated');
              navigate(`/members?tab=groups`);
            })
            .catch(() => {
              notifyError('Failed to update group');
            });
        }}
        onDelete={() => setIsDeleteModalOpen(true)}
      />
      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        groupId={foundGroup.id}
        groupName={foundGroup.name}
        gatedTopics={(foundGroup?.topics || []).map((x) => x.name)}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};

export default UpdateCommunityGroupPage;
