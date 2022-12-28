/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import app from 'state';
import { Toaster } from './components/component_kit/construct-kit';


export class AppToasts extends ClassComponent {
  view() {
    return m(Toaster, { toasts: app.toasts.getList() });
  }
}
