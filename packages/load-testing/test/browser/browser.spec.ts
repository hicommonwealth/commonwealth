import { check } from 'k6';
import { browser } from 'k6/experimental/browser';
import { temp } from './utils';

temp();

const BASE_URL = __ENV.BASE_URL
  ? `http://${__ENV.BASE_URL}/`
  : 'http://localhost:8080/';

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
  const page = browser.newPage();

  try {
    await page.goto(BASE_URL);
    page.waitForLoadState('load');

    check(page, {
      'Page title': (page) => page.title() == 'Common',
    });
  } finally {
    page.close();
  }
}

export async function layer_zero() {
  const page = browser.newPage();

  try {
    await page.goto(`${BASE_URL}layerzero/discussion`);
    page.waitForLoadState('load');

    check(page, {
      'Page title': (page) => page.title() == 'Common',
    });
  } finally {
    page.close();
  }
}

export async function search() {
  const page = browser.newPage();

  try {
    await page.goto(`${BASE_URL}dashboard/global`);
    page.waitForLoadState('load');
    let searchParm = ['Proto', 'Common', 'Layer0', 'Discussion', 'Dashboard'];
    let randomParm = searchParm[Math.floor(Math.random() * searchParm.length)];

    // Random search
    let searchBox = page.locator('input[placeholder="Search Common"]');
    searchBox.type(randomParm);
    searchBox.press('Enter');
    page.waitForLoadState('load');
    console.log(page.url());
    check(page, {
      'Page title': (page) => page.title() == 'Common',
    });
  } finally {
    page.close();
  }
}
