# QUICKSTART (Viva Cheat Sheet)

Use this for a fast, interactive professor demo.

## 1) One-time setup

```bash
cd "d:\PESU-3rd Year\BC\bc_id"
npm.cmd install
```

## 2) Demo command sequence (exact order)

1. Start Ganache GUI (Quickstart workspace), keep it running at `127.0.0.1:7545`.
2. Run compile:

```bash
npm.cmd run compile
```

3. Deploy to local Ganache:

```bash
npm.cmd run deploy:local
```

4. Run behavior tests on local chain:

```bash
npm.cmd run test:local
```

5. Run single-shot backend simulation:

```bash
npm.cmd run simulate
```

## 3) Interactive live calls (Truffle console)

```bash
npm.cmd run console
```

Then run:

```javascript
const c = await IdentityVerification.deployed()
const a = await web3.eth.getAccounts()
const h1 = web3.utils.soliditySha3("Alice", "2004-05-15", "PES1202001234")
await c.registerIdentity(h1, "ipfs://alice-v1", { from: a[1] })
await c.reviewIdentity(a[1], true, "Documents valid", { from: a[0] })
await c.isIdentityVerified(a[1])
```

## 4) MetaMask role mapping

- Import Ganache Account 0 private key → Owner/Verifier
- Import Ganache Account 1 private key → User
- Network: RPC `http://127.0.0.1:7545`, Chain ID `1337`

## 5) 30-second explanation script

- User registers identity hash + metadata URI.
- Verifier approves identity via role-controlled function.
- Unauthorized verifier calls are rejected on-chain.
- Updating identity resets status for re-verification.
- Result: decentralized, auditable, privacy-preserving identity flow.

## 6) If something breaks

1. Restart Ganache.
2. Re-run:

```bash
npm.cmd run deploy:local
npm.cmd run test:local
```

3. If PowerShell blocks npm scripts, always use `npm.cmd`.

## 7) Reference docs

- Full guide: [README.md](README.md)
- Live demo script: [DEMO.md](DEMO.md)
