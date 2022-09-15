/* @jsx m */

import m from 'mithril';

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

export class CWBreadcrumbs implements m.ClassComponent<BreadcrumbsAttrs> {
  view(vnode) {
    const { breadcrumbs } = vnode.attrs;

    return (
      <div class={ComponentType.Breadcrumbs}>
        {breadcrumbs.map((b, k) => (
          <>
            <CWText
              type="caption"
              fontWeight="medium"
              className={
                k === breadcrumbs.length - 1 ? 'current-text' : 'parent-text'
              }
              onclick={() => m.route.set(b.path)}
            >
              {b.label}
            </CWText>
            {k !== breadcrumbs.length - 1 && (
              <CWText
                type="caption"
                fontWeight="medium"
                className="separator-text"
              >
                /
              </CWText>
            )}
          </>
        ))}
      </div>
    );
  }
}
