import { useState } from 'react';

import type { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import type {
  EthChainNamesType,
  EthChainsType,
  UseCommunityFormDefaultFieldsHookType,
  UseCommunityFormIdFieldsHookType,
  UseCommunityFormStateHookType,
  UseEthCommunityFormFieldsHookType,
  UseEthCommunityFormStateHookType,
} from './types';

export const useCommunityFormIdFields = (): UseCommunityFormIdFieldsHookType => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [chainName, setChainName] = useState('');
  const [symbol, setSymbol] = useState('XYZ');

  return {
    id,
    name,
    chainName,
    setId,
    setName,
    setChainName,
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

export const useEthCommunityFormState = (): UseEthCommunityFormStateHookType => {
  const [ethChains, setEthChains] = useState<EthChainsType>({});
  const [ethChainNames, setEthChainNames] = useState<EthChainNamesType>({});

  return {
    ethChains,
    setEthChains,
    ethChainNames,
    setEthChainNames,
  };
};

export const useEthCommunityFormFields = (): UseEthCommunityFormFieldsHookType => {
  const [address, setAddress] = useState('');
  const [altWalletUrl, setAltWalletUrl] = useState('');
  const [chainString, setChainString] = useState('');
  const [ethChainId, setEthChainId] = useState('');
  const [nodeUrl, setNodeUrl] = useState('');

  return {
    address,
    altWalletUrl,
    chainString,
    ethChainId,
    nodeUrl,
    setAddress,
    setAltWalletUrl,
    setChainString,
    setEthChainId,
    setNodeUrl,
  };
};
