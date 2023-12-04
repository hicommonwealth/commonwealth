import $ from 'jquery';
import React, { useEffect, useState } from 'react';

import { ChainBase, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { initAppState } from 'state';

import 'pages/create_community.scss';

import ChainInfo from 'client/scripts/models/ChainInfo';
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
  updateAdminOnCreateCommunity,
} from './community_input_rows';
import {
  useCommunityFormDefaultFields,
  useCommunityFormIdFields,
  useCommunityFormState,
} from './hooks';

export const StarterCommunityForm = () => {
  const [base, setBase] = useState<ChainBase>(ChainBase.Ethereum);
  const [defaultChain, setDefaultChain] = useState<ChainInfo>();

  const { id, setId, name, setName, symbol, setSymbol } =
    useCommunityFormIdFields();

  const communityFormDefaultFields = useCommunityFormDefaultFields();

  const { saving, setSaving } = useCommunityFormState();

  const navigate = useCommonNavigate();

  useEffect(() => {
    const selectChainForBase = () => {
      if (base === ChainBase.CosmosSDK) {
        const chain = app.config.chains?.getById('osmosis');
        setDefaultChain(chain);
      } else if (base === ChainBase.Ethereum) {
        const ethereum = app.config.chains?.getById('ethereum');
        setDefaultChain(ethereum);
      } else if (base === ChainBase.NEAR) {
        const near = app.config.chains?.getById('near');
        setDefaultChain(near);
      } else {
        setDefaultChain(null);
      }
    };

    selectChainForBase();
  }, [base]);

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
          additionalArgs.node_url = defaultChain.node.url;
          additionalArgs.alt_wallet_url = defaultChain.node.altWalletUrl;
          additionalArgs.eth_chain_id = defaultChain.node.ethChainId;
          additionalArgs.bech32_prefix = defaultChain.bech32Prefix;

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
              ...additionalArgs,
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
            console.log(err);

            notifyError(
              err.responseJSON?.error ||
                'Creating new starter community failed',
            );
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
};
