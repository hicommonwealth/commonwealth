import React, { useState } from 'react';
import $ from 'jquery';

import 'pages/create_community.scss';

import { initAppState } from 'state';
import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import app from 'state';
import { slugifyPreserveDashes } from 'utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { IdRow, InputRow } from '../../components/metadata_rows';
import { defaultChainRows, updateAdminRole } from './chain_input_rows';
import { useCommonNavigate } from 'navigation/helpers';
import {
  useChainFormIdFields,
  useChainFormDefaultFields,
  useChainFormState,
  useEthChainFormFields,
} from './hooks';

export const CosmosForm = () => {
  const [bech32Prefix, setBech32Prefix] = useState('');
  const [decimals, setDecimals] = useState(6);

  const { id, setId, name, setName, symbol, setSymbol } =
    useChainFormIdFields();

  const chainFormDefaultFields = useChainFormDefaultFields();

  const { message, saving, setMessage, setSaving } = useChainFormState();

  const { altWalletUrl, chainString, ethChainId, nodeUrl, setNodeUrl } =
    useEthChainFormFields();

  const navigate = useCommonNavigate();

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
          setBech32Prefix(v);
        }}
      />
      <InputRow
        title="Decimals"
        value={`${decimals}`}
        disabled={true}
        onChangeHandler={(v) => {
          setDecimals(+v);
        }}
      />
      {defaultChainRows(chainFormDefaultFields)}
      <CWButton
        label="Save changes"
        disabled={saving}
        onClick={async () => {
          setSaving(true);

          try {
            const res = await $.post(`${app.serverUrl()}/createChain`, {
              alt_wallet_url: altWalletUrl,
              id: id,
              name: name,
              base: ChainBase.CosmosSDK,
              bech32_prefix: bech32Prefix,
              chain_string: chainString,
              eth_chain_id: ethChainId,
              jwt: app.user.jwt,
              network: id,
              node_url: nodeUrl,
              icon_url: chainFormDefaultFields.iconUrl,
              type: ChainType.Chain,
              default_symbol: symbol,
              // ...form, <-- not typed so I don't know what's needed
            });

            if (res.result.admin_address) {
              await linkExistingAddressToChainOrCommunity(
                res.result.admin_address,
                res.result.role.chain_id,
                res.result.role.chain_id
              );
            }

            await updateAdminRole(id);

            navigate(`/${res.result.chain?.id}`);
          } catch (err) {
            setMessage(
              err.responseJSON?.error || 'Creating new Cosmos community failed'
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
