import NodeInfo from 'models/NodeInfo';
import ChainInfo from 'models/ChainInfo';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { detectURL } from 'helpers/threads';
import React, { useState } from 'react';
import app from 'state';
import { BalanceType } from '../../../../../../common-common/src/types';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { openConfirmation } from '../../modals/confirmation_modal';
import { createChainNode } from './utils';
import 'pages/AdminPanel.scss';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';

const RPCEndpointTask = () => {
  const [rpcEndpointChainValue, setRpcEndpointChainValue] =
    useState<string>('');
  const [rpcEndpointChain, setRpcEndpointChain] = useState<ChainInfo>(null);
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
    BalanceType.Ethereum
  );
  const [chainNodeNotCreated, setChainNodeNotCreated] =
    useState<boolean>(false);

  const buttonEnabled =
    (rpcEndpointChainNodeValidated &&
      rpcEndpointChainNode &&
      rpcEndpointChainValueValidated) ||
    (rpcName !== '' && bech32 !== '' && rpcEndpoint !== '');

  const setCommunityIdInput = (e) => {
    setRpcEndpointChainValue(e.target.value);
    if (e.target.value.length === 0) setRpcEndpointChainValueValidated(false);
  };

  const RPCEndpointValidationFn = (
    value: string
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

  const idValidationFn = (value: string): [ValidationStatus, string] | [] => {
    const chainInfo = app.config.chains.getById(value);
    if (!chainInfo) {
      setRpcEndpointChainValueValidated(false);
      return ['failure', 'Community not found'];
    }
    setRpcEndpointChain(chainInfo);
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
          buttonType: 'mini-black',
          onClick: update,
        },
        {
          label: 'Cancel',
          buttonType: 'mini-white',
        },
      ],
    });
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Switch/Add RPC Endpoint</CWText>
      <CWText type="caption">
        Changes the RPC endpoint for a specific chain, or adds an endpoint if it
        doesn't yet exist.
      </CWText>
      <div className="MultiRow">
        <div className="TaskRow">
          <CWTextInput
            label="Community Id"
            value={rpcEndpointChainValue}
            onInput={setCommunityIdInput}
            inputValidationFn={idValidationFn}
            placeholder="Enter a community id"
          />
          <CWTextInput
            label="RPC Endpoint"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default RPCEndpointTask;
