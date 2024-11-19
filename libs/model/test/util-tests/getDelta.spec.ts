import { getDelta } from '@hicommonwealth/model';

import { describe, expect, test } from 'vitest';

describe('getDelta', () => {
  test('should get delta', () => {
    const target = {
      name: 'Alice',
      age: 30,
      skills: ['JavaScript', 'TypeScript'],
      address: { city: 'Wonderland', zip: 12345 },
    };

    const source = {
      name: 'Alice',
      age: 31,
      skills: ['JavaScript', 'TypeScript', 'React'],
      address: { city: 'Wonderland', zip: 54321 },
    };

    const delta = getDelta(target, source);
    expect(delta).to.deep.equal({
      age: 31,
      skills: ['JavaScript', 'TypeScript', 'React'],
      address: { zip: 54321 },
    });
  });
});
