import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import app from 'state';
import { AvatarUpload } from 'views/components/Avatar';
import { InputRow } from 'views/components/metadata_rows';
import { Skeleton } from '../../components/Skeleton';
import type { DropdownItemType } from '../../components/component_kit/cw_dropdown';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWLabel } from '../../components/component_kit/cw_label';
import type {
  ChainFormDefaultFields,
  EthChainFormState,
  UseChainFormDefaultFieldsHookType,
  UseChainFormStateHookType,
  UseEthChainFormFieldsHookType,
} from './types';

export async function updateAdminOnCreateCommunity(chainId: string) {
  app.user.ephemerallySetActiveAccount(
    app.user.addresses.filter((a) => a.chain.id === chainId)[0]
  );

  const roles = await axios.get(`${app.serverUrl()}/roles`, {
    params: {
      chain_id: chainId,
      permissions: ['admin'],
    },
  });

  app.roles.addRole(roles.data.result[0]);
  app.skipDeinitChain = true;
}

export const initChainForm = (): ChainFormDefaultFields => {
  return {
    description: '',
    discord: '',
    element: '',
    github: '',
    iconUrl: '',
    telegram: '',
    uploadInProgress: false,
    website: '',
  };
};

export const defaultChainRows = <T extends UseChainFormDefaultFieldsHookType>(
  state: T,
  disabled = false
) => {
  return (
    <>
      <InputRow
        title="Description"
        disabled={disabled}
        value={state.description}
        onChangeHandler={(v) => {
          state.setDescription(v);
        }}
        textarea
      />
      <div className="AvatarUploadRow">
        <CWLabel label="Upload Icon" />
        <AvatarUpload
          scope="community"
          uploadStartedCallback={() => {
            state.setUploadInProgress(true);
          }}
          uploadCompleteCallback={(files) => {
            files.forEach((f) => {
              if (!f.uploadURL) return;
              const url = f.uploadURL.replace(/\?.*/, '');
              state.setIconUrl(url);
            });

            state.setUploadInProgress(false);
          }}
        />
      </div>
      <InputRow
        title="Icon URL"
        disabled={disabled}
        value={state.iconUrl}
        placeholder="https://"
        onChangeHandler={(v) => {
          state.setIconUrl(v);
        }}
      />
      <InputRow
        title="Website"
        disabled={disabled}
        value={state.website}
        placeholder="https://example.com"
        onChangeHandler={(v) => {
          state.setWebsite(v);
        }}
      />
      <InputRow
        title="Discord"
        disabled={disabled}
        value={state.discord}
        placeholder="https://discord.com/invite"
        onChangeHandler={(v) => {
          state.setDiscord(v);
        }}
      />
      <InputRow
        title="Element"
        disabled={disabled}
        value={state.element}
        placeholder="https://matrix.to/#"
        onChangeHandler={(v) => {
          state.setElement(v);
        }}
      />
      <InputRow
        title="Telegram"
        disabled={disabled}
        value={state.telegram}
        placeholder="https://t.me"
        onChangeHandler={(v) => {
          state.setTelegram(v);
        }}
      />
      <InputRow
        title="Github"
        disabled={disabled}
        value={state.github}
        placeholder="https://github.com"
        onChangeHandler={(v) => {
          state.setGithub(v);
        }}
      />
    </>
  );
};

type EthChainState = UseEthChainFormFieldsHookType & UseChainFormStateHookType;

export const EthChainRows = (
  props: EthChainFormState,
  state: EthChainState
) => {
  const [defaultChainNode, setDefaultChainNode] = useState<DropdownItemType>();
  const [customInputs, setCustomInputs] = useState(false);
  const { ethChainNames, ethChains, disabled } = props;
  const {
    setAddress,
    setChainString,
    setEthChainId,
    setNodeUrl,
    setAltWalletUrl,
    setLoaded,
    address,
    altWalletUrl,
    chainString,
    ethChainId,
    nodeUrl,
  } = state;
  const options = useMemo(
    () =>
      [
        ...Object.keys(ethChains).map(
          (c) =>
            ({
              label: ethChainNames[c],
              value: ethChainNames[c],
            } || { label: c, value: c })
        ),
        app?.user.isSiteAdmin ? { label: 'Custom', value: 'Custom' } : {},
      ] as Array<DropdownItemType>,
    [ethChains, ethChainNames]
  );

  const onSelectHandler = useCallback(
    (o) => {
      if (!o?.value) return;
      setChainString(o.value);

      if (o.value !== 'Custom') {
        const [id] =
          Object.entries(ethChainNames).find(([, name]) => name === o.value) ||
          Object.keys(ethChains).find((cId) => `${cId}` === o.value);

        setEthChainId(id);
        setNodeUrl(ethChains[id].url);
        setAltWalletUrl(ethChains[id].alt_wallet_url);
      } else {
        setEthChainId('');
        setNodeUrl('');
        setAltWalletUrl('');
        setCustomInputs(true);
      }
    },
    [
      setChainString,
      ethChainNames,
      ethChains,
      setEthChainId,
      setNodeUrl,
      setAltWalletUrl,
    ]
  );

  // chainString is the key we use to set all the other fields:
  useEffect(() => {
    if (chainString && options?.length > 0) {
      const foundChainNode = options.find((o) => o.label === chainString);
      setDefaultChainNode(foundChainNode || options[0]);
    }
  }, [chainString, options]);

  // when we know the defaultChainNode, we can set the other fields:
  useEffect(() => {
    if (defaultChainNode && !nodeUrl) {
      onSelectHandler(defaultChainNode);
    }
  }, [defaultChainNode, nodeUrl, onSelectHandler]);

  return (
    <>
      {defaultChainNode ? (
        <CWDropdown
          label="Chain"
          options={options}
          initialValue={defaultChainNode}
          onSelect={(o) => onSelectHandler(o)}
          disabled={!!disabled}
        />
      ) : (
        <Skeleton height="62px" />
      )}
      {customInputs && (
        <>
          <InputRow
            title="Chain ID"
            value={ethChainId}
            placeholder="1"
            onChangeHandler={async (v) => {
              setEthChainId(v);
              setLoaded(false);
            }}
          />
          <InputRow
            title="Websocket URL"
            value={nodeUrl}
            placeholder="wss://... (leave empty for default)"
            onChangeHandler={async (v) => {
              setNodeUrl(v);
              setLoaded(false);
            }}
          />
          <InputRow
            title="HTTP URL"
            value={altWalletUrl}
            placeholder="https://...  (leave empty for default)"
            onChangeHandler={async (v) => {
              setAltWalletUrl(v);
              setLoaded(false);
            }}
          />
        </>
      )}
      <InputRow
        title="Token Contract Address"
        value={address}
        placeholder="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
        onChangeHandler={(v) => {
          setAddress(v);
          setLoaded(false);
        }}
      />
    </>
  );
};
