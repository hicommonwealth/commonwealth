/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/loading.scss';

import Sublayout from 'views/sublayout';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWText } from '../components/component_kit/cw_text';

type PageLoadingAttrs = {
  message?: string;
};

export class PageLoading extends ClassComponent<PageLoadingAttrs> {
  view(vnode: ResultNode<PageLoadingAttrs>) {
    const { message } = vnode.attrs;

    return (
      <Sublayout hideSearch>
        <div class="LoadingPage">
          <div class="inner-content">
            <CWSpinner size="xl" />
            <CWText>{message}</CWText>
          </div>
        </div>
      </Sublayout>
    );
  }
}
