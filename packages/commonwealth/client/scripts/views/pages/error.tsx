/* @jsx m */

import m from 'mithril';
import { ClassComponent } from 'mithrilInterop';

import Sublayout from 'views/sublayout';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';

type ErrorPageAttrs = { title?: any; message?: string };

class ErrorPage extends ClassComponent<ErrorPageAttrs> {
  view(vnode: m.Vnode<ErrorPageAttrs>) {
    const { message } = vnode.attrs;

    return (
      <Sublayout
      // title={title}
      >
        <CWEmptyState
          iconName="cautionTriangle"
          content={message || 'An error occurred while loading this page.'}
        />
      </Sublayout>
    );
  }
}

export default ErrorPage;
