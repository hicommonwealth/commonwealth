import m from 'mithril';
import { Subject, Observable, combineLatest, of } from 'rxjs';
import { throttle, first, takeUntil } from 'rxjs/operators';
import app from '../state';

// The vnode.state property extends m.Lifecycle (see index.d.ts in @types/mithril to confirm).
// This is a little strange, but we'll run with it and extend m.Lifecycle here as well.
interface IDynamicVnodeStateLifecycle<Attrs, State> extends m.Lifecycle<Attrs, State> {
  dynamic: any;
}

// tslint:disable:no-string-literal
export type IDynamicObservableObject = { groupKey: string } & { [prop: string]: Observable<any> | string };

export interface IDynamicComponent<
  Attrs = {}, State extends IDynamicVnodeStateLifecycle<Attrs, State> = { dynamic: {} }
> extends m.Component<Attrs, State> {
  getObservables: (attrs: Attrs) => IDynamicObservableObject;
  view(vnode: m.VnodeDOM<Attrs, State>): m.Children | null | void;
  oninit?(this: State, vnode: m.VnodeDOM<Attrs, State>): any;
  onremove?(this: State, vnode: m.VnodeDOM<Attrs, State>): any;
}

export const makeDynamicComponent = <
  Attrs = {}, State extends IDynamicVnodeStateLifecycle<Attrs, State> = { dynamic: {} }
>(
  component: IDynamicComponent<Attrs, State>,
  debounceTime: number = 100,
): IDynamicComponent<Attrs, State> => {
  const oninit = component.oninit;
  const onremove = component.onremove;
  const onbeforeupdate = component.onbeforeupdate;

  const subscribeObservables = (vnode: m.VnodeDOM<Attrs, State>) => {
    // wait for the chain to become available before initializing dynamic components
    app.chainReady.pipe(first()).subscribe(() => {
      const observables = component.getObservables(vnode.attrs);

      // if the group key is set and hasn't changed, do nothing
      if (vnode.state['_groupKey'] === observables.groupKey) {
        return;
      }

      if (vnode.state['_subscription']) vnode.state['_subscription'].unsubscribe();
      vnode.state['_groupKey'] = observables.groupKey;

      // set up combination subscription to observables
      const entries = Object.entries(observables);
      vnode.state['_subscription'] = combineLatest(
        of(entries.map(([name]) => name)),
        combineLatest(entries.map(([name, obs]) => obs && name !== 'groupKey' ? obs : of(null)))
      ).pipe(
        // this throttle prevents the subscription from being hit too rapidly if several observables
        // update in quick succession
        //throttle(() => interval(debounceTime)),
        takeUntil(vnode.state['_complete']),
      ).subscribe(([properties, results]) => {
        // swap out each dynamic value with new value from subscription
        for (let i = 0; i < properties.length; ++i) {
          //console.log(`got update to ${properties[i]}: old = ${vnode.state.dynamic[name]}, new = ${results[i]}`);
          if (results[i]) {
            vnode.state.dynamic[properties[i]] = results[i];
          }
        }
        // in theory, we could diff the old/new and only redraw if something changed, but
        // redraws are cheap enough that it's not a big deal
        m.redraw();
      });
    });
  };

  component.oninit = (vnode: m.VnodeDOM<Attrs, State>) => {
    vnode.state.dynamic = {};
    vnode.state['_complete'] = new Subject();
    subscribeObservables(vnode);
    if (oninit && typeof oninit === 'function') oninit.call(component, vnode);
  };

  component.onremove = (vnode: m.VnodeDOM<Attrs, State>) => {
    if (vnode.state['_complete']) {
      vnode.state['_complete'].next(true);
      vnode.state['_complete'].complete();
    }
    if (onremove && typeof onremove === 'function') onremove.call(component, vnode);
  };

  component.onbeforeupdate = (vnode: m.VnodeDOM<Attrs, State>, oldVnote: m.VnodeDOM<Attrs, State>) => {
    subscribeObservables(vnode);
    if (onbeforeupdate && typeof onbeforeupdate === 'function') onbeforeupdate.call(component, vnode);
  };

  return component;
};
