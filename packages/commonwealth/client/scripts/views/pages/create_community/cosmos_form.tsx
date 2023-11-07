import $ from 'jquery';
import React, { useState } from 'react';

import 'pages/create_community.scss';

import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { useCommonNavigate } from 'navigation/helpers';
import app, { initAppState } from 'state';
import { slugifyPreserveDashes } from 'utils';
import { CWButton } from '../../components/component_kit/cw_button';
import {
  CWValidationText,
  ValidationStatus,
} from '../../components/component_kit/cw_validation_text';
import { IdRow, InputRow } from '../../components/metadata_rows';
import {
  defaultCommunityRows,
  updateAdminOnCreateCommunity,
} from './community_input_rows';
import {
  useCommunityFormDefaultFields,
  useCommunityFormIdFields,
  useCommunityFormState,
  useEthCommunityFormFields,
} from './hooks';

export const CosmosForm = () => {
  const [bech32Prefix, setBech32Prefix] = useState('');
  const [decimals, setDecimals] = useState(6); // can be 6 or 18

  const {
    id,
    setId,
    name,
    setName,
    communityName,
    setCommunityName,
    symbol,
    setSymbol,
  } = useCommunityFormIdFields();

  const communityFormDefaultFields = useCommunityFormDefaultFields();

  const { message, saving, setMessage, setSaving } = useCommunityFormState();

  const { altWalletUrl, chainName, ethChainId, nodeUrl, setNodeUrl } =
    useEthCommunityFormFields();

  const navigate = useCommonNavigate();

  const communityNameValidationFn = (
    value: string,
  ): [ValidationStatus, string] | [] => {
    const validCommunityNameRegex = /^[a-z0-9]+$/;

    if (!validCommunityNameRegex.test(value)) {
      return [
        'failure',
        'Must be lowercase, alphanumeric, and equal to Cosmos Chain Registry entry',
      ];
    } else {
      return [];
    }
  };

  return (
    <div className="CreateCommunityForm">
      <InputRow
        title="RPC URL"
        value={nodeUrl}
        placeholder="http://my-rpc.cosmos-chain.com:26657/"
        onChangeHandler={async (v) => {
          setNodeUrl(v);
        }}
      />
      <InputRow
        title="Name"
        value={name}
        onChangeHandler={(v) => {
          setName(v);
          setId(slugifyPreserveDashes(v));
        }}
      />
      <IdRow id={id} />
      <InputRow
        title="Registered Cosmos Community Name"
        value={communityName}
        placeholder={name.toLowerCase()}
        onChangeHandler={(v) => {
          setCommunityName(v);
        }}
        inputValidationFn={communityNameValidationFn}
      />
      <InputRow
        title="Symbol"
        value={symbol}
        placeholder="XYZ"
        onChangeHandler={(v) => {
          setSymbol(v);
        }}
      />
      <InputRow
        title="Bech32 Prefix"
        value={bech32Prefix}
        placeholder="cosmos"
        onChangeHandler={async (v) => {
          setBech32Prefix(v.toLowerCase());
        }}
      />
      <InputRow
        title="Decimals"
        value={`${decimals}`}
        onChangeHandler={(v) => {
          setDecimals(+v);
        }}
      />
      {defaultCommunityRows(communityFormDefaultFields)}
      <CWButton
        label="Save changes"
        disabled={saving}
        onClick={async () => {
          setSaving(true);

          try {
            const res = await $.post(`${app.serverUrl()}/communities`, {
              alt_wallet_url: altWalletUrl,
              id: id,
              name: name,
              cosmos_chain_id: communityName,
              base: ChainBase.CosmosSDK,
              bech32_prefix: bech32Prefix,
              chain_string: chainName,
              eth_chain_id: ethChainId,
              jwt: app.user.jwt,
              network: id,
              node_url: nodeUrl,
              icon_url: communityFormDefaultFields.iconUrl,
              type: ChainType.Chain,
              default_symbol: symbol,
              // ...form, <-- not typed so I don't know what's needed
            });

            if (res.result.admin_address) {
              await linkExistingAddressToChainOrCommunity(
                res.result.admin_address,
                res.result.role.chain_id,
                res.result.role.chain_id,
              );
            }

            await initAppState(false);
            await updateAdminOnCreateCommunity(id);

            navigate(`/${res.result.community?.id}`);
          } catch (err) {
            setMessage(
              err.responseJSON?.error || 'Creating new Cosmos community failed',
            );
          } finally {
            setSaving(false);
          }
        }}
      />
      {message && <CWValidationText message={message} status="failure" />}
    </div>
  );
};
