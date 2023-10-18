import React from 'react';
import app from 'state';
import { useEditGroupMutation } from 'state/api/groups';
import { useFetchGroupsQuery } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import { PageNotFound } from '../../../404';
import { GroupForm } from '../common/GroupForm';
import './UpdateCommunityGroupPage.scss';
import { PageLoading } from '../../../loading';
import Group from 'models/Group';
import {
  SPECIFICATIONS,
  TOKENS,
  chainTypes,
  requirementTypes,
} from '../common/GroupForm/constants';
import { useCommonNavigate } from 'navigation/helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

const UpdateCommunityGroupPage = ({ groupId }: { groupId: string }) => {
  const navigate = useCommonNavigate();
  const { mutateAsync: editGroup } = useEditGroupMutation();
  const { data: groups = [], isLoading } = useFetchGroupsQuery({
    chainId: app.activeChainId(),
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
            value: x.data.source.cosmos_chain_id || x.data.source.evm_chain_id,
            label: chainTypes.find(
              (c) =>
                c.value === x.data.source.cosmos_chain_id ||
                x.data.source.evm_chain_id
            ).label,
          },
          requirementContractAddress: x.data.source.contract_address || '',
          // requirementCondition // TODO: API doesn't return this
        })),
        // requirementsToFulfill: foundGroup.requirementsToFulfill || [], TODO: API doesn't return this
        // topics: foundGroup.topicIds || [], TODO: API doesn't return this
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
                  token_symbol: '', // TODO: get symbol
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
    />
  );
};

export default UpdateCommunityGroupPage;
