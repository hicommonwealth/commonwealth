import 'modals/profile_filter_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from '../../state';
import { OffchainThreadStage } from '../../models/types';
import { offchainThreadStageToLabel, parseCustomStages } from '../../helpers';

const ProfileFilterModal = {
  view: (vnode) => {
    const topics = app.topics.getByCommunity(app.activeId());
    const { customStages } = app.chain?.meta?.chain || app.community?.meta;
    const stages = !customStages ? [
      OffchainThreadStage.Discussion,
      OffchainThreadStage.ProposalInReview,
      OffchainThreadStage.Voting,
      OffchainThreadStage.Passed,
      OffchainThreadStage.Failed
    ] : parseCustomStages(customStages);

    return m('.ProfileFilterModal', [
      m('.flex', [
        m('.pt-8.px-8', [
          m('.title.flex.items-baseline.space-x-2', [
            m('', 'All'),
            m('img', { src:'/static/img/arrow-right-black.svg' }),
            m('', 'Filtered By'),
          ]),
          m('.flex.justify-between', [
            m('.pr-6', [
              m('.sub-heading', 'Discussion'),
              m('button', 'Threads'),
              m('button', 'Comments'),
              m('button', 'Reactions'),
            ]),
            m('.pr-6', [
              m('.sub-heading', 'Category'),
              m('.grid.grid-cols-2', [
                topics.map(({ id, name }) => m('button.mr-3', { key:id }, name)),
              ]),
            ]),
            m('.pr-6', [
              m('.sub-heading', 'Stage'),
              stages.map((targetStage) => m('button', offchainThreadStageToLabel(targetStage))),
            ]),
            m('.pr-6', [
              m('.sub-heading', 'Range'),
              m('button', 'Past Week'),
              m('button', 'Past Month'),
              m('button', 'Past 3 Months'),
            ]),
          ]),
        ]),
        m('.pt-8.px-8.border-l.gray-border', [
          m('.title', 'Sorted By'),
          m('button', 'Newest First'),
          m('button', 'Oldest First'),
        ]),
        m('img.h-6.w-6.mt-6.mr-6.opacity-50.cursor-pointer', {
          src:'/static/img/close.svg',
          onclick:() => {
            $(vnode.dom).trigger('modalforceexit');
            m.redraw();
          }
        }),
      ]),
      m('.pt-4.flex.justify-end.border-t.gray-border', [
        m('button.mb-4.mr-4.uppercase.font-medium', 'Cancel'),
        m('button.mb-4.mr-4.uppercase.font-medium', 'Apply'),
      ]),
    ]);
  }
};

export default ProfileFilterModal;
