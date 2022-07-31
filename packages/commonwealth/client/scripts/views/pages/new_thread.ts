/* eslint-disable @typescript-eslint/ban-types */

import m, { VnodeDOM } from 'mithril';
import _ from 'lodash';
import app from 'state';
import { navigateToSubpage } from 'app';
import { notifyInfo } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { NewThreadForm } from '../components/new_thread_form';

const NewThreadPage: m.Component<{}> = {
  oncreate: (vnode: VnodeDOM) => {},
  view: (vnode: VnodeDOM) => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to log in first');
      navigateToSubpage('/login');
      return;
    }

    const activeEntity = app.chain;
    if (!activeEntity) return m(PageLoading);

    const hasTopics = !!app.chain?.meta.topics.length;

    return m(
      Sublayout,
      {
        class: 'NewThreadPage',
        title: 'New Thread',
      },
      [
        m('.forum-container', [
          m(NewThreadForm, {
            isModal: false,
            hasTopics,
          }),
        ]),
      ]
    );
  },
};

export default NewThreadPage;
