import { useState } from 'react';

import type { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import type {
  EthCommunityNamesType,
  EthCommunityType,
  UseCommunityFormDefaultFieldsHookType,
  UseCommunityFormIdFieldsHookType,
  UseCommunityFormStateHookType,
  UseEthCommunityFormFieldsHookType,
  UseEthCommunityFormStateHookType,
} from './types';

export const useCommunityFormIdFields =
  (): UseCommunityFormIdFieldsHookType => {
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [communityName, setCommunityName] = useState('');
    const [symbol, setSymbol] = useState('XYZ');

    return {
      id,
      name,
      communityName,
      setId,
      setName,
      setCommunityName,
      setSymbol,
      symbol,
    };
  };

export const useCommunityFormDefaultFields =
  (): UseCommunityFormDefaultFieldsHookType => {
    const [description, setDescription] = useState('');
    const [discord, setDiscord] = useState('');
    const [element, setElement] = useState('');
    const [github, setGithub] = useState('');
    const [iconUrl, setIconUrl] = useState('');
    const [telegram, setTelegram] = useState('');
    const [uploadInProgress, setUploadInProgress] = useState(false);
    const [website, setWebsite] = useState('');

    return {
      description,
      discord,
      element,
      github,
      iconUrl,
      setDescription,
      setDiscord,
      setElement,
      setGithub,
      setIconUrl,
      setTelegram,
      setUploadInProgress,
      setWebsite,
      telegram,
      uploadInProgress,
      website,
    };
  };

export const useCommunityFormState = (): UseCommunityFormStateHookType => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<ValidationStatus | undefined>(undefined);

  return {
    loaded,
    setLoaded,
    loading,
    setLoading,
    saving,
    setSaving,
    message,
    setMessage,
    status,
    setStatus,
  };
};

export const useEthCommunityFormState =
  (): UseEthCommunityFormStateHookType => {
    const [ethCommunities, setEthCommunities] = useState<EthCommunityType>({});
    const [ethCommunityNames, setEthCommunityNames] =
      useState<EthCommunityNamesType>({});

    return {
      ethCommunities,
      setEthCommunities,
      ethCommunityNames,
      setEthCommunityNames,
    };
  };

export const useEthCommunityFormFields =
  (): UseEthCommunityFormFieldsHookType => {
    const [address, setAddress] = useState('');
    const [altWalletUrl, setAltWalletUrl] = useState('');
    const [communityString, setCommunityString] = useState('');
    const [ethCommunityId, setEthCommunityId] = useState('');
    const [nodeUrl, setNodeUrl] = useState('');

    return {
      address,
      altWalletUrl,
      communityString,
      ethCommunityId,
      nodeUrl,
      setAddress,
      setAltWalletUrl,
      setCommunityString,
      setEthCommunityId,
      setNodeUrl,
    };
  };
