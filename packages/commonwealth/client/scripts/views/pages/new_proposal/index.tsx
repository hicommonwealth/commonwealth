/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_proposal_page.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalType } from 'common-common/src/types';
import {
  proposalSlugToClass,
  proposalSlugToFriendlyName,
  chainToProposalSlug,
} from 'identifiers';
import { ProposalModule } from 'models';
import { NewProposalForm } from 'views/pages/new_proposal/new_proposal_form';
import { PageNotFound } from '../404';
import { CWText } from '../../components/component_kit/cw_text';

type NewProposalPageAttrs = {
  type: string;
};

class NewProposalPage extends ClassComponent<NewProposalPageAttrs> {
  private titlePre: string;
  private typeEnum;

  view(vnode: m.Vnode<NewProposalPageAttrs>) {
    this.typeEnum = vnode.attrs.type;
    this.titlePre = 'New';

    // auto-redirect to the new thread page if sent here accidentally
    if (this.typeEnum === ProposalType.Thread) {
      navigateToSubpage('/new/discussion');
    }

    // wait for chain
    if (app.chain?.failed)
      return (
        <PageNotFound
          title="Wrong Ethereum Provider Network!"
          message="Change Metamask to point to Ethereum Mainnet"
        />
      );
    if (!app.chain || !app.chain.loaded || !app.chain.meta)
      return <PageLoading />;

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

    return (
      <Sublayout>
        <div class="NewProposalPage">
          <CWText>
            {this.titlePre} {proposalSlugToFriendlyName.get(this.typeEnum)}
          </CWText>
          <NewProposalForm
            typeEnum={this.typeEnum}
            onChangeSlugEnum={(value) => {
              this.titlePre = value !== 'proposal' ? 'Note' : 'New';
              this.typeEnum = `democracy${value}`;
              m.redraw();
            }}
          />
        </div>
      </Sublayout>
    );
  }
}

export default NewProposalPage;
