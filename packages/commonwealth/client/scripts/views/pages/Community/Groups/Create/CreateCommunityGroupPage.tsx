import { notifyError, notifySuccess } from 'controllers/app/notifications';
import Group from 'models/Group';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { useCreateGroupMutation, useFetchGroupsQuery } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import { PageNotFound } from '../../../404';
import { GroupForm } from '../common/GroupForm';
import { SPECIFICATIONS, TOKENS } from '../common/GroupForm/constants';
import './CreateCommunityGroupPage.scss';

const CreateCommunityGroupPage = () => {
  const navigate = useCommonNavigate();
  const { mutateAsync: createGroup } = useCreateGroupMutation();
  const { data: groups = [], isLoading } = useFetchGroupsQuery({
    chainId: app.activeChainId(),
    includeTopics: true,
  });

  if (!isLoading) {
    console.log('group', groups, app.activeChainId());

    if (
      !app.isLoggedIn() ||
      !(Permissions.isCommunityAdmin() || Permissions.isSiteAdmin())
    ) {
      return <PageNotFound />;
    }

    const handleSubmit = (values) => {
      if (groups.length > 0) {
        const foundGroup: Group = groups.find(
          (x) => x.name === values.groupName
        );
        if (foundGroup) {
          notifyError('Group name already exists');
          return;
        }
      }
      const payload = {
        chainId: app.activeChainId(),
        address: app.user.activeAccount.address,
        groupName: values.groupName,
        groupDescription: values.groupDescription,
        topicIds: values.topics.map((x) => x.value),
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
                evm_chain_id: parseInt(x.requirementChain),
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
                evm_chain_id: parseInt(x.requirementChain),
              },
            },
          });
          return;
        }
      });

      createGroup(payload)
        .then(() => {
          notifySuccess('Group Created');
          navigate(`/members`);
        })
        .catch(() => {
          notifyError('Failed to create group');
        });
    };

    return (
      <GroupForm
        formType="create"
        onSubmit={(values) => {
          handleSubmit(values);
        }}
      />
    );
  }
};

export default CreateCommunityGroupPage;
