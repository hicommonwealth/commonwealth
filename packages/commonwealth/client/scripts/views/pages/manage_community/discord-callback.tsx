import { useCommonNavigate } from 'navigation/helpers';
import { PageLoading } from '../loading';
import React from 'react';
import { PageNotFound } from '../404';

const DiscordCallbackPage = () => {
  const navigate = useCommonNavigate();

  const params = new URLSearchParams(window.location.search);
  const state = params.get('state');

  if (!state) {
    return <PageNotFound message="No callback data provided." />;
  }
  const stateJSON = JSON.parse(decodeURI(state));

  console.log('DiscordCallbackPage', stateJSON);

  // Payable functions are not supported in this implementation
  return <PageLoading message="Connecting Discord" />;
};

export default DiscordCallbackPage;
