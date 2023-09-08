import { EventEmitter } from 'events';
class NewProfilesController {
  // This controller is now cleaned up.
  // The only thing it does now is just emit events manually
  private static _instance: NewProfilesController;

  public static get Instance(): NewProfilesController {
    return this._instance || (this._instance = new this());
  }

  public isFetched = new EventEmitter();
}

export default NewProfilesController;
