import React from 'react';

import { ClassComponent, ResultNode} from

 'mithrilInterop';
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
import PageNotFound from '../404';
import { AaveProposalForm } from './aave_proposal_form';
import { CompoundProposalForm } from './compound_proposal_form';
import { CosmosProposalForm } from './cosmos_proposal_form';
import { SputnikProposalForm } from './sputnik_proposal_form';
import { SubstrateDemocracyProposalForm } from './substrate_democracy_proposal_form';
import { SubstrateTreasuryProposalForm } from './substrate_treasury_proposal_form';
import { SubstrateTreasuryTipForm } from './substrate_treasury_tip_form';

type NewProposalPageAttrs = {
  type: ProposalType;
};

class NewProposalPage extends ClassComponent<NewProposalPageAttrs> {
  private typeEnum: ProposalType;

  view(vnode: ResultNode<NewProposalPageAttrs>) {
    this.typeEnum = vnode.attrs.type;

    // wait for chain
    if (app.chain?.failed) {
      return (
        <PageNotFound
          title="Wrong Ethereum Provider Network!"
          message="Change Metamask to point to Ethereum Mainnet"
        />
      );
    }

    if (!app.chain || !app.chain.loaded || !app.chain.meta) {
      return <PageLoading />;
    }

    // infer proposal type if possible
    if (!this.typeEnum) {
      try {
        this.typeEnum = chainToProposalSlug(app.chain.meta);
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
    const c = proposalSlugToClass().get(this.typeEnum) as ProposalModule<
      any,
      any,
      any
    >;

    if (!c.ready) {
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
        case ProposalType.SubstrateDemocracyProposal:
          return <SubstrateDemocracyProposalForm />;
        case ProposalType.SubstrateTreasuryProposal:
          return <SubstrateTreasuryProposalForm />;
        case ProposalType.SubstrateTreasuryTip:
          return <SubstrateTreasuryTipForm />;
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
        return getForm(this.typeEnum);
      }
    };

    return (
      <Sublayout>
        <div className="NewProposalPage">
          <CWText type="h3" fontWeight="medium">
            New {proposalSlugToFriendlyName.get(this.typeEnum)}
          </CWText>
          {getBody()}
        </div>
      </Sublayout>
    );
  }
}

export default NewProposalPage;
