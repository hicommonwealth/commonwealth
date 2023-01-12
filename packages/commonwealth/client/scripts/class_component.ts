import m from 'mithril';

export default abstract class ClassComponent<
  A extends Record<string, unknown> = Record<string, unknown>
> extends m.ClassComponent<A>
{ }
