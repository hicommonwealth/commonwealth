/* @jsx m */

import m from 'mithril';

import app from 'state';
import { navigateToSubpage } from 'app';
import { notifyInfo } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { NewThreadForm } from '../components/new_thread_form/new_thread_form';

class NewThreadPage implements m.ClassComponent {
  view() {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to log in first');
      navigateToSubpage('/login');
      return;
    }

    if (!app.chain) return <PageLoading />;

    const hasTopics = !!app.topics.getByCommunity(app.chain.id).length;

    return (
      <Sublayout title="New Thread">
        <NewThreadForm isModal={false} hasTopics={hasTopics} />
      </Sublayout>
    );
  }
}

export default NewThreadPage;
