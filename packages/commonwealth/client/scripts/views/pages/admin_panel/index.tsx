import React, { useEffect } from 'react';

import Sublayout from '../../Sublayout';
import { CWText } from '../../components/component_kit/cw_text';
import app from 'state';
import { useCommonNavigate } from 'navigation/helpers';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/cw_button';
import { openConfirmation } from '../../modals/confirmation_modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import axios from 'axios';
import 'pages/admin_panel.scss';
import { detectURL } from 'helpers/threads';
import NodeInfo from 'models/NodeInfo';
import ChainInfo from 'models/ChainInfo';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { BalanceType } from '../../../../../../common-common/src/types';
import { isAddress } from 'web3-utils';
import { createChainNode, deleteChain, updateSiteAdmin } from './utils';

// Allows admins to create/update RPC endpoints for chains
const RPCEndpointTask = () => {
  const [rpcEndpointChainValue, setRpcEndpointChainValue] =
    React.useState<string>('');
  const [rpcEndpointChain, setRpcEndpointChain] =
    React.useState<ChainInfo>(null);
  const [rpcEndpoint, setRpcEndpoint] = React.useState<string>('');
  const [rpcEndpointChainValueValidated, setRpcEndpointChainValueValidated] =
    React.useState<boolean>(false);
  const [rpcEndpointChainNode, setRpcEndpointChainNode] =
    React.useState<NodeInfo>(null);
  const [rpcEndpointChainNodeValidated, setRpcEndpointChainNodeValidated] =
    React.useState<boolean>(false);
  const [rpcName, setRpcName] = React.useState<string>('');
  const [bech32, setBech32] = React.useState<string>('');
  const [balanceType, setBalanceType] = React.useState<BalanceType>(
    BalanceType.Ethereum
  );
  const [chainNodeNotCreated, setChainNodeNotCreated] =
    React.useState<boolean>(false);

  const buttonEnabled =
    (rpcEndpointChainNodeValidated &&
      rpcEndpointChainNode &&
      rpcEndpointChainValueValidated) ||
    (rpcName !== '' && bech32 !== '' && rpcEndpoint !== '');
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
            onInput={(e) => {
              setRpcEndpointChainValue(e.target.value);
              if (e.target.value.length === 0)
                setRpcEndpointChainValueValidated(false);
            }}
            inputValidationFn={(value: string) => {
              const chainInfo = app.config.chains.getById(value);
              if (!chainInfo) {
                setRpcEndpointChainValueValidated(false);
                return ['failure', 'Community not found'];
              }
              setRpcEndpointChain(chainInfo);
              setRpcEndpointChainValueValidated(true);
              return [];
            }}
            placeholder="Enter a community id"
          />
          <CWTextInput
            label="RPC Endpoint"
            value={rpcEndpoint}
            onInput={(e) => {
              setRpcEndpoint(e.target.value);
            }}
            inputValidationFn={(value: string) => {
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
            }}
            placeholder="Enter an RPC endpoint"
          />
          <CWButton
            label="Update"
            className="TaskButton"
            disabled={!buttonEnabled}
            onClick={() => {
              openConfirmation({
                title: 'Update RPC Endpoint',
                description: `Are you sure you want to update the rpc endpoint on ${rpcEndpointChainValue}?`,
                buttons: [
                  {
                    label: 'Upodate',
                    buttonType: 'mini-black',
                    onClick: async () => {
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
                          chain_node_id:
                            nodeId ?? rpcEndpointChainNode.id.toString(),
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
                    },
                  },
                  {
                    label: 'Cancel',
                    buttonType: 'mini-white',
                  },
                ],
              });
            }}
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

const DeleteChainTask = () => {
  const [deleteChainValue, setDeleteChainValue] = React.useState<string>('');
  const [deleteChainValueValidated, setDeleteChainValueValidated] =
    React.useState<boolean>(false);

  return (
    <div className="TaskGroup">
      <CWText type="h4">Delete Community</CWText>
      <CWText type="caption">
        Removes a CW community (chain) from the DB. This is destructive action
        that cannot be reversed.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          label="Community Id"
          value={deleteChainValue}
          onInput={(e) => {
            setDeleteChainValue(e.target.value);
            if (e.target.value.length === 0)
              setDeleteChainValueValidated(false);
          }}
          inputValidationFn={(value: string) => {
            if (!app.config.chains.getById(value)) {
              setDeleteChainValueValidated(false);
              return ['failure', 'Community not found'];
            }
            setDeleteChainValueValidated(true);
            return [];
          }}
          placeholder="Enter a community id"
        />
        <CWButton
          label="Delete"
          className="TaskButton"
          disabled={!deleteChainValueValidated}
          onClick={() => {
            openConfirmation({
              title: 'Delete Community',
              description: `Are you sure you want to delete ${deleteChainValue}? This action cannot be reversed. Note that this will NOT work if there is an admin in the community.`,
              buttons: [
                {
                  label: 'Delete',
                  buttonType: 'mini-red',
                  onClick: async () => {
                    try {
                      await deleteChain({ id: deleteChainValue });
                      setDeleteChainValue('');
                      notifySuccess('Community deleted');
                    } catch (e) {
                      notifyError('Error deleting community');

                      console.error(e);
                    }
                  },
                },
                {
                  label: 'Cancel',
                  buttonType: 'mini-white',
                },
              ],
            });
          }}
        />
      </div>
    </div>
  );
};

const MakeSiteAdminTask = () => {
  const [address, setAddress] = React.useState<string>('');
  const [addressValidated, setAddressValidated] =
    React.useState<boolean>(false);

  return (
    <div className="TaskGroup">
      <CWText type="h4">Make Site Admin</CWText>
      <CWText type="caption">
        Makes a user (corresponding to a specified address) a site admin. Note
        that this is equivalent to "god mode"- Don't do this unless you know
        what you're doing.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          label="Address"
          value={address}
          onInput={(e) => {
            setAddress(e.target.value);
            if (e.target.value.length === 0) setAddressValidated(false);
          }}
          inputValidationFn={(value: string) => {
            if (!isAddress(value)) {
              setAddressValidated(false);
              return ['failure', 'Not an address'];
            }
            setAddressValidated(true);
            return [];
          }}
          placeholder="Enter an address to promote to site admin"
        />
        <CWButton
          label="Promote"
          className="TaskButton"
          disabled={!addressValidated}
          onClick={() => {
            openConfirmation({
              title: 'Promote to Site Admin',
              description: `Are you sure you want promote ${address} to god mode? The apotheosis of a user is not to be taken lightly.`,
              buttons: [
                {
                  label: 'promote',
                  buttonType: 'mini-black',
                  onClick: async () => {
                    try {
                      await updateSiteAdmin({
                        address: address,
                        siteAdmin: true,
                      });
                      setAddress('');
                      notifySuccess('Address promoted');
                    } catch (e) {
                      notifyError('Error promoting address');

                      console.error(e);
                    }
                  },
                },
                {
                  label: 'Cancel',
                  buttonType: 'mini-white',
                },
              ],
            });
          }}
        />
      </div>
    </div>
  );
};

const AdminPanelPage = () => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!app.user.isSiteAdmin) {
      // redirect to 404
      navigate('/404');
    }
  }, [navigate]);

  return (
    <Sublayout
    // title={title}
    >
      <div className="AdminPanel">
        <CWText type="h2">Site Admin Tasks</CWText>
        <DeleteChainTask />
        <RPCEndpointTask />
        <MakeSiteAdminTask />
      </div>
    </Sublayout>
  );
};

export default AdminPanelPage;
