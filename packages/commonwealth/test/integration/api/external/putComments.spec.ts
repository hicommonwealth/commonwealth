import { put } from "./appHook.spec";

describe('putComments Tests', () => {
  it('fail on input error', async () => {
    const resp = await put('/api/comments', {a: 3}, true);

    console.log('');

  });
});