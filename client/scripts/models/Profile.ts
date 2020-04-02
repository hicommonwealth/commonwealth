import m from 'mithril';
import jdenticon from 'jdenticon';

class Profile {
  private _name: string;
  private _headline: string;
  private _bio: string;
  private _avatarUrl: string;
  private _initialized: boolean;
  private _anonymous: boolean;
  get name() { return this._name; }
  get headline() { return this._headline; }
  get bio() { return this._bio; }
  get avatarUrl() { return this._avatarUrl; }
  get initialized() { return this._initialized; }

  public readonly chain: string;
  public readonly address: string;

  constructor(chain: string, address: string) {
    this.chain = chain;
    this.address = address;
  }

  public initializeEmpty() {
    this._initialized = true;
  }
  public initialize(name, headline, bio, avatarUrl) {
    this._initialized = true;
    this._anonymous = false;
    this._name = name;
    this._headline = headline;
    this._bio = bio;
    this._avatarUrl = avatarUrl;
  }

  get displayName() : string {
    if (!this._initialized) return 'Loading...';
    if (this._anonymous) return 'Anonymous';
    return this.name || 'Anonymous';
  }

  public getAvatar(size: number) {
    if (this.avatarUrl) {
      return m('.avatar-image', {
        style: `width: ${size}px; height: ${size}px; background-image: url('${this.avatarUrl}'); `
          + 'background-size: cover; border-radius: 9999px',
      });
    } else {
      const html = jdenticon.toSvg(this.address, size);
      return m('svg.Jdenticon', {
        width: size,
        height: size,
        oncreate: (vnode) => {
          jdenticon.update(vnode.dom as HTMLElement, this.address);
        },
        onupdate: (vnode) => {
          jdenticon.update(vnode.dom as HTMLElement, this.address);
        }
      });
    }
  }

  public static getSVGAvatar(address, size) {
    return jdenticon.toSvg(address, size);
  }
}

export default Profile;
