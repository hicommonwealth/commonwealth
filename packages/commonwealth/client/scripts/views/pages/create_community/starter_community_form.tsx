import React, { useState } from 'react';
import $ from 'jquery';

// import { MixpanelCommunityCreationEvent } from 'analytics/types';
// import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
// import { CommunityType } from '.';

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
import {
  useChainFormDefaultFields,
  useChainFormIdFields,
  useChainFormState,
} from './hooks';

export const StarterCommunityForm = () => {
  const [base, setBase] = useState<ChainBase>(ChainBase.Ethereum);

  const { id, setId, name, setName, symbol, setSymbol } =
    useChainFormIdFields();

  const chainFormDefaultFields = useChainFormDefaultFields();

  const { saving, setSaving } = useChainFormState();

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
          { label: 'near', value: 'near' },
        ]}
        onSelect={(o) => {
          setBase(o.value as ChainBase);

          // mixpanelBrowserTrack({
          //   event: MixpanelCommunityCreationEvent.CHAIN_SELECTED,
          //   chainBase: o.value,
          //   isCustomDomain: app.isCustomDomain(),
          //   communityType: CommunityType.StarterCommunity,
          // });
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

          // mixpanelBrowserTrack({
          //   event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
          //   chainBase: base,
          //   isCustomDomain: app.isCustomDomain(),
          //   communityType: CommunityType.StarterCommunity,
          // });

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
                'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_';
              additionalArgs.alt_wallet_url =
                'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_';
              break;
            }
          }

          try {
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
