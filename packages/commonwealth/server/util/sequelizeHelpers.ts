export function attributesOf<T extends Record<string, unknown>>(
  ...keys: Array<keyof T>
) {
  return keys;
}

export function attributeOf<T extends Record<string, unknown>>(key: keyof T) {
  return key;
}
