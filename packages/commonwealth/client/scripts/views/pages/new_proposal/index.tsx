import { ChainBase } from '@hicommonwealth/shared';
import useForceRerender from 'hooks/useForceRerender';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import 'pages/new_proposal/index.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { userStore } from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageLoading } from 'views/pages/loading';
import { CWText } from '../../components/component_kit/cw_text';
import { PageNotFound } from '../404';
import { CosmosProposalForm } from './cosmos_proposal_form';

/// NOTE: THIS PAGE IS ONLY ACCESSIBLE FOR COSMOS CHAINS, FOLLOWING
/// DEPRECATION OF OTHER GOVERNANCE FORMS, AND IS CONSIDERED LEGACY.

const NewProposalPage = () => {
  const forceRerender = useForceRerender();
  const [isLoaded, setIsLoaded] = useState(app.chain?.loaded);
  useInitChainIfNeeded(app);

  useEffect(() => {
    app.runWhenReady(() => {
      setIsLoaded(app.chain.loaded);
    });
  }, []);

  useEffect(() => {
    app.loginStateEmitter.on('redraw', forceRerender);

    return () => {
      app.loginStateEmitter.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  // wait for chain
  if (app.chain?.failed) {
    return (
      <PageNotFound
        title="Wrong Ethereum Provider Network!"
        message="Change Metamask to point to Ethereum Mainnet"
      />
    );
  }

  if (!app.chain || !isLoaded || !app.chain.meta) {
    return <PageLoading />;
  }

  // special case for initializing cosmos governance
  const onCosmos = app.chain?.base === ChainBase.CosmosSDK;
  if (onCosmos) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const governance = (app.chain as any)?.governance;
    if (governance && !governance.ready) {
      if (!governance.initializing) {
        governance.init(app.chain.chain, app.chain.accounts).then(() => {
          app.chainModuleReady.emit('ready');
        });
      }
      return <PageLoading />;
    }
  } else {
    return <PageNotFound />;
  }

  const getBody = () => {
    if (!userStore.getState().activeAccount) {
      return <CWText>Must be signed in</CWText>;
    } else {
      return <CosmosProposalForm />;
    }
  };

  return (
    <CWPageLayout>
      <div className="NewProposalPage">
        <CWText type="h3" fontWeight="medium">
          New Proposal
        </CWText>
        {getBody()}
      </div>
    </CWPageLayout>
  );
};

export default NewProposalPage;
