import { notifyError, notifySuccess } from 'controllers/app/notifications';
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
  SPECIFICATIONS,
  TOKENS,
  chainTypes,
  conditionTypes,
  requirementTypes,
} from '../../common/constants';
import { DeleteGroupModal } from '../DeleteGroupModal';
import { GroupForm } from '../common/GroupForm';
import './UpdateCommunityGroupPage.scss';

const UpdateCommunityGroupPage = ({ groupId }: { groupId: string }) => {
  const navigate = useCommonNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { mutateAsync: editGroup } = useEditGroupMutation();
  const { data: groups = [], isLoading } = useFetchGroupsQuery({
    chainId: app.activeChainId(),
    includeTopics: true,
  });
  const foundGroup: Group = groups.find((x) => x.id === parseInt(`${groupId}`));

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
          requirements: foundGroup.requirements.map((x) => ({
            requirementType: {
              value: x.data.source.source_type,
              label: requirementTypes.find(
                (y) => y.value === x.data.source.source_type
              ).label,
            },
            requirementAmount: x.data.threshold,
            requirementChain: {
              value:
                x.data.source.cosmos_chain_id || x.data.source.evm_chain_id,
              label: chainTypes.find(
                (c) =>
                  c.value === x.data.source.cosmos_chain_id ||
                  x.data.source.evm_chain_id
              )?.label,
            },
            requirementContractAddress: x.data.source.contract_address || '',
            requirementCondition: conditionTypes.find(
              (y) => y.value === AMOUNT_CONDITIONS.MORE
            ), // TODO: API doesn't return this, api internally uses the "more than" option, so we set it here explicitly
          })),
          // requirementsToFulfill: foundGroup.requirementsToFulfill || [], TODO: API doesn't return this
          topics: (foundGroup.topics || []).map((x) => ({
            label: x.name,
            value: x.id,
          })), // TODO: This is non-modifiable in the edit request, the input can be disabled
        }}
        onSubmit={(values) => {
          const payload = {
            chainId: app.activeChainId(),
            address: app.user.activeAccount.address,
            groupId: groupId,
            groupName: values.groupName,
            groupDescription: values.groupDescription,
            requirementsToFulfill:
              values.requirementsToFulfill === 'ALL'
                ? undefined
                : values.requirementsToFulfill, // TODO: confirm if undefined means all requirements need to be satisfied
            requirements: [],
          };

          // map requirements and add to payload
          values.requirements.map((x) => {
            if (
              x.requirementType === SPECIFICATIONS.ERC_20 ||
              x.requirementType === SPECIFICATIONS.ERC_721
            ) {
              payload.requirements.push({
                rule: 'threshold',
                data: {
                  threshold: x.requirementAmount,
                  source: {
                    source_type: x.requirementType,
                    evm_chain_id: x.requirementChain,
                    contract_address: x.requirementContractAddress,
                  },
                },
              });
              return;
            }

            if (x.requirementType === TOKENS.COSMOS_TOKEN) {
              payload.requirements.push({
                rule: 'threshold',
                data: {
                  threshold: x.requirementAmount,
                  source: {
                    source_type: x.requirementType,
                    cosmos_chain_id: x.requirementChain,
                    token_symbol: 'COS',
                  },
                },
              });
              return;
            }

            if (x.requirementType === TOKENS.EVM_TOKEN) {
              payload.requirements.push({
                rule: 'threshold',
                data: {
                  threshold: x.requirementAmount,
                  source: {
                    source_type: x.requirementType,
                    evm_chain_id: x.requirementChain,
                  },
                },
              });
              return;
            }
          });

          editGroup(payload)
            .then(() => {
              notifySuccess('Group Updated');
              navigate(`/members`);
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
