import React, { useEffect, useState } from 'react';

import { ChainNetwork, ProposalType } from 'common-common/src/types';
import {
  chainToProposalSlug,
  proposalSlugToClass,
  proposalSlugToFriendlyName,
} from 'identifiers';
import type { ProposalModule } from 'models';

import 'pages/new_proposal/index.scss';

import app from 'state';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
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
  const [internalType, setInternalType] = React.useState<ProposalType>(type);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    app.chainModuleReady.once('ready', () => {
      setLoaded(app.chain.loaded);
    });
  }, [app.chain.loaded]);

  // wait for chain
  if (app.chain?.failed) {
    return (
      <PageNotFound
        title="Wrong Ethereum Provider Network!"
        message="Change Metamask to point to Ethereum Mainnet"
      />
    );
  }

  if (!app.chain || !loaded || !app.chain.meta) {
    return <PageLoading />;
  }
  console.log('internalType', internalType);

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

  console.log('app.chain.loaded', app.chain.loaded);

  // check if module is still initializing
  const c = proposalSlugToClass()?.get(internalType) as ProposalModule<
    any,
    any,
    any
  >;

  console.log('c', c);

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
      return <CWText>Must be logged in</CWText>;
    } else if (app.chain?.network === ChainNetwork.Plasm) {
      return <CWText>Unsupported network</CWText>;
    } else {
      return getForm(internalType);
    }
  };

  return (
    <Sublayout>
      <div className="NewProposalPage">
        <CWText type="h3" fontWeight="medium">
          New {proposalSlugToFriendlyName.get(internalType)}
        </CWText>
        {getBody()}
      </div>
    </Sublayout>
  );
};

export default NewProposalPage;
