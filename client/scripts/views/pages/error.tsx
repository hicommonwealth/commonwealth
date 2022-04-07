/* @jsx m */

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { EmptyState, Icons } from 'construct-ui';

import 'pages/error.scss';

import Sublayout from 'views/sublayout';

type ErrorPageAttrs = { title?: any; message?: string };

class ErrorPage implements m.ClassComponent<ErrorPageAttrs> {
  oncreate() {
    mixpanel.track('PageVisit', { 'Page Name': 'ErrorPage' });
  }

  view(vnode) {
    const { message, title } = vnode.attrs;

    return (
      <Sublayout title={title}>
        <div class="ErrorPage">
          <EmptyState
            icon={Icons.ALERT_TRIANGLE}
            fill={true}
            header="Error"
            content={message || 'An error occurred while loading this page.'}
          />
        </div>
      </Sublayout>
    );
  }
}

export default ErrorPage;
