import { ChainType } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import 'pages/AdminPanel.scss';
import React, { useState } from 'react';
import {
  useGetCommunityByIdQuery,
  useUpdateCommunityMutation,
} from 'state/api/communities';
import { useFetchNodesQuery } from 'state/api/nodes';
import { useDebounce } from 'usehooks-ts';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from '../../modals/confirmation_modal';

const ConnectChainToCommunityTask = () => {
  const [rpcEndpointCommunityId, setRpcEndpointCommunityId] =
    useState<string>('');
  const [communityInfoValueValidated, setCommunityInfoValueValidated] =
    useState<boolean>(false);

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: rpcEndpointCommunityId,
  });

  const { data: chainTypes } = useFetchNodesQuery();
  console.log('chainTypes', chainTypes);
  //move the below into a function inside utils
  const chains =
    chainTypes
      ?.map((chain) => ({
        label: chain.name,
        value: chain.name,
      }))
      .sort((a, b) =>
        (a?.label || '').toLowerCase().localeCompare(b?.label || ''),
      ) || [];
  console.log('chains', chains);

  const debouncedCommunityLookupId = useDebounce<string | undefined>(
    rpcEndpointCommunityId,
    500,
  );

  const { data: communityLookupData, isLoading: isLoadingCommunityLookupData } =
    useGetCommunityByIdQuery({
      id: debouncedCommunityLookupId || '',
      enabled: !!debouncedCommunityLookupId,
    });

  const communityNotFound =
    !isLoadingCommunityLookupData &&
    (!communityLookupData ||
      Object.keys(communityLookupData || {})?.length === 0);

  const communityNotChain = communityLookupData?.type !== ChainType.Chain;
  console.log('communityLookupData: ', communityLookupData);
  const buttonEnabled = rpcEndpointCommunityId.length !== 0;

  const setCommunityIdInput = (e) => {
    setRpcEndpointCommunityId(e?.target?.value?.trim() || '');
    if (e?.target?.value?.trim()?.length === 0)
      setCommunityInfoValueValidated(false);
  };

  const communityIdInputError = (() => {
    if (communityNotFound) return 'Community not found';
    if (communityNotChain) return 'Community is not a chain';
    return '';
  })();

  const update = async () => {
    if (
      Object.keys(communityLookupData || {}).length > 0 &&
      communityInfoValueValidated
    ) {
      try {
        // await updateCommunity({
        //   communityId: communityLookupData?.id,
        //   chainNodeId: nodeId ?? communityChainNode?.id?.toString(),
        //   type: ChainType.Chain,
        // });
        notifySuccess('Chain connected to community');
      } catch (error) {
        notifyError('Error connecting chain to community');
        console.error(error);
      }
    }
  };
  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Connect Chain to Community',
      description: `Are you sure you want to connect this chain to this community?`,
      buttons: [
        {
          label: 'Update',
          buttonType: 'primary',
          buttonHeight: 'sm',
          onClick: update,
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Connect Chain to Community</CWText>
      <CWText type="caption">Connects a specific chain to a community</CWText>
      <div className="TaskRow">
        <CWTextInput
          label="Community Id"
          value={rpcEndpointCommunityId}
          onInput={setCommunityIdInput}
          customError={communityIdInputError}
          placeholder="Enter a community id"
        />
        <CWDropdown
          label="Select chain"
          options={chains}
          onSelect={(item) => console.log(item)}
        />
        <CWButton
          label="Connect"
          className="TaskButton"
          disabled={!buttonEnabled}
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default ConnectChainToCommunityTask;
