/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_breadcrumbs.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';

type BreadcrumbsType = {
  label: string;
  path: string;
};

type BreadcrumbsAttrs = {
  breadcrumbs: Array<BreadcrumbsType>;
};

export class CWBreadcrumbs extends ClassComponent<BreadcrumbsAttrs> {
  view(vnode: ResultNode<BreadcrumbsAttrs>) {
    const { breadcrumbs } = vnode.attrs;

    return (
      <div className={ComponentType.Breadcrumbs}>
        {breadcrumbs.map((b, k) => {
          const isCurrent = k === breadcrumbs.length - 1;

          return (
            <>
              <CWText
                type="caption"
                fontWeight="medium"
                class={isCurrent ? 'current-text' : 'parent-text'}
                onClick={isCurrent ? undefined : () => setRoute(b.path)}
              >
                {b.label}
              </CWText>
              {!isCurrent && (
                <CWText
                  type="caption"
                  fontWeight="medium"
                  class="separator-text"
                >
                  /
                </CWText>
              )}
            </>
          );
        })}
      </div>
    );
  }
}
