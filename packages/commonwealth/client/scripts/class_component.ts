import m from 'mithril';
import ClassComponent from 'class_component';

export default abstract class ClassComponent<
  A extends Record<string, unknown> = Record<string, unknown>
> implements m.ClassComponent<A>
{
  /** Do not use, only used for JSX validation */
  protected readonly __props: A;

  abstract view(v: m.Vnode<A>): m.Children | null;
}
