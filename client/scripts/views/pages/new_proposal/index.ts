import 'pages/new_proposal_page.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import { slugify } from 'helpers';
import { ProposalType, proposalSlugToFriendlyName } from 'identifiers';
import { CompactModalExitButton } from 'views/modal';
import NewProposalForm from './new_proposal_form';

const NewProposalPage = {
  oncreate: (vnode) => {
    vnode.state.typeEnum = vnode.attrs.type;
    vnode.state.titlePre = 'Create';
  },
  view: (vnode) => {
    return m('.NewProposalPage', [
      m('.compact-modal-title', [
        m('h3', `${vnode.state.titlePre} ${proposalSlugToFriendlyName.get(vnode.state.typeEnum)}`),
      ]),
      m(NewProposalForm, {
        typeEnum: vnode.attrs.type,
        onChangeSlugEnum: (value) => {
          if (value !== 'proposal') {
            vnode.state.titlePre = 'Note';
          } else {
            vnode.state.titlePre = 'Create';
          }

          vnode.state.typeEnum = `democracy${value}`;
          m.redraw();
        },
        callback: (proposal) => {
          $(vnode.dom).trigger('modalforceexit');
          if (proposal && vnode.attrs.type !== ProposalType.PhragmenCandidacy) {
            mixpanel.track('Create Thread', {
              'Step No': 3,
              'Step' : 'Transaction Signed',
              'Thread Type': 'Proposal',
              'ProposalID': proposal.slug,
              'Scope': app.activeId(),
              'user' : app.vm.activeAccount.address,
            });
            mixpanel.people.increment('Thread');
            mixpanel.people.set({
              'Last Thread Created': new Date().toISOString()
            });
          }
        }
      }),
    ]);
  }
};

export default NewProposalPage;
