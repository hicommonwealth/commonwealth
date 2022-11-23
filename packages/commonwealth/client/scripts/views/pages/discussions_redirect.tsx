/* @jsx m */

import { navigateToSubpage } from 'app';
import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { PageLoading } from './loading';

class DiscussionsRedirect extends ClassComponent {
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
