/* @jsx m */

import { formatCoin } from 'adapters/currency';
import { navigateToSubpage } from 'app';
import ClassComponent from 'class_component';
import { ChainBase, ProposalType } from 'common-common/src/types';
import type Substrate from 'controllers/chain/substrate/adapter';
import type { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import m from 'mithril';

import 'pages/tips.scss';

import app from 'state';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import { ProposalCard } from 'views/components/proposal_card';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CardsCollection } from '../components/cards_collection';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { GovExplainer } from '../components/gov_explainer';
import User from '../components/widgets/user';
import ErrorPage from './error';

type TipAttrs = {
  proposal: SubstrateTreasuryTip;
};

class Tip extends ClassComponent<TipAttrs> {
  view(vnode: m.Vnode<TipAttrs>) {
    const { proposal } = vnode.attrs;
    const beneficiary = app.chain.accounts.get(proposal.data.who);

    return (
      <div class="TipDetail">
        <div class="tip-detail-group">
          <CWText
            fontWeight="medium"
            type="caption"
            className="reason-header-text"
          >
            Reason
          </CWText>
          <CWText
            className="reason-text"
            type="caption"
            title={proposal.data.reason}
          >
            {proposal.data.reason}
          </CWText>
        </div>
        <div class="tip-detail-group">
          <CWText
            fontWeight="medium"
            type="caption"
            className="reason-header-text"
          >
            Beneficiary
          </CWText>
          {m(User, {
            user: beneficiary,
            popover: true,
            showAddressWithDisplayName: true,
          })}
        </div>
      </div>
    );
  }
}

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [chain.treasury, chain.tips];
  } else {
    throw new Error('invalid chain');
  }
}

class TipsPage extends ClassComponent {
  view() {
    const activeAccount = app.user.activeAccount;

    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage
            message="Chain connection timed out"
            title={<BreadcrumbsTitleTag title="Tips" />}
          />
        );
      }

      return (
        <PageLoading
          message="Connecting to chain"
          // title={<BreadcrumbsTitleTag title="Tips" />}
        />
      );
    }

    const modLoading = loadSubstrateModules('Tips', getModules);

    if (modLoading) return modLoading;

    const activeTips = (app.chain as Substrate).tips.store
      .getAll()
      .filter((p) => !p.completed);

    const inactiveTips = (app.chain as Substrate).tips.store
      .getAll()
      .filter((p) => p.completed);

    const activeTipContent = activeTips.length ? (
      activeTips.map((tip) => (
        <ProposalCard proposal={tip} injectedContent={<Tip proposal={tip} />} />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

    const inactiveTipContent = inactiveTips.length ? (
      inactiveTips.map((tip) => (
        <ProposalCard proposal={tip} injectedContent={<Tip proposal={tip} />} />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Tips" />}
      >
        <div class="TipsPage">
          <GovExplainer
            statHeaders={[
              {
                statName: 'Tips',
                statDescription: `are rewards paid by the treasury without first \
                having a pre-determined stakeholder group come to consensus on payment amount.`,
              },
            ]}
            stats={[
              {
                statHeading: 'Treasury:',
                stat:
                  app.chain &&
                  formatCoin((app.chain as Substrate).treasury.pot),
              },
            ]}
            statAction={
              activeAccount && (
                <CWButton
                  onclick={() =>
                    navigateToSubpage('/new/proposal/:type', {
                      type: ProposalType.SubstrateTreasuryTip,
                    })
                  }
                  label="New tip"
                />
              )
            }
          />
          <CardsCollection content={activeTipContent} header="Active Tips" />
          <CardsCollection
            content={inactiveTipContent}
            header="Inactive Tips"
          />
        </div>
      </Sublayout>
    );
  }
}

export default TipsPage;
