import { BalanceType, ChainType } from '@hicommonwealth/core';
import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { detectURL } from 'helpers/threads';
import CommunityInfo from 'models/ChainInfo';
import NodeInfo from 'models/NodeInfo';
import 'pages/AdminPanel.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import {
  CWDropdown,
  DropdownItemType,
} from '../../components/component_kit/cw_dropdown';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  CWValidationText,
  ValidationStatus,
} from '../../components/component_kit/cw_validation_text';
import { CWTypeaheadSelectList } from '../../components/component_kit/new_designs/CWTypeaheadSelectList';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import { openConfirmation } from '../../modals/confirmation_modal';
import { createChainNode, updateChainNode } from './utils';

const RPCEndpointTask = () => {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [rpcEndpointCommunityValue, setRpcEndpointCommunityValue] =
    useState<string>('');
  const [communityInfo, setCommunityInfo] = useState<CommunityInfo>(null);
  const [rpcEndpoint, setRpcEndpoint] = useState<string>('');
  const [communityInfoValueValidated, setCommunityInfoValueValidated] =
    useState<boolean>(false);
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
  const [ethChainId, setEthChainId] = useState<number>(null);
  const [cosmosChainIds, setCosmosChainIds] = useState<DropdownItemType[]>([
    {
      label: '',
      value: '',
    },
  ]);
  const [cosmosChainId, setCosmosChainId] = useState<string>(null);
  const [ethChainIdValueValidated, setEthChainIdValueValidated] =
    useState<boolean>(false);

  useEffect(() => {
    if (balanceType === BalanceType.Cosmos) {
      getCosmosChainIds().then((res) => {
        setCosmosChainIds(res);
      });
    }
  }, [balanceType]);

  const buttonEnabled =
    (communityChainNodeValidated &&
      communityChainNode &&
      communityInfoValueValidated &&
      balanceType !== BalanceType.Ethereum &&
      !ethChainIdValueValidated) ||
    (rpcName !== '' &&
      (bech32 !== '' || balanceType === BalanceType.Ethereum) &&
      rpcEndpoint !== '');

  const setCommunityIdInput = (e) => {
    setRpcEndpointCommunityValue(e.target.value);
    if (e.target.value.length === 0) setCommunityInfoValueValidated(false);
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

    const nodeInfo = app.config.nodes.getByUrl(value);

    if (nodeInfo) {
      setCommunityChainNode(nodeInfo);
      setCommunityChainNodeValidated(true);
    } else {
      setChainNodeNotCreated(true);
    }

    return [];
  };

  const checkIfCosmosChainNodeExists = (cosmosChainId: string): void => {
    const cosmosNodeInfo = app.config.nodes.getByCosmosChainId(cosmosChainId);

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

  const idValidationFn = (value: string): [ValidationStatus, string] | [] => {
    const communityInfo = app.config.chains.getById(value);
    if (!communityInfo) {
      setCommunityInfoValueValidated(false);
      const err = 'Community not found';
      setErrorMsg(err);
      return ['failure', err];
    }
    if (communityInfo.type !== ChainType.Chain) {
      setCommunityInfoValueValidated(false);
      const err = 'Community is not a chain';
      setErrorMsg(err);
      return ['failure', err];
    }
    setCommunityInfo(communityInfo);
    setCommunityInfoValueValidated(true);
    setErrorMsg(null);
    return [];
  };

  const update = async () => {
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
        const res = await updateChainNode({
          id: communityChainNode.id,
          url: rpcEndpoint,
          name: rpcName,
          bech32,
          balance_type: balanceType,
          eth_chain_id: ethChainId,
          cosmos_chain_id: cosmosChainId,
        });
        nodeId = communityChainNode.id;
      }

      if (communityInfo && communityInfoValueValidated) {
        await communityInfo.updateChainData({
          chain_node_id: nodeId ?? communityChainNode.id.toString(),
          type: ChainType.Chain,
        });
      }

      setRpcEndpointCommunityValue('');
      setRpcEndpoint('');
      setCommunityInfo(null);
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
      description: `Are you sure you want to update the rpc endpoint on ${rpcEndpointCommunityValue}?`,
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
    let cosmosChainIds = [{ label: '', value: '' }];

    const { data: chains } = await axios.get(
      `${process.env.COSMOS_REGISTRY_API}/api/v1/mainnet`,
    );

    if (chains) {
      cosmosChainIds = chains.map((chain) => {
        return { label: chain, value: chain };
      });
    }

    return cosmosChainIds;
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Switch/Add RPC Endpoint</CWText>
      <CWText type="caption">
        Changes the RPC endpoint for a specific chain community, or adds a Chain
        Node if it doesn&apos;t yet exist.
      </CWText>
      <div className="MultiRow">
        <div className="TaskRow">
          <CWTextInput
            value={rpcEndpointCommunityValue}
            onInput={setCommunityIdInput}
            inputValidationFn={idValidationFn}
            placeholder="Enter a community id"
          />
          <CWTextInput
            value={rpcEndpoint}
            onInput={(e) => {
              setRpcEndpoint(e.target.value);
            }}
            inputValidationFn={RPCEndpointValidationFn}
            placeholder="Enter an RPC endpoint"
          />
          <CWButton
            label={chainNodeNotCreated ? 'Create' : 'Update'}
            className="TaskButton"
            disabled={!buttonEnabled}
            onClick={openConfirmationModal}
          />
        </div>
        <div>
          <div className="TaskRow">
            <CWDropdown
              label="balance type"
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
            <CWTextInput
              label="name"
              value={rpcName}
              onInput={(e) => {
                setRpcName(e.target.value);
              }}
              placeholder={`Enter chain node name ${
                chainNodeNotCreated ? '' : ' (optional)'
              }`}
            />
          </div>
          {balanceType === BalanceType.Ethereum && (
            <div className="TaskRow">
              <CWTextInput
                value={ethChainId}
                onInput={(e) => {
                  setEthChainId(parseInt(e.target.value));
                }}
                inputValidationFn={ethChainIdEndpointValidationFn}
                placeholder="Enter an ETH chain id"
                label="eth chain id"
              />
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
              <CWTextInput
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
