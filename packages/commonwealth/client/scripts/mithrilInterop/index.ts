/**
 * Defines a mithril interoperability layer whose functionality is backed by REACT.
 *
 * The set of functions defined here should match the exact interfaces mithril-based layer,
 * such that it can be swapped out by exporting this file in `mithrilInterop.ts`.
 *
 * This file is currently using the `.ts.new` extension to avoid compilation and typechecking,
 * as we do not want to expose its imports and features until we are prepared to migrate to react.
 */

import type { FunctionComponent, ReactNode } from 'react';
import { Component as ReactComponent } from 'react';
import type {
  NavigateFunction,
  Location,
  NavigateOptions,
} from 'react-router-dom';
import { getScopePrefix } from 'navigation/helpers';

// corresponds to Mithril's "Children" type -- RARELY USED
export type Children = ReactNode | ReactNode[];

// Mithril component type, maps to FC
export type Component<Props = unknown> = FunctionComponent<Props>;

// corresponds to Mithril's Vnode type with attrs only (no state)
export type ResultNode<A = unknown> = { attrs: A; children: Children };

export type ClassComponentRouter = {
  location: Location;
  navigate: NavigateFunction;
  params: Readonly<Record<string, string | undefined>>;
};
// Additions to base React Component attrs
type AdditionalAttrs = {
  // simulate mithril's vnode.children
  children?: Children;

  // optionally used navigation for withRouter, see `navigation/helpers.tsx`
  router?: ClassComponentRouter;
};

// Replicates Mithril's ClassComponent functionality with support for JSX syntax.
// Expects state on `this`, with redraws on this variable assignments.
export abstract class ClassComponent<A = unknown> extends ReactComponent<
  A & AdditionalAttrs
> {
  protected readonly __props: A;
  private _isMounted = false;
  private _isCreated = false;

  // props that should not trigger a redraw -- internal to React
  private static readonly IGNORED_PROPS = [
    'props',
    'state',
    '_isMounted',
    'context',
  ];

  constructor(props) {
    super(props);

    // proxy props to trigger redraws on prop changes
    return new Proxy(this, {
      set(obj, prop, value) {
        if (
          // do not update if not yet mounted
          obj._isMounted &&
          // do not update on reserved keyword changes
          !ClassComponent.IGNORED_PROPS.includes(prop as string) &&
          // do not update if the prop is inherited = internal to React
          Object.keys(obj).includes(prop as string) &&
          // do not update if the value doesn't change
          obj[prop] !== value &&
          // do not update if the value is a function (not sure if necessary)
          typeof value !== 'function'
        ) {
          obj.setState({ ...obj.state, [prop]: value });
          // console.log(prop, value);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line prefer-rest-params
        return Reflect.set(...arguments);
      },
    });
  }

  // used for mithril's `oninit` lifecycle hook
  public componentDidMount() {
    this.oninit({ attrs: this.props, children: this.props.children });
    this._isMounted = true;
  }

  // used for mithril's `onupdate` lifecycle hook
  public componentDidUpdate(prevProps: A) {
    this.onupdate({ attrs: this.props, children: this.props.children });
  }

  // used for mithril's `onremove` lifecycle hook
  public componentWillUnmount() {
    this.onremove({ attrs: this.props, children: this.props.children });
    this._isMounted = false;
  }

  // used for mithril's `oncreate` lifecycle hook and for the main `view` function
  render() {
    if (!this._isCreated) {
      this._isCreated = true;
      this.oncreate({ attrs: this.props, children: this.props.children });
    }
    return this.view({ attrs: this.props, children: this.props.children });
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  public oninit(v: ResultNode<A>) {}
  public onupdate(v: ResultNode<A>) {}
  public onremove(v: ResultNode<A>) {}
  public oncreate(v: ResultNode<A>) {}

  abstract view(v: ResultNode<A>): Children | null;

  // replicates `m.redraw()` functionality -- sync is ignored
  public redraw(sync = false) {
    this.forceUpdate();
  }

  // It works very similar as useCommonNavigate but only for class components with withRouter() HOC
  public setRoute(
    route: string,
    options?: NavigateOptions,
    prefix?: null | string
  ) {
    const scopePrefix = getScopePrefix(prefix);
    if (this.props.router.navigate) {
      const url = `${scopePrefix}${route}`;
      this.props.router.navigate(url, options);
    } else {
      console.error('Prop "navigate" is not defined!');
    }
  }
}

// m.rendraw() shim. NO-OP.
export function redraw(sync = false, component?: any) {
  // TODO
  if (component) {
    console.log(component);
    component.forceUpdate();
  } else {
    // console.trace('no-op redraw called!');
  }
}
