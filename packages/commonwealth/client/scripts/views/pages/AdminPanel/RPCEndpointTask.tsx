import { BalanceType } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { detectURL } from 'helpers/threads';
import NodeInfo from 'models/NodeInfo';
import React, { useState } from 'react';
import { getNodeByUrl } from 'state/api/nodes/utils';
import useFetchNodesQuery from '../../../state/api/nodes/fetchNodes';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput as CWTextInputOld } from '../../components/component_kit/cw_text_input';
import {
  CWValidationText,
  ValidationStatus,
} from '../../components/component_kit/cw_validation_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from '../../modals/confirmation_modal';
import './AdminPanel.scss';
import { createChainNode } from './utils';

const RPCEndpointTask = () => {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [rpcEndpoint, setRpcEndpoint] = useState<string>('');
  // @ts-expect-error <StrictNullChecks/>
  const [communityChainNode, setCommunityChainNode] = useState<NodeInfo>(null);
  const [communityChainNodeValidated, setCommunityChainNodeValidated] =
    useState<boolean>(false);
  const [rpcName, setRpcName] = useState<string>('');
  const [balanceType, setBalanceType] = useState<BalanceType>(
    BalanceType.Ethereum,
  );
  // @ts-expect-error <StrictNullChecks/>
  const [ethChainId, setEthChainId] = useState<number>(null);

  const [ethChainIdValueValidated, setEthChainIdValueValidated] =
    useState<boolean>(false);

  const { data: nodes } = useFetchNodesQuery();

  const buttonEnabled =
    (communityChainNodeValidated &&
      communityChainNode &&
      balanceType !== BalanceType.Ethereum &&
      !ethChainIdValueValidated) ||
    (rpcName !== '' &&
      balanceType === BalanceType.Ethereum &&
      rpcEndpoint !== '');

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
    }
    return [];
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
    try {
      await createChainNode({
        url: rpcEndpoint,
        name: rpcName,
        balance_type: balanceType,
        eth_chain_id: ethChainId,
      });

      setRpcEndpoint('');
      // @ts-expect-error <StrictNullChecks/>
      setCommunityChainNode(null);
      setCommunityChainNodeValidated(false);
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
      description: `Are you sure you want to create this rpc endpoint?`,
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
      <CWText type="h4">Add RPC Endpoint/Create Chain Node</CWText>
      <CWText type="caption">
        Adds a Chain Node for a specific chain community
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
            <CWTextInputOld
              value={rpcEndpoint}
              onInput={(e) => {
                setRpcEndpoint(e.target.value.trim());
              }}
              inputValidationFn={RPCEndpointValidationFn}
              placeholder="Enter an RPC endpoint (Required)"
            />
            <CWButton
              label="Create"
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
                  setRpcName(e.target.value.trim());
                }}
                placeholder="Enter chain node name (Required)"
              />
            )}
          </div>
          {balanceType === BalanceType.Ethereum ? (
            <div className="TaskRow">
              <CWTextInput
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
