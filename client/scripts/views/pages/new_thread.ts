import 'pages/new_thread.scss';

import m from 'mithril';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import { notifyInfo } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import { NewThreadForm } from '../components/new_thread_form';

const NewThreadPage: m.Component = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'NewThreadPage' });
  },
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to log in first');
      m.route.set(`/${app.activeChainId()}/login`);
      return;
    }

    const author = app.vm.activeAccount;
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading);

    return m(Sublayout, {
      class: 'NewThreadPage',
    }, [
      m('.forum-container', [
        m('h2.page-title', 'New Post'),
        m(NewThreadForm, { header: false }),
      ]),
    ]);
  },
};

export default NewThreadPage;
