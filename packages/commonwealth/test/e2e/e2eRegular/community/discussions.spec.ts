import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community discussions page', () => {
  testPageCrash('http://localhost:8080/dydx/proposal/discussion/:identifier');

  testPageCrash('http://localhost:8080/dydx/discussions');

  testPageCrash('http://localhost:8080/dydx/discussions/:topicName');

  testPageCrash('http://localhost:8080/dydx/discussion/:identifier');

  testPageCrash('http://localhost:8080/discussion/:identifier');
});
