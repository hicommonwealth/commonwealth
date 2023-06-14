import React, { useState } from 'react';
import type * as solanaWeb3 from '@solana/web3.js';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { initAppState } from 'state';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { slugifyPreserveDashes } from 'utils';
import { IdRow, InputRow } from 'views/components/metadata_rows';
import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { defaultChainRows } from './chain_input_rows';
import { useCommonNavigate } from 'navigation/helpers';
import {
  useChainFormIdFields,
  useChainFormDefaultFields,
  useChainFormState,
} from './hooks';

export const SplTokenForm = () => {
  const [cluster, setCluster] = useState<solanaWeb3.Cluster>('mainnet-beta');
  const [decimals, setDecimals] = useState(6);
  const [mint, setMint] = useState('');

  const { id, setId, name, setName, symbol, setSymbol } =
    useChainFormIdFields();

  const chainFormDefaultFields = useChainFormDefaultFields();

  const chainFormState = useChainFormState();

  const navigate = useCommonNavigate();

  const disableField = !chainFormState.loaded;

  const updateTokenForum = async () => {
    status = undefined;
    chainFormState.setMessage('');

    let mintPubKey: solanaWeb3.PublicKey;

    const solw3 = await import('@solana/web3.js');

    try {
      mintPubKey = new solw3.PublicKey(mint);
    } catch (e) {
      chainFormState.setStatus('failure');
      chainFormState.setMessage('Invalid mint address');
      return false;
    }

    if (!mintPubKey) return;

    chainFormState.setLoading(true);

    try {
      const url = solw3.clusterApiUrl(cluster);
      const connection = new solw3.Connection(url);
      const supply = await connection.getTokenSupply(mintPubKey);

      const { decimals: supplyDecimals, amount } = supply.value;

      setDecimals(supplyDecimals);
      chainFormState.setLoaded(true);
      chainFormState.setStatus('success');
      chainFormState.setMessage(`Found ${amount} supply!`);
    } catch (err) {
      chainFormState.setStatus('failure');
      chainFormState.setMessage(
        `Error: ${err.message}` || 'Failed to load token'
      );
    }

    chainFormState.setLoading(false);
  };

  return (
    <div className="CreateCommunityForm">
      <CWDropdown
        label="Cluster"
        options={[
          { label: 'mainnet-beta', value: 'mainnet-beta' },
          { label: 'testnet', value: 'testnet' },
          { label: 'devnet', value: 'devnet' },
        ]}
        onSelect={(o) => {
          setCluster(o.value as solanaWeb3.Cluster);
          chainFormState.setLoaded(false);
        }}
      />
      <InputRow
        title="Mint Address"
        value={mint}
        placeholder="2sgDUTgTP6e9CrJtexGdba7qZZajVVHf9TiaCtS9Hp3P"
        onChangeHandler={(v) => {
          setMint(v.trim());
          chainFormState.setLoaded(false);
        }}
      />
      <CWButton
        label="Check address"
        disabled={chainFormState.saving || !chainFormState.loaded}
        onClick={async () => {
          await updateTokenForum();
        }}
      />
      {chainFormState.message && (
        <CWValidationText
          message={chainFormState.message}
          status={chainFormState.status}
        />
      )}
      <InputRow
        title="Name"
        value={name}
        disabled={disableField}
        onChangeHandler={(v) => {
          setName(v);
          setId(slugifyPreserveDashes(v));
        }}
      />
      <IdRow id={id} />
      <InputRow
        title="Symbol"
        disabled={disableField}
        value={symbol}
        placeholder="XYZ"
        onChangeHandler={(v) => {
          setSymbol(v);
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
      {defaultChainRows(chainFormDefaultFields, disableField)}
      <CWButton
        label="Save changes"
        disabled={chainFormState.saving || !chainFormState.loaded}
        onClick={async () => {
          chainFormState.setSaving(true);

          try {
            const res = await $.post(`${app.serverUrl()}/createChain`, {
              id: id,
              name: name,
              address: mint,
              base: ChainBase.Solana,
              icon_url: chainFormDefaultFields.iconUrl,
              jwt: app.user.jwt,
              network: ChainNetwork.SPL,
              node_url: cluster,
              type: ChainType.Token,
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
            await initAppState(false);
            navigate(`/${res.result.chain?.id}`);
          } catch (err) {
            notifyError(
              err.responseJSON?.error || 'Creating new SPL community failed'
            );
          } finally {
            chainFormState.setSaving(false);
          }
        }}
      />
    </div>
  );
};
