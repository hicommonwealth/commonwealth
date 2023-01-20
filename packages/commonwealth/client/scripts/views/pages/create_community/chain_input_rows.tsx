/* @jsx m */

import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { ChainBase } from 'common-common/src/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import m from 'mithril';

import app from 'state';
import { AvatarUpload } from 'views/components/avatar_upload';

import { InputRow } from 'views/components/metadata_rows';
import { CommunityType } from '.';
import type { DropdownItemType } from '../../components/component_kit/cw_dropdown';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWLabel } from '../../components/component_kit/cw_label';
import type {
  ChainFormDefaultFields,
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
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

export function defaultChainRows<T extends ChainFormDefaultFields>(
  state: T,
  disabled = false
) {
  return [
    <InputRow
      title="Description"
      disabled={disabled}
      value={state.description}
      onChangeHandler={(v) => {
        state.description = v;
      }}
      textarea
    />,
    <div class="AvatarUploadRow">
      <CWLabel label="Upload Icon" />
      <AvatarUpload
        scope="community"
        uploadStartedCallback={() => {
          state.uploadInProgress = true;
          m.redraw();
        }}
        uploadCompleteCallback={(files) => {
          files.forEach((f) => {
            if (!f.uploadURL) return;
            const url = f.uploadURL.replace(/\?.*/, '');
            state.iconUrl = url;
          });
          state.uploadInProgress = false;
          m.redraw();
        }}
      />
    </div>,
    <InputRow
      title="Icon URL"
      disabled={disabled}
      value={state.iconUrl}
      placeholder="https://"
      onChangeHandler={(v) => {
        state.iconUrl = v;
      }}
    />,
    <InputRow
      title="Website"
      disabled={disabled}
      value={state.website}
      placeholder="https://example.com"
      onChangeHandler={(v) => {
        state.website = v;
        mixpanelBrowserTrack({
          event: MixpanelCommunityCreationEvent.WEBSITE_ADDED,
          chainBase: this.state.form.base,
          isCustomDomain: app.isCustomDomain(),
          communityType: null, // TODO: Find a way for this to be accessed?
        });
      }}
    />,
    <InputRow
      title="Discord"
      disabled={disabled}
      value={state.discord}
      placeholder="https://discord.com/invite"
      onChangeHandler={(v) => {
        state.discord = v;
      }}
    />,
    <InputRow
      title="Element"
      disabled={disabled}
      value={state.element}
      placeholder="https://matrix.to/#"
      onChangeHandler={(v) => {
        state.element = v;
      }}
    />,
    <InputRow
      title="Telegram"
      disabled={disabled}
      value={state.telegram}
      placeholder="https://t.me"
      onChangeHandler={(v) => {
        state.telegram = v;
      }}
    />,
    <InputRow
      title="Github"
      disabled={disabled}
      value={state.github}
      placeholder="https://github.com"
      onChangeHandler={(v) => {
        state.github = v;
      }}
    />,
  ];
}

type EthChainState = EthFormFields & ChainFormState;

export const ethChainRows = (attrs: EthChainAttrs, state: EthChainState) => {
  const options = [
    ...Object.keys(attrs.ethChains).map(
      (c) =>
        ({
          label: attrs.ethChainNames[c],
          value: attrs.ethChainNames[c],
        } || { label: c, value: c })
    ),
    app?.user.isSiteAdmin ? { label: 'Custom', value: 'Custom' } : {},
  ] as Array<DropdownItemType>;

  return [
    <CWDropdown
      label="Chain"
      options={options}
      onSelect={(o) => {
        state.chainString = o.value;
        if (o.value !== 'Custom') {
          const [id] =
            Object.entries(attrs.ethChainNames).find(
              ([, name]) => name === o.value
            ) ||
            Object.keys(attrs.ethChains).find((cId) => `${cId}` === o.value);
          state.ethChainId = id;
          state.nodeUrl = attrs.ethChains[id].url;
          state.altWalletUrl = attrs.ethChains[id].alt_wallet_url;
        } else {
          state.ethChainId = '';
          state.nodeUrl = '';
          state.altWalletUrl = '';
        }
        state.loaded = false;
        mixpanelBrowserTrack({
          event: MixpanelCommunityCreationEvent.CHAIN_SELECTED,
          chainBase: o.value,
          isCustomDomain: app.isCustomDomain(),
          communityType: CommunityType.Erc20Community,
        });
      }}
    />,
    state.chainString === 'Custom' && (
      <InputRow
        title="Chain ID"
        value={state.ethChainId}
        placeholder="1"
        onChangeHandler={async (v) => {
          state.ethChainId = v;
          state.loaded = false;
        }}
      />
    ),
    state.chainString === 'Custom' && (
      <InputRow
        title="Websocket URL"
        value={state.nodeUrl}
        placeholder="wss://... (leave empty for default)"
        onChangeHandler={async (v) => {
          state.nodeUrl = v;
          state.loaded = false;
        }}
      />
    ),
    state.chainString === 'Custom' && (
      <InputRow
        title="HTTP URL"
        value={state.altWalletUrl}
        placeholder="https://...  (leave empty for default)"
        onChangeHandler={async (v) => {
          state.altWalletUrl = v;
          state.loaded = false;
        }}
      />
    ),
    <InputRow
      title="Address"
      value={state.address}
      placeholder="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
      onChangeHandler={(v) => {
        state.address = v;
        state.loaded = false;
        mixpanelBrowserTrack({
          event: MixpanelCommunityCreationEvent.ADDRESS_ADDED,
          chainBase: ChainBase.Ethereum,
          isCustomDomain: app.isCustomDomain(),
          communityType: null,
        });
      }}
    />,
  ];
};
