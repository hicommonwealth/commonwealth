import m from 'mithril';
import classnames from 'classnames';
import { Classes, IAttrs } from 'client/scripts/views/components/component_kit/construct-kit/_shared';

export interface IBreadcrumbItemAttrs extends IAttrs {
  [htmlAttrs: string]: any;
}

export class BreadcrumbItem implements m.Component<IBreadcrumbItemAttrs> {
  public view({ attrs, children }: m.Vnode<IBreadcrumbItemAttrs>) {
    const { class: className, ...htmlAttrs } = attrs;
    const tag = htmlAttrs.href != null ? 'a' : 'span';
    const classes = classnames(Classes.BREADCRUMB_ITEM, className);

    return m(tag, { ...htmlAttrs, class: classes }, children);
  }
}
