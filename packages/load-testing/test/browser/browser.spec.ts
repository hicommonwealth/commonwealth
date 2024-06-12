import { check } from 'k6';
import { browser } from 'k6/experimental/browser';

const BASE_URL = `http://${__ENV.BASE_URL}/` || 'http://localhost:9000/';

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
    let searchBox = page.locator('[placeholder="Search Common"]');
    searchBox.waitFor();

    searchBox.type('Proto');
    searchBox.press('Enter');
    page.waitForLoadState('load');
    check(page, {
      'Page title': (page) => page.title() == 'Common',
    });
  } finally {
    page.close();
  }
}
