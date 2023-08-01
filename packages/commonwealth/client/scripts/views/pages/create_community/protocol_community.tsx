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
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import { CWRadioButton } from '../../components/component_kit/cw_radio_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { setupCommunityContracts } from 'controllers/chain/ethereum/callContractFunction';

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

const membershipOptions = [
  {
    label: 'Anyone with an address',
    value: 'all',
  },
  {
    label: 'Holders of NFT',
    value: 'nft',
  },
  {
    label: 'Holders of ERC20',
    value: 'erc20',
  },
  {
    label: 'Custom Gate',
    value: 'custom',
  },
];

const seedOptions = [
  {
    label: 'Send From wallet',
    value: 'wallet',
  },
  {
    label: 'Send from multi-sig',
    value: 'multi',
  },
  {
    label: 'Create transfer proposal',
    value: 'proposal',
  },
];

export const ProtocolCommunityForm = () => {
  const [base, setBase] = useState<ChainBase>(ChainBase.Ethereum);
  const [loading, setLoading] = useState<boolean>(false);
  //Pass to tx Function
  const [gate, setGate] = useState<string>(
    '0x0000000000000000000000000000000000000000'
  );
  //Pass to tx function
  const [gateType, setGateType] = useState<string>('all');
  //Pass to tx function
  const [gateMeta, setGateMeta] = useState<any>({
    token: '',
    amount: 0,
    type: '',
  });
  const [selectedRadio, setSelectedRadio] = useState<string>('wallet');
  const [checked, setChecked] = useState<boolean>(true);
  //Pass to tx function
  const [seedWalletMeta, setSeedWalletMeta] = useState<any>({
    type: 'wallet',
    amount: 0,
    address: '',
  });

  const { id, setId, name, setName, symbol, setSymbol } =
    useChainFormIdFields();

  const chainFormDefaultFields = useChainFormDefaultFields();

  const { saving, setSaving } = useChainFormState();

  const navigate = useCommonNavigate();

  const onGateChange = (v) => {
    setGateType(v.value);
  };

  const getGateForm = (type) => {
    switch (type) {
      case 'nft':
        return (
          <>
            <InputRow
              title="NFT Token Address"
              value={gateMeta.token}
              onChangeHandler={(v) => {
                setGateMeta({
                  token: v,
                  amount: gateMeta.amount,
                  type: 'nft',
                });
              }}
            />
            <InputRow
              title="NFT Id(optional)"
              value={gateMeta.amount}
              onChangeHandler={(v) => {
                setGateMeta({
                  token: gateMeta.token,
                  amount: v,
                  type: 'nft',
                });
              }}
            />
          </>
        );
      case 'custom':
        return (
          <InputRow
            title="Custom Gate Address"
            value={gate}
            onChangeHandler={(v) => {
              setGate(v);
            }}
          />
        );
      case 'erc20':
        return (
          <>
            <InputRow
              title="ERC20 Token Address"
              value={gateMeta.token}
              onChangeHandler={(v) => {
                setGateMeta({
                  token: v,
                  amount: gateMeta.amount,
                  type: 'erc',
                });
              }}
            />
            <InputRow
              title="Amount(optional)"
              value={gateMeta.amount}
              onChangeHandler={(v) => {
                setGateMeta({
                  token: gateMeta.token,
                  amount: v,
                  type: 'erc',
                });
              }}
            />
          </>
        );
    }
  };

  const seedWalletForm = () => {
    const radioGroup = seedOptions.map((option) => (
      <CWRadioButton
        key={option.value}
        checked={option.value === selectedRadio}
        onChange={() => setSelectedRadio(option.value)}
        label={option.label}
        value={option.value}
      />
    ));
    return (
      <>
        {radioGroup}
        {selectedRadio === 'wallet' && (
          <InputRow
            title="Amount of ETH"
            onChangeHandler={(e) =>
              setSeedWalletMeta({ type: 'wallet', amount: e })
            }
            value={seedWalletMeta.amount}
          />
        )}
        {selectedRadio === 'multi' && (
          <>
            <InputRow
              title="Multi-sig Wallet Address"
              onChangeHandler={(e) =>
                setSeedWalletMeta({
                  type: 'multi',
                  amount: seedWalletMeta['amount'],
                  address: e,
                })
              }
              value={seedWalletMeta.address}
            />
            <InputRow
              title="Amount of ETH"
              onChangeHandler={(e) =>
                setSeedWalletMeta({
                  type: 'multi',
                  amount: e,
                  address: seedWalletMeta['address'],
                })
              }
              value={seedWalletMeta.amount}
            />
          </>
        )}
        {selectedRadio === 'proposal' && (
          <>
            <InputRow
              title="Governance Contract"
              onChangeHandler={(e) =>
                setSeedWalletMeta({
                  type: 'multi',
                  amount: seedWalletMeta['amount'],
                  address: e,
                })
              }
              value={seedWalletMeta.address}
            />
            <InputRow
              title="Amount of ETH"
              onChangeHandler={(e) =>
                setSeedWalletMeta({
                  type: 'multi',
                  amount: e,
                  address: seedWalletMeta['address'],
                })
              }
              value={seedWalletMeta.amount}
            />
          </>
        )}
      </>
    );
  };

  return loading ? (
    <div className="spinner-group">
      <CWSpinner />
      <CWText>Deploying Namespace</CWText>
    </div>
  ) : (
    <div className="CreateCommunityForm">
      <CWText type="h2" fontWeight="bold">
        1. General Info
      </CWText>
      <CWDivider />
      <CWText type="caption">
        Set a name, description, socials and upload an image
      </CWText>
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
      <CWText type="h2" fontWeight="bold">
        2. Base Membership
      </CWText>
      <CWDivider />
      <CWText type="caption">
        Gate access using NFT ownership, ERC20 holders, or anyone on-chain
      </CWText>
      <CWDropdown
        label="Base Chain"
        options={[{ label: 'ethereum', value: 'ethereum' }]}
        onSelect={(o) => {
          setBase(o.value as ChainBase);
        }}
      />
      <CWDropdown
        label="Membership Access Options"
        options={membershipOptions}
        onSelect={(v) => onGateChange(v)}
        initialValue={membershipOptions[0]}
      />
      {gateType !== 'all' && getGateForm(gateType)}
      <CWText type="h2" fontWeight="bold">
        3. Seed Your Community Wallet
      </CWText>
      <CWDivider />
      <CWText type="caption">
        Choose to link an existing Gnosis Safe/Multi-Sig, create a funding
        proposal, or send from your wallet.
      </CWText>
      <CWToggle
        checked={checked}
        onChange={() => {
          setChecked(!checked);
        }}
      />
      {checked && seedWalletForm()}
      <CWText type="h2" fontWeight="bold">
        4. Socials and Additional Info
      </CWText>
      <CWDivider />
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
            setLoading(true);
            await setupCommunityContracts({
              name,
              gate,
              gateMeta,
              seedWalletMeta,
            });

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
