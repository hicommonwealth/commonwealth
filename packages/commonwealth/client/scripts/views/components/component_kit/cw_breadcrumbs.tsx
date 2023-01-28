/* @jsx jsx */
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
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_breadcrumbs.scss';
import { CWText } from './cw_text';

import { ComponentType } from './types';

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
            <React.Fragment key={k}>
              <CWText
                type="caption"
                fontWeight="medium"
                className={isCurrent ? 'current-text' : 'parent-text'}
                onClick={isCurrent ? undefined : () => setRoute(b.path)}
              >
                {b.label}
              </CWText>
              {!isCurrent && (
                <CWText
                  type="caption"
                  fontWeight="medium"
                  className="separator-text"
                >
                  /
                </CWText>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}
