/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_breadcrumbs.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

type BreadcrumbsAttrs = {};

export class CWBreadcrumbs implements m.ClassComponent<BreadcrumbsAttrs> {
  view(vnode) {
    // const {} = vnode.attrs;

    return <div class={ComponentType.Breadcrumbs} />;
  }
}
