import React, { useState } from 'react';
import $ from 'jquery';

import { initAppState } from 'state';
import { ChainBase, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';

import 'pages/create_community.scss';

import app from 'state';
import { slugifyPreserveDashes } from 'utils';
import { IdRow, InputRow } from 'views/components/metadata_rows';
import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { baseToNetwork } from '../../../helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { defaultChainRows } from './chain_input_rows';
import { useCommonNavigate } from 'navigation/helpers';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import {
  useChainFormDefaultFields,
  useChainFormIdFields,
  useChainFormState,
} from './hooks';
import WebWalletController from 'controllers/app/web_wallets';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { CWText } from '../../components/component_kit/cw_text';
const abi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'getNamespace',
    outputs: [
      {
        internalType: 'contract INamespace',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'contract IGate',
        name: 'gate',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'name',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'gateImpl',
        type: 'address',
      },
    ],
    name: 'createNamespace',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
export const ProtocolCommunityForm = () => {
  const [base, setBase] = useState<ChainBase>(ChainBase.Ethereum);
  const [loading, setLoading] = useState<boolean>(false);
  const [gate, setGate] = useState<string>('');

  const { id, setId, name, setName, symbol, setSymbol } =
    useChainFormIdFields();

  const chainFormDefaultFields = useChainFormDefaultFields();

  const { saving, setSaving } = useChainFormState();

  const navigate = useCommonNavigate();

  return loading ? (
    <div className="spinner-group">
      <CWSpinner />
      <CWText>Deploying Namespace</CWText>
    </div>
  ) : (
    <div className="CreateCommunityForm">
      <InputRow
        title="Name"
        placeholder="Enter the name of your community"
        value={name}
        onChangeHandler={(v) => {
          setName(v);
          setId(slugifyPreserveDashes(v));
        }}
      />
      <IdRow id={id} />
      <InputRow
        title="Symbol"
        value={symbol}
        onChangeHandler={(v) => {
          setSymbol(v);
        }}
      />
      <CWDropdown
        label="Base Chain"
        options={[{ label: 'ethereum', value: 'ethereum' }]}
        onSelect={(o) => {
          setBase(o.value as ChainBase);
        }}
      />
      <InputRow
        title="Gate Address(Optional)"
        value={gate}
        onChangeHandler={(v) => {
          setGate(v);
        }}
      />
      {defaultChainRows(chainFormDefaultFields)}
      <CWButton
        label="Save changes"
        disabled={saving || id.length < 1}
        onClick={async () => {
          setSaving(true);

          const additionalArgs: {
            eth_chain_id?: number;
            node_url?: string;
            bech32_prefix?: string;
            alt_wallet_url?: string;
          } = {};

          switch (base) {
            //TODO: Goerli vars
            case ChainBase.Ethereum:
            default: {
              additionalArgs.eth_chain_id = 5;
              additionalArgs.node_url =
                'https://eth-goerli.g.alchemy.com/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y';
              additionalArgs.alt_wallet_url =
                'https://eth-goerli.g.alchemy.com/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y';
              break;
            }
          }

          try {
            // get querying wallet
            const signingWallet = WebWalletController.Instance.availableWallets(
              ChainBase.Ethereum
            )[0];
            await signingWallet.enable('5');
            if (!signingWallet.api) {
              throw new Error('Web3 Api Not Initialized');
            }
            const web3: Web3 = signingWallet.api;

            const factory = new web3.eth.Contract(
              abi as AbiItem[],
              '0x689Ce208E0f72447D7B23C479756374ACe977913'
            );

            //check that namespace doesnt exist
            const namespace = await factory.methods
              .getNamespace(web3.utils.asciiToHex(name))
              .call();
            if (
              namespace['token'] &&
              namespace['token'] !==
                '0x0000000000000000000000000000000000000000'
            ) {
              throw new Error('Name already used, try another name');
            }

            setLoading(true);
            const txReceipt = await factory.methods
              .createNamespace(
                web3.utils.asciiToHex(name),
                '0x0000000000000000000000000000000000000000'
              )
              .send({ from: signingWallet.accounts[0] });
            if (!txReceipt) {
              setLoading(false);
              throw new Error('Transaction failed');
            }

            const res = await $.post(`${app.serverUrl()}/createChain`, {
              jwt: app.user.jwt,
              address: '',
              type: ChainType.Offchain,
              network: baseToNetwork(base),
              icon_url: chainFormDefaultFields.iconUrl,
              id,
              name,
              default_symbol: symbol,
              base,
              description: chainFormDefaultFields.description,
              discord: chainFormDefaultFields.discord,
              element: chainFormDefaultFields.element,
              github: chainFormDefaultFields.github,
              telegram: chainFormDefaultFields.telegram,
              website: chainFormDefaultFields.website,
              ...additionalArgs,
            });

            if (res.result.admin_address) {
              await linkExistingAddressToChainOrCommunity(
                res.result.admin_address,
                res.result.role.chain_id,
                res.result.role.chain_id
              );
            }

            await initAppState(false);

            navigate(`/${res.result.chain?.id}`);
          } catch (err) {
            console.log(err);
            setLoading(false);
            notifyError(
              err.responseJSON?.error || 'Creating new starter community failed'
            );
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
};
