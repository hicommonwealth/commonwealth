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
  CommunityFormDefaultFields,
  EthChainNodeFormState,
  UseCommunityFormDefaultFieldsHookType,
  UseCommunityFormStateHookType,
  UseEthCommunityFormFieldsHookType,
} from './types';

export async function updateAdminOnCreateCommunity(communityId: string) {
  app.user.ephemerallySetActiveAccount(
    app.user.addresses.filter((a) => a.community.id === communityId)[0],
  );

  const roles = await axios.get(`${app.serverUrl()}/roles`, {
    params: {
      chain_id: communityId,
      permissions: ['admin'],
    },
  });

  app.roles.addRole(roles.data.result[0]);
  app.skipDeinitChain = true;
}

export const initCommunityForm = (): CommunityFormDefaultFields => {
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

export const defaultCommunityRows = <
  T extends UseCommunityFormDefaultFieldsHookType,
>(
  state: T,
  disabled = false,
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

type EthChainState = UseEthCommunityFormFieldsHookType &
  UseCommunityFormStateHookType;

export const EthCommunityRows = (
  props: EthChainNodeFormState,
  state: EthChainState,
) => {
  const [defaultCommunityNode, setDefaultCommunityNode] =
    useState<DropdownItemType>();
  const options = useMemo(
    () =>
      [
        ...Object.keys(props.ethChainNodes).map(
          (c) =>
            ({
              label: props.ethChainNodeNames[c],
              value: props.ethChainNodeNames[c],
            } || { label: c, value: c }),
        ),
        app?.user.isSiteAdmin ? { label: 'Custom', value: 'Custom' } : {},
      ] as Array<DropdownItemType>,
    [props.ethChainNodes, props.ethChainNodeNames],
  );

  const onSelectHandler = useCallback(
    (o) => {
      if (!o?.value) return;
      state.setChainName(o.value);

      if (o.value !== 'Custom') {
        const [id] =
          Object.entries(props.ethChainNodeNames).find(
            ([, name]) => name === o.value,
          ) ||
          Object.keys(props.ethChainNodes).find((cId) => `${cId}` === o.value);

        state.setEthChainId(id);
        state.setNodeUrl(props.ethChainNodes[id].url);
        state.setAltWalletUrl(props.ethChainNodes[id].alt_wallet_url);
      } else {
        state.setEthChainId('');
        state.setNodeUrl('');
        state.setAltWalletUrl('');
      }
    },
    [state, props.ethChainNodes, props.ethChainNodeNames],
  );

  // communityString is the key we use to set all the other fields:
  useEffect(() => {
    if (state?.chainName && options?.length > 0) {
      const foundCommunityNode = options.find(
        (o) => o.label === state.chainName,
      );
      setDefaultCommunityNode(foundCommunityNode || options[0]);
    }
  }, [state?.chainName, options]);

  // when we know the defaultCommunityNode, we can set the other fields:
  useEffect(() => {
    if (defaultCommunityNode && !state.nodeUrl) {
      onSelectHandler(defaultCommunityNode);
    }
  }, [defaultCommunityNode, state?.nodeUrl, onSelectHandler]);

  return (
    <>
      {defaultCommunityNode ? (
        <CWDropdown
          label="Community"
          options={options}
          initialValue={defaultCommunityNode}
          onSelect={(o) => onSelectHandler(o)}
          disabled={!!props.disabled}
        />
      ) : (
        <Skeleton height="62px" />
      )}
      {state.chainName === 'Custom' && (
        <InputRow
          title="Community ID"
          value={state.ethChainId}
          placeholder="1"
          onChangeHandler={async (v) => {
            state.setEthChainId(v);
            state.setLoaded(false);
          }}
        />
      )}
      {state.chainName === 'Custom' && (
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
      {state.chainName === 'Custom' && (
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
        title="Token Contract Address"
        value={state.address}
        placeholder="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
        onChangeHandler={(v) => {
          state.setAddress(v);
          state.setLoaded(false);
        }}
      />
    </>
  );
};
