import m from 'mithril';
import classnames from 'classnames';
import { Classes, IAttrs } from 'client/scripts/views/components/component_kit/construct-kit/_shared';

export interface ITreeAttrs extends IAttrs {
  /** An array of child nodes */
  nodes?: m.Vnode<ITreeAttrs, any>[];

  [htmlAttrs: string]: any;
}

export class Tree implements m.Component<ITreeAttrs> {
  public view({ attrs }: m.Vnode<ITreeAttrs>) {
    const { nodes, class: className, ...htmlAttrs } = attrs;
    const treeClasses = classnames(Classes.TREE, className);

    return m('ul', {
      ...htmlAttrs,
      class: treeClasses
    }, nodes);
  }
}
