import React, { useEffect, useState } from 'react';
import { isAddress } from 'web3-utils';
import $ from 'jquery';

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
  defaultCommunityRows,
  EthCommunityRows,
  updateAdminOnCreateCommunity,
} from 'client/scripts/views/pages/create_community/community_input_rows';
import type { EthCommunityFormState } from 'views/pages/create_community/types';
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
  useCommunityFormIdFields,
  useCommunityFormDefaultFields,
  useCommunityFormState,
  useEthCommunityFormFields,
} from './hooks';
import { ETHEREUM_MAINNET } from './index';

export const EthDaoForm = ({
  ethCommunityNames,
  ethCommunities,
}: EthCommunityFormState) => {
  const [network, setNetwork] = useState<
    ChainNetwork.Aave | ChainNetwork.Compound
  >(ChainNetwork.Compound);
  const [tokenName, setTokenName] = useState('token');

  const { id, setId, name, setName, symbol, setSymbol } =
    useCommunityFormIdFields();

  const communityFormDefaultFields = useCommunityFormDefaultFields();

  const communityFormState = useCommunityFormState();

  const ethCommunityFormFields = useEthCommunityFormFields();

  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!ethCommunityFormFields.communityString) {
      ethCommunityFormFields.setCommunityString(ETHEREUM_MAINNET);
    }
  }, [ethCommunityFormFields]);

  const validAddress = isAddress(ethCommunityFormFields.address);
  const disableField = !validAddress || !communityFormState.loaded;

  const updateDAO = async () => {
    if (
      !ethCommunityFormFields.address ||
      !ethCommunityFormFields.ethCommunityId ||
      ethCommunityFormFields.nodeUrl
    ) {
      return;
    }

    communityFormState.setStatus(undefined);
    communityFormState.setMessage('');
    communityFormState.setLoading(true);

    try {
      if (network === ChainNetwork.Compound) {
        const Web3 = (await import('web3')).default;
        const provider =
          ethCommunityFormFields.nodeUrl.slice(0, 4) == 'http'
            ? new Web3.providers.HttpProvider(ethCommunityFormFields.nodeUrl)
            : new Web3.providers.WebsocketProvider(
                ethCommunityFormFields.nodeUrl
              );

        const compoundApi = new CompoundAPI(
          ethCommunityFormFields.address,
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

        communityFormState.setStatus('success');
        communityFormState.setMessage(
          `Found ${govType} with token type ${tokenType}`
        );
      } else if (network === ChainNetwork.Aave) {
        const Web3 = (await import('web3')).default;
        const provider =
          ethCommunityFormFields.nodeUrl.slice(0, 4) == 'http'
            ? new Web3.providers.HttpProvider(ethCommunityFormFields.nodeUrl)
            : new Web3.providers.WebsocketProvider(
                ethCommunityFormFields.nodeUrl
              );

        const aaveApi = new AaveApi(
          IAaveGovernanceV2__factory.connect,
          ethCommunityFormFields.address,
          provider
        );

        await aaveApi.init();

        communityFormState.setStatus('success');
        communityFormState.setMessage('Found Aave type DAO');
      } else {
        throw new Error('invalid chain network');
      }
    } catch (e) {
      communityFormState.setStatus('failure');
      communityFormState.setMessage(e.message);
      communityFormState.setLoading(false);
      return;
    }
    communityFormState.setLoaded(true);
    communityFormState.setLoading(false);
  };

  return (
    <div className="CreateCommunityForm">
      {EthCommunityRows(
        { ethCommunityNames, ethCommunities },
        { ...ethCommunityFormFields, ...communityFormState }
      )}
      <CWDropdown
        label="DAO Type"
        options={[
          { label: ChainNetwork.Aave, value: ChainNetwork.Aave },
          { label: ChainNetwork.Compound, value: ChainNetwork.Compound },
        ]}
        onSelect={(o) => {
          setNetwork(o.value as ChainNetwork.Aave | ChainNetwork.Compound);
          communityFormState.setLoaded(false);
        }}
      />
      {network === ChainNetwork.Compound && (
        <InputRow
          title="Token Name (Case Sensitive)"
          value={tokenName}
          onChangeHandler={(v) => {
            setTokenName(v);
            communityFormState.setLoaded(false);
          }}
        />
      )}
      <CWButton
        label="Test contract"
        disabled={
          communityFormState.saving ||
          !validAddress ||
          !ethCommunityFormFields.ethCommunityId ||
          communityFormState.loading
        }
        onClick={async () => {
          await updateDAO();
        }}
      />
      {communityFormState.message && (
        <CWValidationText
          message={communityFormState.message}
          status={communityFormState.status}
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
      {defaultCommunityRows(communityFormDefaultFields, disableField)}
      <CWButton
        label="Save changes"
        disabled={
          communityFormState.saving ||
          !validAddress ||
          !communityFormState.loaded
        }
        onClick={async () => {
          communityFormState.setSaving(true);

          try {
            const res = await $.post(`${app.serverUrl()}/createChain`, {
              base: ChainBase.Ethereum,
              id: id,
              name: name,
              address: ethCommunityFormFields.address,
              community_string: ethCommunityFormFields.communityString,
              eth_community_id: ethCommunityFormFields.ethCommunityId,
              jwt: app.user.jwt,
              node_url: ethCommunityFormFields.nodeUrl,
              icon_url: communityFormDefaultFields.iconUrl,
              token_name: tokenName,
              type: ChainType.DAO,
              default_symbol: symbol,
              // ...form, <-- not typed so I don't know what's needed
            });

            if (res.result.admin_address) {
              await linkExistingAddressToChainOrCommunity(
                res.result.admin_address,
                res.result.role.community_id,
                res.result.role.community_id
              );
            }

            await initAppState(false);
            await updateAdminOnCreateCommunity(id);

            navigate(`/${res.result.community?.id}`);
          } catch (err) {
            notifyError(
              err.responseJSON?.error || 'Creating new ETH DAO community failed'
            );
          } finally {
            communityFormState.setSaving(false);
          }
        }}
      />
    </div>
  );
};
