import { WebDriver } from 'selenium-webdriver';

/**
 * Function can be used to find an open window with a specific title. Useful since window titles are constant across
 * different runs.
 * @param driver A WebDriver instance at any stage/page
 * @param windowTitle The title of the window to switch to.
 * @returns Boolean True if the window with title windowTitle is switched to and false if the window is not found
 */
export async function getWindow(
  driver: WebDriver,
  windowTitle: string
): Promise<boolean> {
  const windows = await driver.getAllWindowHandles();
  const currentWindow = await driver.getWindowHandle();

  // if the current window is not the windowTitle window then cycle through windows to find it
  if ((await driver.getTitle()) !== windowTitle) {
    for (const window of windows) {
      await driver.switchTo().window(window);
      if ((await driver.getTitle()) === windowTitle) {
        return true;
      }
    }
  } else return true;

  // return to starting window if the new window is not found
  await driver.switchTo().window(currentWindow);

  return false;
}

/**
 * Closes the window with title windowTitle.
 * @param driver A WebDriver instance at any stage/page.
 * @param windowTitle The title of the window to close.
 * @returns Boolean True if the window was closed successfully and false otherwise.
 */
export async function closeWindow(
  driver: WebDriver,
  windowTitle: string
): Promise<boolean> {
  const windows = await driver.getAllWindowHandles();
  const currentWindow = await driver.getWindowHandle();
  const currentTitle = await driver.getTitle();

  // if the current window is not the windowTitle window then cycle through windows to find it
  if ((await driver.getTitle()) !== windowTitle) {
    for (const window of windows) {
      await driver.switchTo().window(window);
      if ((await driver.getTitle()) === windowTitle) {
        await driver.close();
        // return to the starting window only if the closed window was not the starting window
        if (currentTitle !== windowTitle)
          await driver.switchTo().window(currentWindow);
        return true;
      }
    }
  } else {
    await driver.close();
    return true;
  }

  // return to starting window if the new window is not found
  await driver.switchTo().window(currentWindow);

  return false;
}

/**
 * Debug function used to get the titles of all the open windows
 * @param driver A WebDriver instance at any stage/page
 * @returns String[] An array of window titles
 */
export async function getWindowTitles(driver: WebDriver): Promise<string[]> {
  const windows = await driver.getAllWindowHandles();
  const titles = [];

  for (const window of windows) {
    await driver.switchTo().window(window);
    const title = await driver.getTitle();
    titles.push(title);
  }

  return titles;
}
