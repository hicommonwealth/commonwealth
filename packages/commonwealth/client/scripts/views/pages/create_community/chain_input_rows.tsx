import React, { useEffect } from 'react';

import app from 'state';
import { AvatarUpload } from 'views/components/Avatar';
import { InputRow } from 'views/components/metadata_rows';
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

export const ethChainRows = (
  props: EthChainFormState,
  state: EthChainState
) => {
  const options = [
    ...Object.keys(props.ethChains).map(
      (c) =>
        ({
          label: props.ethChainNames[c],
          value: props.ethChainNames[c],
        } || { label: c, value: c })
    ),
    app?.user.isSiteAdmin ? { label: 'Custom', value: 'Custom' } : {},
  ] as Array<DropdownItemType>;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    onSelectHandler(options[0]);
  }, [onSelectHandler, options]);

  return (
    <>
      <CWDropdown
        label="Chain"
        options={options}
        initialValue={options[0]}
        onSelect={(o) => onSelectHandler(o)}
      />
      {state.chainString === 'Custom' && (
        <InputRow
          title="Chain ID"
          value={state.ethChainId}
          placeholder="1"
          onChangeHandler={async (v) => {
            state.setEthChainId(v);
            state.setLoaded(false);
          }}
        />
      )}
      {state.chainString === 'Custom' && (
        <InputRow
          title="Websocket URL"
          value={state.nodeUrl}
          placeholder="wss://... (leave empty for default)"
          onChangeHandler={async (v) => {
            state.setNodeUrl(v);
            state.setLoaded(false);
          }}
        />
      )}
      {state.chainString === 'Custom' && (
        <InputRow
          title="HTTP URL"
          value={state.altWalletUrl}
          placeholder="https://...  (leave empty for default)"
          onChangeHandler={async (v) => {
            state.setAltWalletUrl(v);
            state.setLoaded(false);
          }}
        />
      )}
      <InputRow
        title="Address"
        value={state.address}
        placeholder="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
        onChangeHandler={(v) => {
          state.setAddress(v);
          state.setLoaded(false);
        }}
      />
    </>
  );

  function onSelectHandler(o) {
    state.setChainString(o.value);

    if (o.value !== 'Custom') {
      const [id] =
        Object.entries(props.ethChainNames).find(
          ([, name]) => name === o.value
        ) || Object.keys(props.ethChains).find((cId) => `${cId}` === o.value);

      state.setEthChainId(id);
      state.setNodeUrl(props.ethChains[id].url);
      state.setAltWalletUrl(props.ethChains[id].alt_wallet_url);
    } else {
      state.setEthChainId('');
      state.setNodeUrl('');
      state.setAltWalletUrl('');
    }
  }
};
