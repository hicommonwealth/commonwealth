import { providers } from 'ethers';
import $ from 'jquery';
import React, { useEffect, useState } from 'react';
import { isAddress } from 'web3-utils';

import 'pages/create_community.scss';

import { IERC20Metadata__factory } from 'common-common/src/eth/types';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import app, { initAppState } from 'state';
import { slugify, slugifyPreserveDashes } from 'utils';
import { IdRow, InputRow } from 'views/components/metadata_rows';
import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import {
  EthCommunityRows,
  defaultCommunityRows,
  updateAdminOnCreateCommunity
} from './community_input_rows';
import {
  useCommunityFormDefaultFields,
  useCommunityFormIdFields,
  useCommunityFormState,
  useEthCommunityFormFields
} from './hooks';
import { ETHEREUM_MAINNET } from './index';
import type { EthChainNodeFormState } from './types';

export const ERC20Form = ({
  ethChainNodeNames,
  ethChainNodes
}: EthChainNodeFormState) => {
  const [, setDecimals] = useState(18);

  const { id, setId, name, setName, symbol, setSymbol } =
    useCommunityFormIdFields();

  const communityFormDefaultFields = useCommunityFormDefaultFields();

  const communityFormState = useCommunityFormState();

  const ethChainFormFields = useEthCommunityFormFields();

  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!ethChainFormFields.chainName) {
      ethChainFormFields.setChainName(ETHEREUM_MAINNET);
    }
  }, [ethChainFormFields]);

  const validAddress = isAddress(ethChainFormFields.address);
  const disableField = !validAddress || !communityFormState.loaded;

  const updateTokenForum = async () => {
    if (!ethChainFormFields.address || !ethChainFormFields.ethChainId) {
      return;
    }

    communityFormState.setStatus(undefined);
    communityFormState.setMessage('');
    communityFormState.setLoading(true);

    const args = {
      address: ethChainFormFields.address,
      chain_id: ethChainFormFields.ethChainId,
      url: ethChainFormFields.nodeUrl
    };

    try {
      console.log('Querying backend for token data');

      const res = await $.get(`${app.serverUrl()}/getTokenForum`, args);

      if (res.status === 'Success') {
        if (res?.token?.name) {
          setName(res.token.name || '');
          setId(res.token.id && slugify(res.token.id));
          setSymbol(res.token.symbol || '');
          setDecimals(+res.token.decimals);
          communityFormDefaultFields.setIconUrl(res.token.icon_url || '');

          if (communityFormDefaultFields.iconUrl.startsWith('/')) {
            communityFormDefaultFields.setIconUrl(
              `https://commonwealth.im${communityFormDefaultFields.iconUrl}`
            );
          }

          communityFormDefaultFields.setDescription(
            res.token.description || ''
          );
          communityFormDefaultFields.setWebsite(res.token.website || '');
          communityFormDefaultFields.setDiscord(res.token.discord || '');
          communityFormDefaultFields.setElement(res.token.element || '');
          communityFormDefaultFields.setTelegram(res.token.telegram || '');
          communityFormDefaultFields.setGithub(res.token.github || '');
          communityFormState.setStatus('success');
          communityFormState.setMessage('Success!');
        } else {
          // attempt to query ERC20Detailed token info from chain
          console.log('Querying chain for ERC info');

          const Web3 = (await import('web3')).default;
          const provider =
            args.url.slice(0, 4) == 'http'
              ? new Web3.providers.HttpProvider(args.url)
              : new Web3.providers.WebsocketProvider(args.url);

          try {
            const ethersProvider = new providers.Web3Provider(provider);

            const contract = IERC20Metadata__factory.connect(
              args.address,
              ethersProvider
            );

            const contractName = await contract.name();
            const contractSymbol = await contract.symbol();
            const contractDecimals = await contract.decimals();

            setName(contractName || '');
            setId(contractName);
            setSymbol(contractSymbol || '');
            setDecimals(contractDecimals);
            communityFormState.setStatus('success');
            communityFormState.setMessage('Success!');
          } catch (e) {
            setName('');
            setId('');
            setSymbol('');
            communityFormState.setStatus('failure');
            communityFormState.setMessage(
              'Verified token but could not load metadata.'
            );
          }

          communityFormDefaultFields.setIconUrl('');
          communityFormDefaultFields.setDescription('');
          communityFormDefaultFields.setWebsite('');
          communityFormDefaultFields.setDiscord('');
          communityFormDefaultFields.setElement('');
          communityFormDefaultFields.setTelegram('');
          communityFormDefaultFields.setGithub('');
          if (provider instanceof Web3.providers.WebsocketProvider)
            provider.disconnect(1000, 'finished');
        }

        communityFormState.setLoaded(true);
      } else {
        communityFormState.setStatus('failure');
        communityFormState.setMessage(
          res.message || 'Failed to load Token Information'
        );
      }
    } catch (err) {
      communityFormState.setStatus('failure');
      communityFormState.setMessage(
        err.responseJSON?.error || 'Failed to load Token Information'
      );
    }
    communityFormState.setLoading(false);
  };

  return (
    <div className="CreateCommunityForm">
      {EthCommunityRows(
        { ethChainNodeNames, ethChainNodes },
        { ...ethChainFormFields, ...communityFormState }
      )}
      <CWButton
        label="Populate fields"
        disabled={
          communityFormState.saving ||
          !validAddress ||
          !ethChainFormFields.ethChainId ||
          communityFormState.loading
        }
        onClick={async () => {
          await updateTokenForum();
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
            const res = await $.post(`${app.serverUrl()}/communities`, {
              alt_wallet_url: ethChainFormFields.altWalletUrl,
              base: ChainBase.Ethereum,
              id: id,
              name: name,
              address: ethChainFormFields.address,
              chain_string: ethChainFormFields.chainName,
              eth_chain_id: ethChainFormFields.ethChainId,
              icon_url: communityFormDefaultFields.iconUrl,
              jwt: app.user.jwt,
              network: ChainNetwork.ERC20,
              node_url: ethChainFormFields.nodeUrl,
              type: ChainType.Token,
              default_symbol: symbol
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
            await updateAdminOnCreateCommunity(id);

            navigate(`/${res.result.community?.id}`);
          } catch (err) {
            notifyError(
              err.responseJSON?.error || 'Creating new ERC20 community failed'
            );
          } finally {
            communityFormState.setSaving(false);
          }
        }}
      />
    </div>
  );
};
