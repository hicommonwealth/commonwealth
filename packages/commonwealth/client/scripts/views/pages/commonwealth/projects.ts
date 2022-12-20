import 'pages/commonwealth/projects.scss';

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';
import moment from 'moment';
import { Card, Button } from 'construct-ui';

import app from 'state';
import { AddressInfo } from 'models';

import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';

interface CWProjectStub {
  title: string;
  description: string;
  beneficiary_address: string;
  beneficiary_chain: string;
  curator_count: number;
  curator_amount: number;
  curator_required: number;
  backer_count: number;
  backer_amount: number;
  backer_required: number;
  created_at: Date;
  expires_at: Date;
}

const PROJECTS: CWProjectStub[] = [
  {
    title: 'Carbon Dollar',
    description:
      'Launch a decentralized, algorithmically stabilized coin for speculating on the price of carbon',
    beneficiary_address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
    beneficiary_chain: 'commonwealth',
    curator_count: 2,
    curator_amount: 10,
    curator_required: 10,
    backer_count: 2,
    backer_amount: 36.54,
    backer_required: 100,
    created_at: moment().subtract(20, 'days').toDate(),
    expires_at: moment().add(34, 'hours').toDate(),
  },
];

const ProjectsPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      return render(PageLoading, {
        message: 'Connecting to chain',
      });
    }

    return render(
      Sublayout,
      render('.ProjectsPage', [
        PROJECTS.map((project) => {
          return render(
            Card,
            {
              size: 'lg',
              elevation: 0,
            },
            [
              render('h4', project.title),
              render('.project-description', project.description),
              render('.project-metadata', [
                render('.project-metadata-beneficiary', [
                  render(User, {
                    user: new AddressInfo(
                      null,
                      project.beneficiary_address,
                      project.beneficiary_chain,
                      null
                    ),
                  }),
                ]),
                render('.project-metadata-created', [
                  'Created ',
                  moment(Date.now()).diff(project.created_at, 'days'),
                  ' days ago',
                ]),
              ]),
              // backing progress
              render('.project-metrics', [
                render('.project-metric', [
                  render(
                    '.project-metric-figure',
                    `${project.curator_amount.toFixed(1)} ETH`
                  ),
                  render('.project-metric-title', 'Curating'),
                ]),
                render('.project-metric', [
                  render(
                    '.project-metric-figure',
                    `${project.backer_amount.toFixed(1)} ETH`
                  ),
                  render('.project-metric-title', 'Backing'),
                ]),
                // render('.project-metric', [
                //   render('.project-metric-figure', project.backer_count),
                //   render('.project-metric-title', 'Backers'),
                // ]),
              ]),
              render('.project-progress', [
                render('.project-progress-bar', [
                  render('.project-progress-bar-fill', {
                    style: `width: ${(
                      100 *
                      (project.backer_amount / project.backer_required)
                    ).toFixed(1)}%`,
                  }),
                ]),
                render('.project-progress-text', [
                  render('.project-progress-text-left', [
                    `${(
                      100 *
                      (project.backer_amount / project.backer_required)
                    ).toFixed(1)}% of the minimum reached`,
                  ]),
                  render('.project-progress-text-right', [
                    moment(Date.now()).diff(project.expires_at, 'days'),
                    ' days left',
                  ]),
                ]),
              ]),
              render('.project-funding-action', [
                render(Button, {
                  class: 'contribute-button',
                  label: 'Contribute',
                  rounded: true,
                  fluid: true,
                  intent: 'primary',
                  onclick: (e) => {
                    // TODO
                  },
                }),
                render(Button, {
                  class: 'more-info-button',
                  label: 'More info',
                  rounded: true,
                  fluid: true,
                  onclick: (e) => {
                    // TODO
                  },
                }),
              ]),
            ]
          );
        }),
      ])
    );
  },
};

export default ProjectsPage;
