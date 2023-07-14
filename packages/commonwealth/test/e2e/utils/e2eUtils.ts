// Note, this login will not work for the homepage
export async function login(page) {
  await page.waitForSelector('.LoginSelector button');
  let button = await page.$('.LoginSelector button');
  await button.click();

  await page.waitForSelector('.LoginDesktop');

  let metaMaskIcon = await page.$$("text='Metamask'");
  do {
    await page.mouse.click(0, 0);
    button = await page.$('.LoginSelector button');
    await button.click();
    metaMaskIcon = await page.$$("text='Metamask'");
  } while (metaMaskIcon.length === 0);

  await page.getByText('Metamask').click();
}
