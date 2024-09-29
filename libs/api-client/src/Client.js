/**
 * This file was auto-generated by Fern from our API Definition.
 */
import { Comment } from './api/resources/comment/client/Client';
import { Community } from './api/resources/community/client/Client';
import { Reaction } from './api/resources/reaction/client/Client';
import { Thread } from './api/resources/thread/client/Client';
export class CommonApiClient {
  constructor(_options = {}) {
    this._options = _options;
  }
  get community() {
    var _a;
    return (_a = this._community) !== null && _a !== void 0
      ? _a
      : (this._community = new Community(this._options));
  }
  get comment() {
    var _a;
    return (_a = this._comment) !== null && _a !== void 0
      ? _a
      : (this._comment = new Comment(this._options));
  }
  get thread() {
    var _a;
    return (_a = this._thread) !== null && _a !== void 0
      ? _a
      : (this._thread = new Thread(this._options));
  }
  get reaction() {
    var _a;
    return (_a = this._reaction) !== null && _a !== void 0
      ? _a
      : (this._reaction = new Reaction(this._options));
  }
}
