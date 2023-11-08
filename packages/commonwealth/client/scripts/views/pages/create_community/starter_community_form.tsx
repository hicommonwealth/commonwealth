import $ from 'jquery';
import React, { useState } from 'react';

import { ChainBase, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { initAppState } from 'state';

import 'pages/create_community.scss';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { slugifyPreserveDashes } from 'utils';
import { IdRow, InputRow } from 'views/components/metadata_rows';
import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { baseToNetwork } from '../../../helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import {
  defaultCommunityRows,
  updateAdminOnCreateCommunity
} from './community_input_rows';
import {
  useCommunityFormDefaultFields,
  useCommunityFormIdFields,
  useCommunityFormState
} from './hooks';

export const StarterCommunityForm = () => {
  const [base, setBase] = useState<ChainBase>(ChainBase.Ethereum);

  const { id, setId, name, setName, symbol, setSymbol } =
    useCommunityFormIdFields();

  const communityFormDefaultFields = useCommunityFormDefaultFields();

  const { saving, setSaving } = useCommunityFormState();

  const navigate = useCommonNavigate();

  return (
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
        options={[
          { label: 'cosmos', value: 'cosmos' },
          { label: 'ethereum', value: 'ethereum' },
          { label: 'near', value: 'near' }
        ]}
        initialValue={{ label: 'ethereum', value: 'ethereum' }}
        onSelect={(o) => {
          setBase(o.value as ChainBase);
        }}
      />
      {defaultCommunityRows(communityFormDefaultFields)}
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

          // TODO: switch to using ChainNode.name instead of URL
          // defaults to be overridden when chain is no longer "starter" type
          switch (base) {
            case ChainBase.CosmosSDK: {
              additionalArgs.node_url = 'https://rpc-osmosis.blockapsis.com';
              additionalArgs.bech32_prefix = 'osmo';
              additionalArgs.alt_wallet_url =
                'https://lcd-osmosis.blockapsis.com';
              break;
            }

            case ChainBase.NEAR: {
              additionalArgs.node_url = 'https://rpc.mainnet.near.org';
              break;
            }

            case ChainBase.Solana: {
              additionalArgs.node_url = 'https://api.mainnet-beta.solana.com';
              break;
            }

            case ChainBase.Substrate: {
              additionalArgs.node_url = 'wss://mainnet.edgewa.re';
              break;
            }

            case ChainBase.Ethereum:
            default: {
              additionalArgs.eth_chain_id = 1;
              additionalArgs.node_url =
                'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_';
              additionalArgs.alt_wallet_url =
                'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_';
              break;
            }
          }

          try {
            const res = await $.post(`${app.serverUrl()}/communities`, {
              jwt: app.user.jwt,
              address: '',
              type: ChainType.Offchain,
              network: baseToNetwork(base),
              icon_url: communityFormDefaultFields.iconUrl,
              id,
              name,
              default_symbol: symbol,
              base,
              description: communityFormDefaultFields.description,
              discord: communityFormDefaultFields.discord,
              element: communityFormDefaultFields.element,
              github: communityFormDefaultFields.github,
              telegram: communityFormDefaultFields.telegram,
              website: communityFormDefaultFields.website,
              ...additionalArgs
            });

            if (res.result.admin_address) {
              await linkExistingAddressToChainOrCommunity(
                res.result.admin_address,
                res.result.role.chain_id,
                res.result.role.chain_id
              );
            }

            await initAppState(false);
            await updateAdminOnCreateCommunity(id);

            navigate(`/${res.result.community?.id}`);
          } catch (err) {
            console.log(err);

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
