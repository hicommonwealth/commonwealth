/* @jsx m */

import m from 'mithril';
import { ClassComponent } from 'mithrilInterop';

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
