import 'components/commonwealth/action_card.scss';

import BN from 'bn.js';
import m from 'mithril';
import { CMNProject } from 'models';

import InProgressActionCard from './inprogress_action';
import SuccsedActionCard from './successed_action';
import FailedActionCard from './failed_action';
import { CWUser } from '../members_card';

const ActionCard: m.Component<{
  project: CMNProject,
  project_protocol: any,
  curators: any,
  backers: any,
},
{
  amount: any,
  error: string,
  submitting: boolean
}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.amount = 0;
    vnode.state.submitting = false;
  },
  view: (vnode) => {
    const { project, project_protocol, curators, backers } = vnode.attrs;

    const totalFunding = new BN(project.totalFunding.toString()).div(new BN(100000000)).toNumber();
    const threshold = new BN(project.threshold.toString()).div(new BN(100000000)).toNumber();

    let percent = '0';
    if (threshold !== 0 && totalFunding !== 0) {
      percent = (100 * (totalFunding / threshold)).toFixed(2);
      if (parseInt(percent, 10) > 100) percent = '100';
    }

    return m('.row .content-area', [
      m('.col-lg-12 .action-card', [
        m('.action-title', [
          m('span.amount', `${totalFunding} / ${threshold}`),
          m('span.coin', ' in USD dollar')
        ]),
        m('.project-progress', [
          m('.project-progress-bar', [
            m('.project-progress-bar-fill', {
              style: `width: ${percent}%`
            }),
          ]),
        ]),
        project.status === 'In Progress' && m(InProgressActionCard, {
          project,
          project_protocol,
        }),
        project.status === 'Successed' && m(SuccsedActionCard, {
          project,
          project_protocol,
          curators
        }),
        project.status === 'Failed' && m(FailedActionCard, {
          project,
          project_protocol,
          backers
        }),
      ])
    ]);
  }
};

export default ActionCard;
