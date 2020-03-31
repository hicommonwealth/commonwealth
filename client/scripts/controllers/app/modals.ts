import { default as m } from 'mithril';
import { uuidv4 } from 'lib/util';

// This file is part of the Mithril modal system. See views/modal.ts
// for more information.

export class ModalStore {
  private _modals: any[];
  constructor() {
    this._modals = [];
  }
  public create(modalspec) {
    modalspec.id = uuidv4();
    this._modals.push(modalspec);
    m.redraw();
  }
  public remove(modalspec) {
    const index = this._modals.findIndex((m) => m.id === modalspec.id);
    if (index === -1) {
      throw new Error('Invalid modal');
    }
    this._modals.splice(index, 1);
    m.redraw();
  }
  public getList() {
    return this._modals;
  }
}

const MODAL_STORE = new ModalStore();

// Enforce singleton ModalStore
export function getModalStore() {
  return MODAL_STORE;
}
