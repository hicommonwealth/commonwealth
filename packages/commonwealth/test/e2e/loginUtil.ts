import { Page, expect, test } from '@playwright/test';
import { ethers } from 'ethers';
import { getMetaMaskMock } from 'test/e2e/mockMetaMaskUtil';

export const login = async (page: Page) => {
    await page.addInitScript(async () => {
        window['ethereum'] = getMetaMaskMock(
            'https://mainnet.infura.io/v3/17253b2fd784479abff55a32c9b3282c',
            ethers.Wallet.createRandom().privateKey
            )
    })
    const provider = getMetaMaskMock(
        'https://mainnet.infura.io/v3/17253b2fd784479abff55a32c9b3282c',
        ethers.Wallet.createRandom().privateKey
    );
    console.log(await provider.request({method: 'eth_getBlockByNumber', params: []}))
    await page.goto('http://localhost:8080/');
    await page.evaluate(() => {
        // Inject the module into window.ethereum
        window['ethereum'] = provider
        console.log(window['ethereum'])
      });
    await page.getByText('Login').click();
    await page.waitForSelector('.LoginDesktop');
    console.log((await page.content()))
    await page.getByText('Metamask').click();
}