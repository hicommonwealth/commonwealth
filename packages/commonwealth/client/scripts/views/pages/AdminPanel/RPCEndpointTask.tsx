import { BalanceType, ChainType } from '@hicommonwealth/shared';
import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { detectURL } from 'helpers/threads';
import NodeInfo from 'models/NodeInfo';
import 'pages/AdminPanel.scss';
import React, { useEffect, useState } from 'react';
import {
  useGetCommunityByIdQuery,
  useUpdateCommunityMutation,
} from 'state/api/communities';
import { getNodeByCosmosChainId, getNodeByUrl } from 'state/api/nodes/utils';
import { useDebounce } from 'usehooks-ts';
import useFetchNodesQuery from '../../../state/api/nodes/fetchNodes';
import {
  CWDropdown,
  DropdownItemType,
} from '../../components/component_kit/cw_dropdown';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput as CWTextInputOld } from '../../components/component_kit/cw_text_input';
import {
  CWValidationText,
  ValidationStatus,
} from '../../components/component_kit/cw_validation_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { CWTypeaheadSelectList } from '../../components/component_kit/new_designs/CWTypeaheadSelectList';
import { openConfirmation } from '../../modals/confirmation_modal';
import { createChainNode, updateChainNode } from './utils';

const RPCEndpointTask = () => {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [rpcEndpointCommunityId, setRpcEndpointCommunityId] =
    useState<string>('');
  const [rpcEndpoint, setRpcEndpoint] = useState<string>('');
  // @ts-expect-error <StrictNullChecks/>
  const [communityChainNode, setCommunityChainNode] = useState<NodeInfo>(null);
  const [communityChainNodeValidated, setCommunityChainNodeValidated] =
    useState<boolean>(false);
  const [rpcName, setRpcName] = useState<string>('');
  const [bech32, setBech32] = useState<string>('');
  const [balanceType, setBalanceType] = useState<BalanceType>(
    BalanceType.Ethereum,
  );
  const [chainNodeNotCreated, setChainNodeNotCreated] =
    useState<boolean>(false);
  // @ts-expect-error <StrictNullChecks/>
  const [ethChainId, setEthChainId] = useState<number>(null);
  const [cosmosChainIds, setCosmosChainIds] = useState<DropdownItemType[]>([
    {
      label: '',
      value: '',
    },
  ]);
  // @ts-expect-error <StrictNullChecks/>
  const [cosmosChainId, setCosmosChainId] = useState<string>(null);
  const [ethChainIdValueValidated, setEthChainIdValueValidated] =
    useState<boolean>(false);

  const { data: nodes } = useFetchNodesQuery();

  useEffect(() => {
    if (balanceType === BalanceType.Cosmos) {
      getCosmosChainIds().then((res) => {
        setCosmosChainIds(res);
      });
    }
  }, [balanceType]);

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

  const buttonEnabled =
    (communityChainNodeValidated &&
      communityChainNode &&
      balanceType !== BalanceType.Ethereum &&
      !ethChainIdValueValidated) ||
    (rpcName !== '' &&
      (bech32 !== '' || balanceType === BalanceType.Ethereum) &&
      rpcEndpoint !== '');

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: rpcEndpointCommunityId,
  });

  const setCommunityIdInput = (e) => {
    setRpcEndpointCommunityId(e?.target?.value?.trim() || '');
    if (e?.target?.value?.trim()?.length === 0)
      setCommunityInfoValueValidated(false);
  };

  const RPCEndpointValidationFn = (
    value: string,
  ): [ValidationStatus, string] | [] => {
    if (
      !detectURL(value) &&
      value.startsWith('wss://') === false &&
      value.startsWith('ws://') === false
    ) {
      setCommunityChainNodeValidated(false);
      const err = 'Not a valid URL';
      setErrorMsg(err);
      return ['failure', err];
    }

    setErrorMsg(null);

    const nodeInfo = getNodeByUrl(value, nodes);

    if (nodeInfo) {
      setCommunityChainNode(nodeInfo);
      setCommunityChainNodeValidated(true);
    } else {
      setChainNodeNotCreated(true);
    }

    return [];
  };

  const checkIfCosmosChainNodeExists = (
    selectedCosmosChainId: string,
  ): void => {
    const cosmosNodeInfo = getNodeByCosmosChainId(selectedCosmosChainId);

    if (cosmosNodeInfo) {
      setCommunityChainNode(cosmosNodeInfo);
      setCommunityChainNodeValidated(true);
      setChainNodeNotCreated(false);
    } else {
      setChainNodeNotCreated(true);
    }
  };

  const ethChainIdEndpointValidationFn = (
    value: string,
  ): [ValidationStatus, string] | [] => {
    if (value === '' || /^[1-9]\d*$/.test(value)) {
      setErrorMsg(null);
      return [];
    }

    setEthChainIdValueValidated(false);
    const err = 'ETH chain id provided is not a number';
    setErrorMsg(err);
    return ['failure', err];
  };

  const update = async () => {
    if (!communityLookupData?.id) return;
    try {
      let nodeId = null;
      if (chainNodeNotCreated) {
        // Create Chain Node if not yet created
        const res = await createChainNode({
          url: rpcEndpoint,
          name: rpcName,
          bech32,
          balance_type: balanceType,
          eth_chain_id: ethChainId,
          cosmos_chain_id: cosmosChainId,
        });
        nodeId = res.data.result.node_id;
      } else {
        await updateChainNode({
          id: communityChainNode.id,
          url: rpcEndpoint,
          name: rpcName,
          bech32,
          balance_type: balanceType,
          eth_chain_id: ethChainId,
          cosmos_chain_id: cosmosChainId,
        });
        // @ts-expect-error <StrictNullChecks/>
        nodeId = communityChainNode.id;
      }

      if (communityInfo) {
        await communityInfo.updateChainData({
          chain_node_id: nodeId ?? communityChainNode.id.toString(),
          type: ChainType.Chain,
        });
      }

      setRpcEndpointCommunityId('');
      setRpcEndpoint('');
      // @ts-expect-error <StrictNullChecks/>
      setCommunityChainNode(null);
      setCommunityChainNodeValidated(false);
      setBech32('');
      setRpcName('');
      setErrorMsg(null);
      notifySuccess('RPC Endpoint Updated');
    } catch (e) {
      notifyError('Error updating RPC Endpoint');
      console.error(e);
      setErrorMsg(e?.message);
    }
  };

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Update RPC Endpoint',
      description: `Are you sure you want to update the rpc endpoint on ${rpcEndpointCommunityId}?`,
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

  const getCosmosChainIds = async (): Promise<DropdownItemType[]> => {
    let chainIds = [{ label: '', value: '' }];

    const { data: chains } = await axios.get(
      `${process.env.COSMOS_REGISTRY_API}/api/v1/mainnet`,
    );

    if (chains) {
      chainIds = chains.map((chain) => {
        return { label: chain, value: chain };
      });
    }

    return chainIds;
  };

  const communityIdInputError = (() => {
    if (communityNotFound) return 'Community not found';
    if (communityNotChain) return 'Community is not a chain';
    return '';
  })();

  return (
    <div className="TaskGroup">
      <CWText type="h4">Switch/Add RPC Endpoint</CWText>
      <CWText type="caption">
        Changes the RPC endpoint for a specific chain community, or adds a Chain
        Node if it doesn&apos;t yet exist.
      </CWText>
      <CWText type="caption">
        Chain name, ETH chain id, and RPC enpoint can be found here:
      </CWText>
      <div>
        <a
          href="https://chainlist.org/"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'blue' }}
        >
          https://chainlist.org/
        </a>
      </div>
      <div className="MultiRow">
        {balanceType === BalanceType.Ethereum && (
          <div className="TaskRow">
            <CWTextInput
              value={rpcEndpoint}
              onInput={(e) => {
                setRpcEndpoint(e.target.value);
              }}
              inputValidationFn={RPCEndpointValidationFn}
              placeholder="Enter an RPC endpoint (Required)"
            />
            <CWButton
              label={chainNodeNotCreated ? 'Create' : 'Update'}
              className="TaskButton"
              disabled={!buttonEnabled}
              onClick={openConfirmationModal}
            />
          </div>
        )}
        <div>
          <div className="TaskRow">
            <CWDropdown
              label="Network family"
              options={[
                { label: 'ethereum', value: BalanceType.Ethereum },
                { label: 'solana', value: BalanceType.Solana },
                { label: 'cosmos', value: BalanceType.Cosmos },
                { label: 'NEAR', value: BalanceType.NEAR },
                { label: 'substrate', value: BalanceType.Substrate },
              ]}
              onSelect={(item) => {
                setBalanceType(item.value as BalanceType);
              }}
            />
            {balanceType === BalanceType.Ethereum && (
              <CWTextInput
                label="Chain name"
                value={rpcName}
                onInput={(e) => {
                  setRpcName(e.target.value);
                }}
                placeholder="Enter chain node name (Required)"
              />
            )}
          </div>
          {balanceType === BalanceType.Ethereum ? (
            <div className="TaskRow">
              <CWTextInputOld
                value={ethChainId}
                onInput={(e) => {
                  setEthChainId(parseInt(e.target.value));
                }}
                inputValidationFn={ethChainIdEndpointValidationFn}
                placeholder="Enter an ETH chain id (Required)"
                label="eth chain id"
              />
            </div>
          ) : (
            <div className="nonEVMMessage">
              Please contact an engineer to add any chains that are not
              EVM/Ethereum
            </div>
          )}
          {balanceType === BalanceType.Cosmos && (
            <div className="TaskRow">
              <div className="dropdown-type multi-select w-full">
                <CWLabel label="cosmos chain id" />
                <CWTypeaheadSelectList
                  placeholder="Select Cosmos Chain ID"
                  options={cosmosChainIds}
                  defaultValue={{
                    label: 'Search for Cosmos ID',
                    value: '',
                  }}
                  onChange={(selectedOption) => {
                    checkIfCosmosChainNodeExists(selectedOption.value);
                    setCosmosChainId(selectedOption.value);
                  }}
                />
              </div>
              <CWTextInputOld
                label="bech32"
                value={bech32}
                onInput={(e) => {
                  setBech32(e.target.value);
                }}
                placeholder={`Enter bech32 ${
                  chainNodeNotCreated ? '' : ' (optional)'
                }`}
              />
            </div>
          )}
        </div>
      </div>
      {errorMsg && (
        <CWValidationText
          className="validation-text"
          message={errorMsg}
          status="failure"
        />
      )}
    </div>
  );
};

export default RPCEndpointTask;
