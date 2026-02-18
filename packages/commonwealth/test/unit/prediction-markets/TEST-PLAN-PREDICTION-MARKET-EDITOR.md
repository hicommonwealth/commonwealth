# Test Plan: Prediction Market Editor Modal

Step-by-step manual test plan for the prediction market create-and-deploy flow (issue #13374). Follow these steps as a regular user would.

**Note for reviewers / deploy:** The FutarchyGovernor address in `libs/evm-protocols/src/common-protocol/chainConfig.ts` (e.g. Base Sepolia) is currently `ZERO_ADDRESS`. It must be updated to the deployed contract address before on-chain deployment will work.

---

## Prerequisites

1. **App is running**
   - From repo root: `pnpm start` (or API + frontend already running).
   - Frontend: http://localhost:8080 (or your dev URL).

2. **Futarchy is enabled**
   - In your environment, ensure `FLAG_FUTARCHY=true` (e.g. in `.env`).
   - Restart the app if you change this.

3. **You are logged in**
   - Use an account that can create threads in a community (e.g. community member or admin).

4. **Community is EVM**
   - Use a community that has an EVM chain (e.g. Base Sepolia) so the deploy flow can run when the governor is configured.

---

## Test 1: Open the modal (draft-only flow)

**Goal:** Confirm the “Create prediction market” entry point and modal open; create a draft when deploy is not configured.

1. In the app, go to a **community** that has the futarchy flag on (e.g. your test community).
2. Open **any existing thread** in that community (or create a new thread and open it).
3. Scroll to the **Polls** (or prediction market) section on the thread page.
4. If the thread has **no prediction market** yet, you should see a card: **“Add a prediction market to this thread?”** with a button **“Create prediction market”**.
5. Click **“Create prediction market”**.
6. A **modal** should open with the title **“Create Prediction Market”** and these fields:
   - **Prompt** (textarea)
   - **Collateral token** (dropdown: USDC, WETH, Custom ERC20)
   - **Duration (days)** (number, 1–90)
   - **Resolution threshold (%)** (slider 51–99%, default 55%)
   - **Initial liquidity (optional)** (number input)
   - Buttons: **Cancel** and **Create and Deploy**
7. Leave **“Create and Deploy”** disabled:
   - Clear the prompt (or leave it empty). Confirm **“Create and Deploy”** is **disabled**.
   - Type a short prompt (e.g. “Will this pass?”). Confirm **“Create and Deploy”** becomes **enabled** (and stays enabled with valid duration/collateral).
8. Fill the form:
   - **Prompt:** e.g. “Will the proposal pass?”
   - **Collateral:** e.g. USDC (or leave default).
   - **Duration:** e.g. 14 days.
   - **Resolution threshold:** e.g. 55% (or leave default).
   - **Initial liquidity:** leave empty or enter e.g. 0.
9. Click **“Create and Deploy”**.
10. You should see a short **loading** state: “Creating draft…”.
11. Then one of:
    - **If deploy is not configured for this chain:** A success message like “Prediction market draft created. On-chain deployment is not configured for this chain.” and the **modal closes**. The “Add a prediction market” card is replaced by a **Prediction market** card showing the draft (prompt + Draft status chip). As thread author you should see a **“Complete deployment”** button on that card.
    - **If wallet is not connected:** An error like “Wallet not connected. Connect a wallet to deploy on-chain.” and the modal stays open with the message visible.
12. **Pass criteria:** Modal opens, form validation works, draft is created and modal closes when deploy is not configured; draft card appears with “Complete deployment” for the author.

---

## Test 2: Form validation

**Goal:** Check that invalid inputs are rejected and the button stays disabled or errors are shown.

1. Open the modal again (same thread, or another thread with no prediction market).
2. **Empty prompt**
   - Clear the prompt. **“Create and Deploy”** should be **disabled**.
3. **Prompt too long**
   - Paste or type so the prompt is over 500 characters. **“Create and Deploy”** should be **disabled** (or submit should be prevented).
4. **Duration out of range**
   - Set duration to **0** or **100**. The input should clamp to 1–90 or **“Create and Deploy”** should stay disabled.
5. **Invalid collateral (custom)**
   - Select **“Custom ERC20”** and enter an invalid address (e.g. `0x123` or `not-an-address`). **“Create and Deploy”** should be **disabled**.
6. **Valid custom collateral**
   - Enter a valid 0x address (e.g. 40 hex chars). **“Create and Deploy”** should become **enabled** (with a non-empty prompt and valid duration).
7. **Initial liquidity**
   - Enter **-1** or **0** with custom collateral and valid prompt. If validation treats 0 as invalid for “optional” liquidity, **“Create and Deploy”** may stay disabled; otherwise leave at 0 or empty.
8. **Pass criteria:** Invalid combinations keep the button disabled; valid combinations enable it.

---

## Test 3: Full create + on-chain deploy (when governor is configured)

**Goal:** Run the full flow: create draft → sign transaction → deploy and record. Only possible when the Futarchy governor address is set for the chain.

1. **Configure governor address**
   - In `libs/evm-protocols/src/common-protocol/chainConfig.ts`, set `FutarchyGovernor: '0xYourGovernorAddress'` for the chain (e.g. SepoliaBase). Replace the `ZERO_ADDRESS` placeholder when the contract is deployed.

2. **Connect wallet**
   - Ensure you are **logged in** and your **wallet is connected** for the same chain (e.g. Base Sepolia).

3. Open a **thread** that has no prediction market and open the **“Create prediction market”** modal.

4. Fill the form (e.g. prompt, USDC, 14 days, 55%, optional liquidity) and click **“Create and Deploy”**.

5. You should see **“Creating draft…”** then **“Preparing deployment…”**.

6. Your **wallet** (e.g. MetaMask, Magic) should prompt you to **sign a transaction**. Approve it.

7. After the transaction confirms:
   - A success message like “Prediction market created and deployed.” should appear.
   - The **modal should close**.
   - The thread page should update (e.g. the new market card appears with active/draft status).

8. **If you reject the transaction:** An error like “Transaction was rejected by the user.” should appear and the modal should stay open (with the draft already created).

9. **Pass criteria:** With governor set and wallet connected, the full flow completes: create → sign → deploy → modal closes and UI updates.

---

## Test 4: Complete deployment of an existing draft

**Goal:** When a draft already exists and the viewer is the thread author, they can complete it (deploy on-chain) from the draft card.

1. Start from a thread that has a **draft** prediction market (e.g. from Test 1).
2. As the **thread author**, you should see a **Prediction market** card with the draft prompt, a Draft status chip, and a **“Complete deployment”** button.
3. **If deploy is not configured:** Click **“Complete deployment”**. A modal opens; “Deploy on-chain” is disabled and a note explains that deployment is not configured for this chain.
4. **If deploy is configured:** Click **“Complete deployment”**. A modal opens with the draft prompt and a **“Deploy on-chain”** button. Click it. You should see “Deploying on-chain…” then a wallet prompt to sign. After confirming, the draft is deployed and the card updates to “Status: Active” (or the list refetches).
5. **Pass criteria:** Author sees “Complete deployment” on draft card; modal runs deploy-only flow (no new draft created); UI updates after success.

---

## Test 5: Error messages

**Goal:** See that different failure modes show clear messages.

1. **Wallet not connected**
   - Log out or disconnect wallet. Open the modal, fill form, submit. You should see a message like “Wallet not connected. Connect a wallet to deploy on-chain.”

2. **Transaction rejected**
   - With deploy configured and wallet connected, submit the form and **reject** the transaction in the wallet. You should see a message like “Transaction was rejected by the user.”

3. **Insufficient funds (optional)**
   - If you can test with an account that has no gas: submit and confirm you see an “Insufficient funds”–style message (exact text may vary).

4. **Pass criteria:** Each scenario shows a distinct, understandable error message.

---

## Test 6: Unit tests (automated)

**Goal:** Run the automated tests for validation and deploy/config.

1. From the **repo root**, run:
   ```bash
   pnpm -F commonwealth test-select test/unit/prediction-markets/
   ```
2. You should see tests for:
   - Form validation (`predictionMarketEditorValidation.spec.ts`)
   - Prediction market address lookup (`futarchyConfig.spec.ts` → predictionMarket)
   - Deploy helper when not configured (`deployPredictionMarketOnChain.spec.ts`)
3. **Pass criteria:** All listed tests pass (or are skipped only for known env issues, e.g. DB).

---

## Quick reference

| What you’re testing        | Where to look / what to do                    |
|----------------------------|-----------------------------------------------|
| Modal opens                | Thread without market → “Create prediction market” |
| Draft-only flow            | Submit without governor set → success + close; draft card appears |
| Complete draft            | Thread with draft → author sees “Complete deployment” → deploy modal |
| Full deploy flow           | Set governor in chainConfig, connect wallet, submit (or complete draft) |
| Validation                 | Empty/invalid fields → button disabled         |
| Errors                     | No wallet, reject tx, no gas                   |
| Automated tests            | `pnpm -F commonwealth test-select test/unit/prediction-markets/` |

---

## Notes

- **Governor address (chainConfig):** Set `FutarchyGovernor` in `libs/evm-protocols/src/common-protocol/chainConfig.ts` for the chain. The value is currently `ZERO_ADDRESS` for Base Sepolia and **must be updated** when the Futarchy governor contract is deployed. Without a non-zero address, only drafts are created; “Complete deployment” stays disabled until configured.
- **Chain:** Use a community whose chain matches the governor config (e.g. Base Sepolia 84532).
- **One market per thread:** After a market exists (draft or deployed), the “Add a prediction market” card is replaced by the **Prediction market** card. For a draft, the thread author sees **“Complete deployment”** to deploy on-chain later.
