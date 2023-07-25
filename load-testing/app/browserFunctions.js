module.exports = { visitForum };

function getBaseUrl() {
  let ENV = process.env.ENV || 'dev';
  let baseUrl = 'https://us.unique.rocks';
  if (ENV === 'eu') {
    baseUrl = 'https://eu.unique.rocks';
  }
  if (ENV === 'local') {
    baseUrl = 'http://localhost:8080';
  }
  if (ENV === 'beta') {
    baseUrl = 'https://commonwealth-beta.herokuapp.com';
  }
  if (ENV === 'frick') {
    baseUrl = 'https://commonwealth-frick.herokuapp.com';
  }
  if (ENV === 'frack') {
    baseUrl = 'https://commonwealth-frack.herokuapp.com';
  }
  return baseUrl;
}

async function visitForum(page) {
  const targetUrl = getBaseUrl() + '/' + (process.env.FORUM || 'osmosis');
  console.log('Visiting ' + targetUrl);
  await page.goto(targetUrl);
  await page.waitForSelector('.thread-preview');
}
