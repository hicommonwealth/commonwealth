/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import { Spinner } from 'construct-ui';
import $ from 'jquery';

import 'pages/iframe.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CWText } from '../components/component_kit/cw_text';

// The number of member profiles that are batch loaded
const DEFAULT_MEMBER_REQ_SIZE = 20;

type IFrameAttrs = {
  src: string;
}

class IFrame implements m.ClassComponent<IFrameAttrs> {
  view(vnode) {
    const { src } = vnode.attrs;
    return m('iframe', {
      src: `https://${src}`,
      style: 'height: 600px;'
    });
  }
}

class IFramePage implements m.ClassComponent<{src: string}> {
  view(vnode) {
    const { src } = vnode.attrs;

    return (
      <Sublayout
        title={<BreadcrumbsTitleTag title="IFrame" />}
        showNewProposalButton
        hideSearch={false}
      >
        <div class="IFramePage">
          {/* <CWText type="h3" fontWeight="medium">
              {'App'}
          </CWText> */}
          <div class="iframe-container">
            <IFrame src={src} />
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default IFramePage;
