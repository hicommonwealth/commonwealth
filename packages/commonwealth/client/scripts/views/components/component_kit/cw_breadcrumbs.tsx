/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_breadcrumbs.scss';
import m from 'mithril';
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
  view(vnode: m.Vnode<BreadcrumbsAttrs>) {
    const { breadcrumbs } = vnode.attrs;

    return (
      <div class={ComponentType.Breadcrumbs}>
        {breadcrumbs.map((b, k) => {
          const isCurrent = k === breadcrumbs.length - 1;

          return (
            <>
              <CWText
                type="caption"
                fontWeight="medium"
                className={isCurrent ? 'current-text' : 'parent-text'}
                onclick={isCurrent ? undefined : () => m.route.set(b.path)}
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
            </>
          );
        })}
      </div>
    );
  }
}
