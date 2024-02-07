import { ChainNetwork, ProposalType } from '@hicommonwealth/core';
import useForceRerender from 'hooks/useForceRerender';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import {
  chainToProposalSlug,
  proposalSlugToClass,
  proposalSlugToFriendlyName,
} from 'identifiers';
import 'pages/new_proposal/index.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { PageLoading } from 'views/pages/loading';
import type ProposalModule from '../../../models/ProposalModule';
import { CWText } from '../../components/component_kit/cw_text';
import { PageNotFound } from '../404';
import { AaveProposalForm } from './aave_proposal_form';
import { CompoundProposalForm } from './compound_proposal_form';
import { CosmosProposalForm } from './cosmos_proposal_form';
import { SputnikProposalForm } from './sputnik_proposal_form';

type NewProposalPageProps = {
  type: ProposalType;
};

const NewProposalPage = (props: NewProposalPageProps) => {
  const { type } = props;
  const forceRerender = useForceRerender();
  const [internalType, setInternalType] = useState<ProposalType>(type);
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

  // infer proposal type if possible
  if (!internalType) {
    try {
      setInternalType(chainToProposalSlug(app.chain.meta));
    } catch (e) {
      return (
        <PageNotFound
          title="Invalid Page"
          message="Cannot determine proposal type."
        />
      );
    }
  }

  // check if module is still initializing
  const c = proposalSlugToClass()?.get(internalType) as ProposalModule<
    any,
    any,
    any
  >;

  if (!c || !c.ready) {
    app.chain.loadModules([c]);
    return <PageLoading />;
  }

  const getForm = (typeEnum) => {
    switch (typeEnum) {
      case ProposalType.AaveProposal:
        return <AaveProposalForm />;
      case ProposalType.CompoundProposal:
        return <CompoundProposalForm />;
      case ProposalType.CosmosProposal:
        return <CosmosProposalForm />;
      case ProposalType.SputnikProposal:
        return <SputnikProposalForm />;
      default:
        return <CWText>Invalid proposal type</CWText>;
    }
  };

  const getBody = () => {
    if (!app.user.activeAccount) {
      return <CWText>Must be signed in</CWText>;
    } else if (app.chain?.network === ChainNetwork.Plasm) {
      return <CWText>Feature not supported yet for this community</CWText>;
    } else {
      return getForm(internalType);
    }
  };

  return (
    <div className="NewProposalPage">
      <CWText type="h3" fontWeight="medium">
        New {proposalSlugToFriendlyName.get(internalType)}
      </CWText>
      {getBody()}
    </div>
  );
};

export default NewProposalPage;
