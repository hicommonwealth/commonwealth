/* @jsx jsx */
import React from 'react';

import type { SubstrateCoin } from 'adapters/chain/substrate/types';
import { ChainBase } from 'common-common/src/types';
import type Substrate from 'controllers/chain/substrate/adapter';
import { externalLink, pluralize } from 'helpers';
import { AddressInfo } from 'models';
import type { ResultNode} from 'mithrilInterop';
import { ClassComponent, redraw, jsx } from 'mithrilInterop';
import 'pages/validators.scss';

import app from 'state';
import { User } from 'views/components/user/user';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CardsCollection } from '../components/cards_collection';
import { CWCard } from '../components/component_kit/cw_card';
import { CWText } from '../components/component_kit/cw_text';
import { GovExplainer } from '../components/gov_explainer';

type ValidatorType = {
  chain: string;
  commission: any;
  controller: string;
  isElected: boolean;
  nominators: number;
  own: SubstrateCoin;
  stash: string;
  total: SubstrateCoin;
};

type ValidatorAttrs = {
  info: ValidatorType;
};

class Validator extends ClassComponent<ValidatorAttrs> {
  view(vnode: ResultNode<ValidatorAttrs>) {
    const { info } = vnode.attrs;

    return (
      <CWCard className="ValidatorCard">
        <div className="user-and-nominator">
          <User
            user={new AddressInfo(null, info.stash, info.chain, null)}
            popover
            hideIdentityIcon
          />
          <CWText type="caption" fontWeight="medium">
            {`${info.total?.format(true)} from ${pluralize(
              info.nominators,
              'nominator'
            )}`}
          </CWText>
        </div>
        {info.commission && (
          <CWText
            type="caption"
            className="commission-text"
          >{`${info.commission} commission`}</CWText>
        )}
      </CWCard>
    );
  }
}

class ValidatorsPage extends ClassComponent {
  private validators;
  private totalStaked;
  private validatorsInitialized: boolean;

  view() {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage
            message="Could not connect to chain"
            title={<BreadcrumbsTitleTag title="Validators" />}
          />
        );
      }

      return (
        <PageLoading
          message="Connecting to chain"
          // title={<BreadcrumbsTitleTag title="Validators" />}
        />
      );
    }

    if (
      app.chain?.base === ChainBase.Substrate &&
      app.chain.apiInitialized &&
      !this.validatorsInitialized
    ) {
      (app.chain as Substrate).accounts.getValidators().then((result) => {
        this.validators = result;

        // calculate total staked
        this.totalStaked = (app.chain as Substrate).chain.coins(0);
        (result as any).forEach((va) => {
          this.totalStaked = (app.chain as Substrate).chain.coins(
            this.totalStaked.asBN.add(va.total.asBN)
          );
        });
      });
      // TODO: handle error fetching vals
      this.validatorsInitialized = true;
      redraw();
    }

    const validators = this.validators;

    if (!validators) {
      return (
        <PageLoading
          message="Loading validators"
          // title={<BreadcrumbsTitleTag title="Validators" />}
        />
      );
    }

    const sort = 'amount';
    // also: nominators, return

    const validatorCards = (
      sort === 'amount'
        ? validators?.sort((a, b) => b.total?.toString() - a.total?.toString())
        : sort === 'nominators'
        ? validators?.sort((a, b) => b.nominators - a.nominators)
        : validators?.sort((a, b) => b.expectedReturn - a.expectedReturn)
    ).map((info) => <Validator info={info} />);

    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Validators" />}
      >
        <div className="ValidatorsPage">
          <GovExplainer
            statHeaders={[
              {
                statName: 'Validators',
                statDescription: `are responsible for producing blocks and securing the network. \
            Nominate validators to receive staking rewards.`,
              },
            ]}
            stats={[
              {
                statHeading: 'Validators:',
                stat: validators?.length,
              },
              {
                statHeading: 'Total Staked:',
                stat: `${this.totalStaked.format(true)} / 
            ${(app.chain as Substrate).chain.totalbalance.format(true)}`,
              },
            ]}
            statAction={
              app.chain?.meta?.node.url &&
              externalLink(
                'a',
                `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(
                  app.chain?.meta?.node.url
                )}#/staking`,
                'Nominate on polkadot-js'
              )
            }
          />
          <CardsCollection content={validatorCards} header="Validators" />
        </div>
      </Sublayout>
    );
  }
}

export default ValidatorsPage;
