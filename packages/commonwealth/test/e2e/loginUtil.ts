import { Page, expect, test } from '@playwright/test';
import { ethers } from 'ethers';
import { getMetaMaskMock } from 'test/util/mockMetaMaskUtil';

export const login = async (page: Page) => {
    await page.addInitScript(async () => {
        window['ethereum'] = getMetaMaskMock(
            'https://mainnet.infura.io/v3/17253b2fd784479abff55a32c9b3282c',
            ethers.Wallet.createRandom().privateKey
            )
    })
    await page.goto('http://localhost:8080/');
    await page.getByLabel('Login').click()
    await page.getByLabel('MetaMask').click()
}