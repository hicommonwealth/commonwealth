import * as lib from './mithril';

// eslint-disable-next-line prefer-rest-params
const m = function m() { return lib.render.apply(this, arguments) }
m.m = lib.render;
m.trust = lib.trust
m.fragment = lib.fragment;

// FROM old fragment-fix.js
m.Fragment = {
    view(vnode) {
      return vnode.children;
    },
};

m.redraw = lib.redraw;
m.mount = lib.rootMount;
m.render = lib.rootRender;
m.route = lib.setRoute;
m.parsePathname = lib.parsePathname;
m.request = lib.request;

m.vnode = () => { throw new Error('not implemented'); };
m.jsonp = () => { throw new Error('not implemented'); };
m.parseQueryString = () => { throw new Error('not implemented'); };
m.buildQueryString = () => { throw new Error('not implemented'); };
m.buildPathname = () => { throw new Error('not implemented'); };
m.PromisePolyfill = () => { throw new Error('not implemented'); };
m.censor = () => { throw new Error('not implemented'); };

export default m;
