import { check } from 'k6';
import { browser } from 'k6/browser';
import { SERVER_URL } from '../util/config.ts';

export const options = {
  scenarios: {
    browser: {
      executor: 'constant-vus',
      exec: 'dashboard',
      vus: 3,
      duration: '1m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
    layer_zero: {
      executor: 'constant-vus',
      exec: 'layer_zero',
      vus: 3,
      duration: '1m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  search: {
    executor: 'constant-vus',
    exec: 'search',
    vus: 3,
    duration: '1m',
    options: {
      browser: {
        type: 'chromium',
      },
    },
  },
};

export async function dashboard() {
  const page = await browser.newPage();

  try {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');

    const pageTitle = await page.title();
    check(pageTitle, {
      'Page title': (pageTitle) => pageTitle == 'Common',
    });
  } finally {
    await page.close();
  }
}

export async function layer_zero() {
  const page = await browser.newPage();

  try {
    await page.goto(`${SERVER_URL}/layerzero/discussion`);
    await page.waitForLoadState('load');

    const pageTitle = await page.title();
    check(pageTitle, {
      'Page title': (pageTitle) => pageTitle == 'Common',
    });
  } finally {
    await page.close();
  }
}

export async function search() {
  const page = await browser.newPage();

  try {
    await page.goto(`${SERVER_URL}/dashboard/global`);
    await page.waitForLoadState('load');
    const searchParm = ['Proto', 'Common', 'Layer0', 'Discussion', 'Dashboard'];
    const randomParm =
      searchParm[Math.floor(Math.random() * searchParm.length)];

    // Random search
    const searchBox = page.locator('input[placeholder="Search Common"]');
    await searchBox.type(randomParm);
    await searchBox.press('Enter');
    await page.waitForLoadState('load');
    console.log(page.url());
    const pageTitle = await page.title();
    check(pageTitle, {
      'Page title': (pageTitle) => pageTitle == 'Common',
    });
  } finally {
    await page.close();
  }
}
