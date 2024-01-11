import { BalanceType } from '@hicommonwealth/core';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { detectURL } from 'helpers/threads';
import CommunityInfo from 'models/ChainInfo';
import NodeInfo from 'models/NodeInfo';
import 'pages/AdminPanel.scss';
import React, { useState } from 'react';
import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import { openConfirmation } from '../../modals/confirmation_modal';
import { createChainNode } from './utils';

const RPCEndpointTask = () => {
  const [rpcEndpointChainValue, setRpcEndpointChainValue] =
    useState<string>('');
  const [rpcEndpointChain, setRpcEndpointChain] = useState<CommunityInfo>(null);
  const [rpcEndpoint, setRpcEndpoint] = useState<string>('');
  const [rpcEndpointChainValueValidated, setRpcEndpointChainValueValidated] =
    useState<boolean>(false);
  const [rpcEndpointChainNode, setRpcEndpointChainNode] =
    useState<NodeInfo>(null);
  const [rpcEndpointChainNodeValidated, setRpcEndpointChainNodeValidated] =
    useState<boolean>(false);
  const [rpcName, setRpcName] = useState<string>('');
  const [bech32, setBech32] = useState<string>('');
  const [balanceType, setBalanceType] = useState<BalanceType>(
    BalanceType.Ethereum,
  );
  const [chainNodeNotCreated, setChainNodeNotCreated] =
    useState<boolean>(false);
  const [ethChainId, setEthChainId] = useState<number>(null);
  const [ethChainIdValueValidated, setEthChainIdValueValidated] =
    useState<boolean>(false);

  const buttonEnabled =
    (rpcEndpointChainNodeValidated &&
      rpcEndpointChainNode &&
      rpcEndpointChainValueValidated &&
      balanceType !== BalanceType.Ethereum &&
      !ethChainIdValueValidated) ||
    (rpcName !== '' && bech32 !== '' && rpcEndpoint !== '');

  const setCommunityIdInput = (e) => {
    setRpcEndpointChainValue(e.target.value);
    if (e.target.value.length === 0) setRpcEndpointChainValueValidated(false);
  };

  const RPCEndpointValidationFn = (
    value: string,
  ): [ValidationStatus, string] | [] => {
    if (
      !detectURL(value) &&
      value.startsWith('wss://') === false &&
      value.startsWith('ws://') === false
    ) {
      setRpcEndpointChainNodeValidated(false);
      return ['failure', 'Not a valid URL'];
    }

    const nodeInfo = app.config.nodes.getByUrl(value);

    if (nodeInfo) {
      setRpcEndpointChainNode(nodeInfo);
      setRpcEndpointChainNodeValidated(true);
    } else {
      setChainNodeNotCreated(true);
    }

    return [];
  };

  const ethChainIdEndpointValidationFn = (
    value: string,
  ): [ValidationStatus, string] | [] => {
    if (value === '' || /^[1-9]\d*$/.test(value)) {
      return [];
    }

    setEthChainIdValueValidated(false);
    return ['failure', 'ETH chain id provided is not a number'];
  };

  const idValidationFn = (value: string): [ValidationStatus, string] | [] => {
    const communityInfo = app.config.chains.getById(value);
    if (!communityInfo) {
      setRpcEndpointChainValueValidated(false);
      return ['failure', 'Community not found'];
    }
    setRpcEndpointChain(communityInfo);
    setRpcEndpointChainValueValidated(true);
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
        });
        nodeId = res.data.result.node_id;
      }

      await rpcEndpointChain.updateChainData({
        chain_node_id: nodeId ?? rpcEndpointChainNode.id.toString(),
      });
      setRpcEndpointChainValue('');
      setRpcEndpoint('');
      setRpcEndpointChain(null);
      setRpcEndpointChainNode(null);
      setRpcEndpointChainNodeValidated(false);
      setBech32('');
      setRpcName('');
      notifySuccess('RPC Endpoint Updated');
    } catch (e) {
      notifyError('Error updating RPC Endpoint');
      console.error(e);
    }
  };

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Update RPC Endpoint',
      description: `Are you sure you want to update the rpc endpoint on ${rpcEndpointChainValue}?`,
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
      <CWText type="h4">Switch/Add RPC Endpoint</CWText>
      <CWText type="caption">
        Changes the RPC endpoint for a specific chain, or adds an endpoint if it
        doesn&apos;t yet exist.
      </CWText>
      <div className="MultiRow">
        <div className="TaskRow">
          <CWTextInput
            value={rpcEndpointChainValue}
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
            label="Update"
            className="TaskButton"
            disabled={!buttonEnabled}
            onClick={openConfirmationModal}
          />
        </div>
        {chainNodeNotCreated && (
          <div className="TaskRow">
            <CWTextInput
              label="name"
              value={rpcName}
              onInput={(e) => {
                setRpcName(e.target.value);
              }}
              placeholder="Enter chain node name (optional)"
            />
            <CWTextInput
              label="bech32"
              value={bech32}
              onInput={(e) => {
                setBech32(e.target.value);
              }}
              placeholder="Enter bech32 name"
            />
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

            {balanceType === BalanceType.Ethereum && (
              <CWTextInput
                value={ethChainId}
                onInput={(e) => {
                  setEthChainId(e.target.value);
                }}
                inputValidationFn={ethChainIdEndpointValidationFn}
                placeholder="Enter an ETH chain id"
                label="eth chain id"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RPCEndpointTask;
