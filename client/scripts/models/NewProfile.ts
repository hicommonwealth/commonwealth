class NewProfile {
  private _name: string;
  private _email: string;
  private _website: string;
  private _bio: string;
  private _isDefault: boolean;

  get name() { return this._name; }
  get email() { return this._email; }
  get website() { return this._website; }
  get bio() { return this._bio; }
  get isDefault() { return this._isDefault; }

  constructor() {}

  initialize(name, email, website, bio, isDefault) {
    this._name = name;
    this._email = email;
    this._website = website;
    this._bio = bio;
    this._isDefault = isDefault;
  }
}

export default NewProfile;