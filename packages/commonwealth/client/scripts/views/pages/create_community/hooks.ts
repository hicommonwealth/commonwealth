import { useState } from 'react';

import type { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import type {
  EthChainNamesType,
  EthChainsType,
  UseChainFormDefaultFieldsHookType,
  UseChainFormIdFieldsHookType,
  UseChainFormStateHookType,
  UseEthChainFormFieldsHookType,
  UseEthChainFormStateHookType,
} from './types';

export const useChainFormIdFields = (): UseChainFormIdFieldsHookType => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('XYZ');

  return {
    id,
    name,
    setId,
    setName,
    setSymbol,
    symbol,
  };
};

export const useChainFormDefaultFields =
  (): UseChainFormDefaultFieldsHookType => {
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

export const useChainFormState = (): UseChainFormStateHookType => {
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

export const useEthChainFormState = (): UseEthChainFormStateHookType => {
  const [ethChains, setEthChains] = useState<EthChainsType>({});
  const [ethChainNames, setEthChainNames] = useState<EthChainNamesType>({});

  return {
    ethChains,
    setEthChains,
    ethChainNames,
    setEthChainNames,
  };
};

export const useEthChainFormFields = (): UseEthChainFormFieldsHookType => {
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
