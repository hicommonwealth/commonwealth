import React, { useEffect } from 'react';
import { isAddress } from 'web3-utils';
import { providers } from 'ethers';
import $ from 'jquery';

// import { MixpanelCommunityCreationEvent } from 'analytics/types';
// import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

import 'pages/create_community.scss';

import app from 'state';
import { initAppState } from 'state';
import { IERC721Metadata__factory } from 'common-common/src/eth/types';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { slugify, slugifyPreserveDashes } from 'utils';
import { IdRow, InputRow } from 'views/components/metadata_rows';
import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { defaultChainRows, ethChainRows } from './chain_input_rows';
import type { EthChainFormState } from './types';
import { useCommonNavigate } from 'navigation/helpers';
import {
  useChainFormIdFields,
  useChainFormDefaultFields,
  useChainFormState,
  useEthChainFormFields,
} from './hooks';

export const ERC721Form = (props: EthChainFormState) => {
  const { ethChainNames, ethChains } = props;

  const { id, setId, name, setName, symbol, setSymbol } =
    useChainFormIdFields();

  const chainFormDefaultFields = useChainFormDefaultFields();

  const chainFormState = useChainFormState();

  const ethChainFormFields = useEthChainFormFields();

  const navigate = useCommonNavigate();

  useEffect(() => {
    ethChainFormFields.setChainString('Ethereum Mainnet');
    ethChainFormFields.setNodeUrl(ethChains[1].url);
  }, []);

  const validAddress = isAddress(ethChainFormFields.address);
  const disableField = !validAddress || !chainFormState.loaded;

  const updateTokenForum = async () => {
    if (!ethChainFormFields.address || !ethChainFormFields.ethChainId) return;

    chainFormState.setStatus(undefined);
    chainFormState.setMessage('');
    chainFormState.setLoading(true);

    const args = {
      address: ethChainFormFields.address,
      chain_id: ethChainFormFields.ethChainId,
      chain_network: ChainNetwork.ERC721,
      url: ethChainFormFields.nodeUrl,
      allowUncached: true,
    };

    try {
      console.log('Querying backend for token data');

      const res = await $.get(`${app.serverUrl()}/getTokenForum`, args);

      if (res.status === 'Success') {
        if (res?.token?.name) {
          setName(res.token.name || '');
          setId(res.token.id && slugify(res.token.id));
          setSymbol(res.token.symbol || '');
          chainFormDefaultFields.setIconUrl(res.token.icon_url || '');

          if (chainFormDefaultFields.iconUrl.startsWith('/')) {
            `https://commonwealth.im${chainFormDefaultFields.iconUrl}`;
          }

          chainFormDefaultFields.setDescription(res.token.description || '');
          chainFormDefaultFields.setWebsite(res.token.website || '');
          chainFormDefaultFields.setDiscord(res.token.discord || '');
          chainFormDefaultFields.setElement(res.token.element || '');
          chainFormDefaultFields.setTelegram(res.token.telegram || '');
          chainFormDefaultFields.setGithub(res.token.github || '');
          chainFormState.setStatus('success');
          chainFormState.setMessage('Success!');
        } else {
          // attempt to query ERC721Detailed token info from chain
          console.log('Querying chain for ERC info');

          const Web3 = (await import('web3')).default;

          const provider =
            args.url.slice(0, 4) == 'http'
              ? new Web3.providers.HttpProvider(args.url)
              : new Web3.providers.WebsocketProvider(args.url);

          try {
            const ethersProvider = new providers.Web3Provider(provider);

            const contract = IERC721Metadata__factory.connect(
              args.address,
              ethersProvider
            );

            const contractName = await contract.name();
            const contractSymbol = await contract.symbol();

            setName(contractName || '');
            setId(contractName);
            setSymbol(contractSymbol || '');
            chainFormState.setStatus('success');
            chainFormState.setMessage('Success!');
          } catch (e) {
            setName('');
            setId('');
            setSymbol('');
            chainFormState.setStatus('failure');
            chainFormState.setMessage(
              'Verified token but could not load metadata.'
            );
          }

          chainFormDefaultFields.setIconUrl('');
          chainFormDefaultFields.setDescription('');
          chainFormDefaultFields.setWebsite('');
          chainFormDefaultFields.setDiscord('');
          chainFormDefaultFields.setElement('');
          chainFormDefaultFields.setTelegram('');
          chainFormDefaultFields.setGithub('');

          if (provider instanceof Web3.providers.WebsocketProvider)
            provider.disconnect(1000, 'finished');
        }

        chainFormState.setLoaded(true);
      } else {
        chainFormState.setStatus('failure');
        chainFormState.setMessage(
          res.message || 'Failed to load Token Information'
        );
      }
    } catch (err) {
      chainFormState.setStatus('failure');
      chainFormState.setMessage(
        err.responseJSON?.error || 'Failed to load Token Information'
      );
    }
    chainFormState.setLoading(false);
  };

  return (
    <div className="CreateCommunityForm">
      {ethChainRows(
        { ethChainNames, ethChains },
        { ...ethChainFormFields, ...chainFormState }
      )}
      <CWButton
        label="Populate fields"
        disabled={
          chainFormState.saving ||
          !validAddress ||
          !ethChainFormFields.ethChainId ||
          chainFormState.loading
        }
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
              alt_wallet_url: ethChainFormFields.altWalletUrl,
              id: id,
              name: name,
              address: ethChainFormFields.address,
              base: ChainBase.Ethereum,
              chain_string: ethChainFormFields.chainString,
              eth_chain_id: ethChainFormFields.ethChainId,
              jwt: app.user.jwt,
              icon_url: chainFormDefaultFields.iconUrl,
              network: ChainNetwork.ERC721,
              node_url: ethChainFormFields.nodeUrl,
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
              err.responseJSON?.error || 'Creating new ERC721 community failed'
            );
          } finally {
            chainFormState.setSaving(false);
          }
        }}
      />
    </div>
  );
};
