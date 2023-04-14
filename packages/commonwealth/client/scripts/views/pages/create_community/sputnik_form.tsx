import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
// import type { ConnectConfig } from 'near-api-js';
// import { connect as nearConnect, keyStores } from 'near-api-js';
// import type { CodeResult } from 'near-api-js/lib/providers/provider';
import $ from 'jquery';
import { useCommonNavigate } from 'navigation/helpers';

// import { MixpanelCommunityCreationEvent } from 'analytics/types';
// import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import 'pages/create_community.scss';
import React, { useState } from 'react';

import app, { initAppState } from 'state';
import { InputRow, ToggleRow } from 'views/components/metadata_rows';
// import { CommunityType } from '.';
import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { CWButton } from '../../components/component_kit/cw_button';
import { defaultChainRows } from './chain_input_rows';
import { useChainFormDefaultFields, useChainFormIdFields, useChainFormState, } from './hooks';

export const SputnikForm = () => {
  const [isMainnet, setIsMainnet] = useState(true);

  const { name, setName } = useChainFormIdFields();

  const chainFormDefaultFields = useChainFormDefaultFields();

  const { saving, setSaving } = useChainFormState();

  const navigate = useCommonNavigate();

  return (
    <div className="CreateCommunityForm">
      <InputRow
        title="DAO Name"
        value={name}
        onChangeHandler={(v) => {
          setName(v.toLowerCase());
        }}
        placeholder="genesis"
      />
      <ToggleRow
        title="Network"
        defaultValue={isMainnet}
        onToggle={(checked) => {
          setIsMainnet(checked);

          // mixpanelBrowserTrack({
          //   event: MixpanelCommunityCreationEvent.CHAIN_SELECTED,
          //   chainBase: ChainBase.CosmosSDK,
          //   isCustomDomain: app.isCustomDomain(),
          //   communityType: CommunityType.SputnikDao,
          // });
        }}
        caption={(checked) => {
          if (checked !== isMainnet) {
            return 'Unknown network!';
          }
          return checked ? 'Mainnet' : 'Testnet';
        }}
      />
      {/* TODO: add divider to distinguish on-chain data */}
      {defaultChainRows(chainFormDefaultFields)}
      <CWButton
        label="Save changes"
        disabled={saving}
        onClick={async () => {
          setSaving(true);

          // slice name if has sputnik-dao or sputnikv2 appened or keep name if otherwise
          const daoName = name.includes('sputnik-dao')
            ? name.slice(0, name.indexOf('sputnik-dao') - 1)
            : name.includes('sputnikv2')
            ? name.slice(0, name.indexOf('sputnikv2') - 1)
            : name;

          const _id = isMainnet
            ? `${daoName}.sputnik-dao.near`
            : `${daoName}.sputnikv2.testnet`;

          const url = isMainnet
            ? 'https://rpc.mainnet.near.org'
            : 'https://rpc.testnet.near.org';

          const createChainArgs = {
            base: ChainBase.NEAR,
            icon_url: chainFormDefaultFields.iconUrl,
            id: _id,
            jwt: app.user.jwt,
            name: _id,
            network: ChainNetwork.Sputnik,
            node_url: url,
            default_symbol: isMainnet ? 'NEAR' : 'tNEAR',
            type: ChainType.DAO,
            // ...form, <-- not typed so I don't know what's needed
          };

          // mixpanelBrowserTrack({
          //   event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
          //   chainBase: null,
          //   isCustomDomain: app.isCustomDomain(),
          //   communityType: null,
          // });

          try {
            // verify the DAO exists
            // const config: ConnectConfig = {
            //   networkId: isMainnet ? 'mainnet' : 'testnet',
            //   nodeUrl: url,
            //   keyStore: new keyStores.BrowserLocalStorageKeyStore(localStorage),
            // };

            // const api = await nearConnect(config);

            // const rawResult = await api.connection.provider.query<CodeResult>({
            //   request_type: 'call_function',
            //   account_id: id,
            //   method_name: 'get_last_proposal_id',
            //   args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
            //   finality: 'optimistic',
            // });

            // const _validResponse = JSON.parse(
            //   Buffer.from(rawResult.result).toString()
            // );

            // POST object
            const res = await $.post(
              `${app.serverUrl()}/createChain`,
              createChainArgs
            );

            if (res.result.admin_address) {
              await linkExistingAddressToChainOrCommunity(
                res.result.admin_address,
                res.result.role.chain_id,
                res.result.role.chain_id
              );
            }

            await initAppState(false);

            navigate(`${window.location.origin}/${res.result.chain.id}`);
          } catch (err) {
            notifyError(err.responseJSON?.error || 'Adding DAO failed.');
            console.error(err.responseJSON?.error || err.message);
            setSaving(false);
          }
        }}
      />
    </div>
  );
};
