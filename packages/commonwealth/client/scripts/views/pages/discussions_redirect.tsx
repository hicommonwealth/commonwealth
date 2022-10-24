/* @jsx m */

import { navigateToSubpage } from 'app';
import m from 'mithril';

import app from 'state';
import { PageLoading } from './loading';

class DiscussionsRedirect implements m.ClassComponent {
  view() {
    if (app.chain) {
      if (app.chain.meta.defaultOverview) {
        navigateToSubpage('/overview');
      } else {
        navigateToSubpage('/discussions');
      }
    } else {
      return <PageLoading />;
    }
  }
}

export default DiscussionsRedirect;
