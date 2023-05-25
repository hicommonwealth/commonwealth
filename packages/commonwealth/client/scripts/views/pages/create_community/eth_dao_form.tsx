import React, { useEffect, useState } from 'react';
import { isAddress } from 'web3-utils';
import $ from 'jquery';

// import { MixpanelCommunityCreationEvent } from 'analytics/types';
// import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

import 'pages/create_community.scss';

import { IAaveGovernanceV2__factory } from 'common-common/src/eth/types';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';

import app from 'state';
import { initAppState } from 'state';
import { slugifyPreserveDashes } from 'utils';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';
import { IdRow, InputRow } from 'views/components/metadata_rows';
import {
  defaultChainRows,
  ethChainRows,
} from 'views/pages/create_community/chain_input_rows';
import type { EthChainFormState } from 'views/pages/create_community/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { notifyError } from 'controllers/app/notifications';
import AaveApi from 'controllers/chain/ethereum/aave/api';
import CompoundAPI, {
  GovernorTokenType,
  GovernorType,
} from 'controllers/chain/ethereum/compound/api';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { useCommonNavigate } from 'navigation/helpers';
import {
  useChainFormIdFields,
  useChainFormDefaultFields,
  useChainFormState,
  useEthChainFormFields,
} from './hooks';

export const EthDaoForm = (props: EthChainFormState) => {
  const { ethChainNames, ethChains } = props;

  const [network, setNetwork] = useState<
    ChainNetwork.Aave | ChainNetwork.Compound
  >(ChainNetwork.Compound);
  const [tokenName, setTokenName] = useState('token');

  const { id, setId, name, setName, symbol, setSymbol } =
    useChainFormIdFields();

  const chainFormDefaultFields = useChainFormDefaultFields();

  const chainFormState = useChainFormState();

  const ethChainFormFields = useEthChainFormFields();

  const navigate = useCommonNavigate();

  useEffect(() => {
    ethChainFormFields.setNodeUrl(ethChains[1].url);
  }, []);

  const validAddress = isAddress(ethChainFormFields.address);
  const disableField = !validAddress || !chainFormState.loaded;

  const updateDAO = async () => {
    if (
      !ethChainFormFields.address ||
      !ethChainFormFields.ethChainId ||
      ethChainFormFields.nodeUrl
    ) {
      return;
    }

    chainFormState.setStatus(undefined);
    chainFormState.setMessage('');
    chainFormState.setLoading(true);

    try {
      if (network === ChainNetwork.Compound) {
        const Web3 = (await import('web3')).default;

        const provider = new Web3.providers.WebsocketProvider(
          ethChainFormFields.nodeUrl
        );

        const compoundApi = new CompoundAPI(
          null,
          ethChainFormFields.address,
          provider
        );

        await compoundApi.init(tokenName);

        if (!compoundApi.Token) {
          throw new Error(
            'Could not find governance token. Is "Token Name" field valid?'
          );
        }

        const govType = GovernorType[compoundApi.govType];
        const tokenType = GovernorTokenType[compoundApi.tokenType];

        chainFormState.setStatus('success');
        chainFormState.setMessage(
          `Found ${govType} with token type ${tokenType}`
        );
      } else if (network === ChainNetwork.Aave) {
        const Web3 = (await import('web3')).default;

        const provider = new Web3.providers.WebsocketProvider(
          ethChainFormFields.nodeUrl
        );

        const aaveApi = new AaveApi(
          IAaveGovernanceV2__factory.connect,
          ethChainFormFields.address,
          provider
        );

        await aaveApi.init();

        chainFormState.setStatus('success');
        chainFormState.setMessage('Found Aave type DAO');
      } else {
        throw new Error('invalid chain network');
      }
    } catch (e) {
      chainFormState.setStatus('failure');
      chainFormState.setMessage(e.message);
      chainFormState.setLoading(false);
      return;
    }
    chainFormState.setLoaded(true);
    chainFormState.setLoading(false);
  };

  return (
    <div className="CreateCommunityForm">
      {ethChainRows(
        { ethChainNames, ethChains },
        { ...ethChainFormFields, ...chainFormState }
      )}
      <CWDropdown
        label="DAO Type"
        options={[
          { label: ChainNetwork.Aave, value: ChainNetwork.Aave },
          { label: ChainNetwork.Compound, value: ChainNetwork.Compound },
        ]}
        onSelect={(o) => {
          setNetwork(o.value as ChainNetwork.Aave | ChainNetwork.Compound);
          chainFormState.setLoaded(false);
        }}
      />
      {network === ChainNetwork.Compound && (
        <InputRow
          title="Token Name (Case Sensitive)"
          value={tokenName}
          onChangeHandler={(v) => {
            setTokenName(v);
            chainFormState.setLoaded(false);
          }}
        />
      )}
      <CWButton
        label="Test contract"
        disabled={
          chainFormState.saving ||
          !validAddress ||
          !ethChainFormFields.ethChainId ||
          chainFormState.loading
        }
        onClick={async () => {
          await updateDAO();
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
      {defaultChainRows(chainFormDefaultFields, disableField)}
      <CWButton
        label="Save changes"
        disabled={
          chainFormState.saving || !validAddress || !chainFormState.loaded
        }
        onClick={async () => {
          chainFormState.setSaving(true);

          // mixpanelBrowserTrack({
          //   event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
          //   chainBase: null,
          //   isCustomDomain: app.isCustomDomain(),
          //   communityType: null,
          // });

          try {
            const res = await $.post(`${app.serverUrl()}/createChain`, {
              base: ChainBase.Ethereum,
              id: id,
              name: name,
              address: ethChainFormFields.address,
              chain_string: ethChainFormFields.chainString,
              eth_chain_id: ethChainFormFields.ethChainId,
              jwt: app.user.jwt,
              node_url: ethChainFormFields.nodeUrl,
              icon_url: chainFormDefaultFields.iconUrl,
              token_name: tokenName,
              type: ChainType.DAO,
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
              err.responseJSON?.error || 'Creating new ETH DAO community failed'
            );
          } finally {
            chainFormState.setSaving(false);
          }
        }}
      />
    </div>
  );
};
