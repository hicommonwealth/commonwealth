import { redraw } from 'mithrilInterop';
import { uuidv4 } from 'lib/util';
import { EventEmitter } from 'events';

export class ModalStore {
  private _modals: any[];
  public isChanged = new EventEmitter();

  constructor() {
    this._modals = [];
  }

  public create(modalspec) {
    modalspec.id = uuidv4();
    this._modals.push(modalspec);
    this.isChanged.emit('redraw');
  }

  public remove(modalspec) {
    const index = this._modals.findIndex((ms) => ms.id === modalspec.id);
    if (index === -1) {
      throw new Error('Invalid modal');
    }
    this._modals.splice(index, 1);
    this.isChanged.emit('redraw');
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
