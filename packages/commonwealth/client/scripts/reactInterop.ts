import {
  createElement,
  ForwardedRef,
  forwardRef,
  Fragment,
  FunctionComponent,
  ReactElement,
  ReactNode,
  // eslint-disable-next-line import/no-unresolved
  Component as ReactComponent
} from 'react';
import renderer from 'react-hyperscript';
import {
  matchPath, BrowserRouter
} from 'react-router-dom';
import * as ReactDOM from 'react-dom';

/// CYANO CODE


type RenderElement = ReactElement | string | number | null;
export type Children = ReactNode | ReactNode[];

declare function renderFunction(
  children?: Children | ReadonlyArray<RenderElement> | RenderElement,
): ReactElement;

declare function renderFunction<P = unknown>(
  componentOrTag: FunctionComponent<P> | string,
  children?: Children | ReadonlyArray<RenderElement> | RenderElement,
): ReactElement;

declare function renderFunction<P = unknown>(
  componentOrTag: FunctionComponent<P> | string,
  properties: P | null,
  children?: Children | ReadonlyArray<RenderElement> | RenderElement,
): ReactElement<P>;

type FragmentProps = {
  [key: string]: string | number;
};

type HyperScript = typeof renderFunction & {
  trust: (
    html: string,
    wrapper?: string,
  ) => ReactElement<{
    dangerouslySetInnerHTML: {
      __html: string;
    };
  }>;
  fragment: (props?: FragmentProps, children?: ReactNode) => JSX.Element;
  displayName: string;
};

export const render: HyperScript = Object.assign(renderer as typeof renderFunction, {
  trust: (
    html: string,
    wrapper: FunctionComponent | string = '',
  ): ReactElement =>
    renderer(wrapper, {
      dangerouslySetInnerHTML: { __html: html },
    }),
  fragment: (props: FragmentProps = {}, children: ReactNode = []) => (
    <Fragment {...props}>{children}</Fragment>
  ),
  displayName: 'react',
});

export type Component<Props = unknown> = FunctionComponent<Props>;

export const jsx = createElement;

export type ResultNode<A> = ReactElement<A>;


/// END CYANO CODE

// TODO: verify this works
export abstract class ClassComponent<A = {}> extends ReactComponent<A> {
  protected readonly __props: A;

  public componentDidMount() {
    this.oninit(this.props);
  }

  public componentDidUpdate(prevProps: A) {
    this.onupdate(this.props);
  }

  public componentWillUnmount() {
    this.onremove(this.props);
  }

  render() {
    this.oncreate(this.props);
    return this.view(this.props);
  }

  public oninit(v: Readonly<A>) {};
  public onupdate(v: Readonly<A>) {};
  public onremove(v: Readonly<A>) {};
  public oncreate(v: Readonly<A>) {};

  abstract view(v: Readonly<A>): Children | null;
}

type RouteOptions = {
  replace?: boolean;
};

type Params = { [key: string]: string };

export function setRoute(route: string, data?: any, options?: RouteOptions) {

}

export function getRouteParam(name?: string) {

}

export function getRoute() {

}

export function redraw(sync = false) {
  // React does not have a built-in method for manually triggering a re-render.
  // Instead, you can use the `setState` method to update the component's state and trigger a re-render.
}

export function parsePathname(url: string): { path: string; params: Params } {
  const match = matchPath(url, { path: url });
  return {
    path: match ? match.path : '',
    params: match ? match.params : {},
  };
}

export function rootRender(el: Element, vnodes: Children) {
  // React does not have a built-in method for rendering to an element directly.
  // Instead, you can use the `ReactDOM.render` method to render a React component to an element.
  ReactDOM.render(vnodes, el);
}

export function rootMount(element: Element, component?: any | null) {
  // React does not have a built-in method for mounting a component to an element directly.
  // Instead, you can use the `ReactDOM.render` method to render a React component to an element.
  ReactDOM.render(component, element);
}
