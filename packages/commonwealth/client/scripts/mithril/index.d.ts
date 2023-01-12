import * as lib from './mithril';

declare namespace m {
    export type Children = lib.Children;
    export type Vnode<A = unknown> = lib.ResultNode<A>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    export abstract class ClassComponent<A = {}> extends lib.ClassComponent<A> {}
}

export = m;
