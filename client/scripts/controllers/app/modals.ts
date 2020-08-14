import m from 'mithril';
import { uuidv4 } from 'lib/util';

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

  // name must be filename in the modals folder
  public async lazyCreate(name: string, data = {}) {
    const modalImport = await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "modal-[request]" */
      `../../views/modals/${name}`
    );
    const modal = modalImport.default;
    this.create({ modal, data });
  }

  public remove(modalspec) {
    const index = this._modals.findIndex((ms) => ms.id === modalspec.id);
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
