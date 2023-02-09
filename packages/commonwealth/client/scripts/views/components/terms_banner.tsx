import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';

import 'pages/terms_banner.scss';

import app from 'state';
import { CWBanner } from './component_kit/cw_banner';
import { CWText } from './component_kit/cw_text';

type TermsBannerAttrs = { terms: string };

export class TermsBanner extends ClassComponent<TermsBannerAttrs> {
  view(vnode: ResultNode<TermsBannerAttrs>) {
    const { terms } = vnode.attrs;

    return (
      <CWBanner
        className="TermsBanner"
        bannerContent={
          <CWText type="b2" className="terms-text">
            Please check out our <a href={terms}>terms of service</a>.
          </CWText>
        }
        onClose={() =>
          localStorage.setItem(`${app.activeChainId()}-tos`, 'off')
        }
      />
    );
  }
}
