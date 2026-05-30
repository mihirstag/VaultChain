# Live Demo Script (Professor Presentation)

This guide is designed for a **fully interactive demo** using Truffle + Ganache + MetaMask.

## Demo Goal

Show this end-to-end behavior live:
1. User registers identity
2. Verifier approves identity
3. Service checks verified status
4. Unauthorized verifier attempt fails
5. User updates identity and status resets

---

## Pre-Demo Checklist (5 min before class)

- Ganache installed and opens correctly
- MetaMask installed in browser
- Project dependencies installed (`npm.cmd install`)
- Terminal opened in project root

---

## Terminal Commands You Will Run

### Command 1: Compile

```bash
npm.cmd run compile
```

### Command 2: Deploy on local Ganache

```bash
npm.cmd run deploy:local
```

### Command 3: Show automated behavior checks

```bash
npm.cmd run test:local
```

### Command 4: Show guided simulation output

```bash
npm.cmd run simulate
```

---

## Part A — Start Local Chain (Ganache)

1. Open Ganache GUI.
2. Start Quickstart workspace.
3. Confirm RPC endpoint is `http://127.0.0.1:7545`.
4. Keep Ganache open during full demo.

What to point out:
- 10 funded local accounts
- local chain blocks/transactions update in real time

---

## Part B — Deploy Contract with Truffle

Run:

```bash
npm.cmd run deploy:local
```

What to say:
- "This migration deploys `IdentityVerification` to local Ganache."
- "The backend logic lives in smart contract functions, not centralized server code."

---

## Part C — Run Tests (Behavior Proof)

Run:

```bash
npm.cmd run test:local
```

Explain while tests run:
- Register identity works
- Duplicate registration blocked
- Only authorizers can verify
- Updating identity resets status
- End-to-end flow works

What to emphasize:
- deterministic, repeatable backend behavior
- contract-level access control

---

## Part D — Interactive Wallet Demo (MetaMask)

### 1) Connect MetaMask to Ganache

In MetaMask, add custom network:
- Network name: `Ganache Local`
- RPC URL: `http://127.0.0.1:7545`
- Chain ID: `1337`
- Currency symbol: `ETH`

### 2) Import Ganache accounts

- Copy private key of Ganache account 0 and import into MetaMask
- Copy private key of Ganache account 1 and import into MetaMask

Use roles:
- Account 0 = Owner/Verifier
- Account 1 = User

### 3) Do live function calls (via Truffle console)

Run:

```bash
npm.cmd run console
```

Then execute:

```javascript
const c = await IdentityVerification.deployed()
const accounts = await web3.eth.getAccounts()

// User registers
const hash1 = web3.utils.soliditySha3("Alice", "2004-05-15", "PES1202001234")
await c.registerIdentity(hash1, "ipfs://alice-v1", { from: accounts[1] })
await c.getIdentity(accounts[1])

// Verifier approves
await c.reviewIdentity(accounts[1], true, "Documents valid", { from: accounts[0] })
await c.isIdentityVerified(accounts[1])

// Unauthorized user attempt (should fail)
try { await c.reviewIdentity(accounts[1], true, "fake", { from: accounts[2] }) } catch (e) { console.log("Unauthorized blocked") }

// User updates identity -> back to Unverified
const hash2 = web3.utils.soliditySha3("Alice", "2004-05-15", "PES1202001234-NEW")
await c.updateIdentity(hash2, "ipfs://alice-v2", { from: accounts[1] })
await c.getIdentity(accounts[1])
```

---

## Part E — Explain Backend Internals (Short)

Contract highlights:
- `registerIdentity` creates decentralized identity record
- `reviewIdentity` enforces verifier-controlled approval/rejection
- `isIdentityVerified` is an integration gate for services
- `updateIdentity` enforces re-verification after profile changes
- `buildAuthorizationDigest / consumeAuthorization` support signed consent with nonce/deadline

Privacy model:
- On-chain: hashes + URIs only
- Off-chain: encrypted docs

---

## Suggested 8-Minute Talk Track

1. "Ganache is our local blockchain."
2. "Truffle deploys and tests the Solidity backend."
3. "User registers identity hash, verifier approves."
4. "Unauthorized verifier attempts are rejected on-chain."
5. "If identity data changes, verification resets automatically."
6. "This gives decentralized, auditable, privacy-preserving identity verification."

---

## If Something Fails (Fast Recovery)

1. Restart Ganache and re-run:
   - `npm.cmd run deploy:local`
2. If local tests cannot connect:
   - verify Ganache is listening on `127.0.0.1:7545`
3. If MetaMask not working:
   - ensure selected network is Ganache Local
   - re-import Ganache private key

---

## Backup Non-Interactive Demo (1 command)

If time is short, run:

```bash
npm.cmd run simulate
```

It prints the complete contract flow and proves backend behavior in one run.
