import models from 'server/database';

describe('putComments Tests', () => {
  it('fail on input error', async () => {
    const err = await models.Comment.bulkCreate([{ a: '3' } as any]).catch(e => console.log(e));

    console.log('');

  });
});