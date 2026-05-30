# Blockchain-Based Identity Verification

Decentralized identity verification project with a Solidity smart contract and a React + Vite frontend that demonstrates end-to-end user registration, verifier approval, and third-party proof validation.

## Frontend Overview

The frontend in `client/` is an institutional portal with three workflows:

1. Registration
   - Student enters Name, DOB, and College ID.
   - The app hashes these values locally and sends only the hash to the contract.

2. Verifier Dashboard
   - Admin/verifier searches a wallet address.
   - App fetches on-chain identity status and allows approve/reject for unverified identities.

3. Bank / Services
   - Student generates a signed JSON proof for a specific purpose.
   - Third party pastes JSON and verifies signature validity against on-chain logic.

## Tech Stack

- Smart contract: Solidity `0.8.20`
- Blockchain tooling: Truffle
- Local blockchain: Ganache (`127.0.0.1:7545`)
- Frontend: React + Vite + Ethers.js
- Wallet: MetaMask

## Prerequisites

1. Node.js 18+ (LTS recommended)
2. Ganache (GUI or CLI)
3. MetaMask extension in browser

Verify installation:

```bash
node -v
npm -v
```

## Install Requirements

Run both installs: root dependencies for Truffle and frontend dependencies for React/Vite.

From project root:

```bash
npm install
cd client
npm install
```

If PowerShell blocks `npm`, use `npm.cmd`.

## How To Run (Full Frontend Demo)

### 1) Start Ganache

- Launch Ganache and keep RPC at `http://127.0.0.1:7545`.

### 2) Compile and deploy contract

From project root:

```bash
npm run compile
npm run deploy:local
```

### 3) Sync frontend contract address and ABI

After deployment, update frontend contract references:

1. Update `CONTRACT_ADDRESS` in `client/src/App.jsx` with the newly deployed address.
2. Ensure `client/src/contractABI.json` contains the ABI for the deployed `IdentityVerification` contract.
   - Source artifact: `build/contracts/IdentityVerification.json` (use its `abi` field).

### 4) Start frontend app

```bash
cd client
npm run dev
```

Open the Vite URL shown in terminal (default is usually `http://localhost:5173`).

### 5) Connect MetaMask

Configure MetaMask network:

- RPC URL: `http://127.0.0.1:7545`
- Chain ID: `1337`
- Currency Symbol: `ETH`

Import Ganache accounts and use:

- Account 0 as Owner/Verifier
- Account 1 as Student/User

## How The Frontend Works

### A) Registration flow

1. User connects wallet.
2. App computes `profileHash = keccak256(name, dob, collegeId)` using Ethers.
3. App calls `registerIdentity(profileHash, metadataURI)`.
4. On confirmation, identity is stored on-chain as `Unverified`.

### B) Verifier flow

1. Verifier opens Verifier Dashboard.
2. Enters student wallet address.
3. App calls `getIdentity(address)`.
4. For `Unverified` identities, verifier can call `reviewIdentity(address, true/false, reason)`.
5. Status updates to `Verified` or `Rejected`.

### C) Third-party proof flow

1. Student enters purpose (example: Bank Loan).
2. App creates `purposeHash`, `nonce`, and `deadline`.
3. App calls `buildAuthorizationDigest(...)` and signs digest in MetaMask.
4. App packages proof as JSON with `user`, `purposeHash`, `nonce`, `deadline`, `v`, `r`, `s`.
5. Third party pastes JSON and app calls `verifyAuthorization(...)`.
6. UI shows signature validity result.

## Frontend Features Implemented

- MetaMask wallet connection with connected-account badge
- Multi-tab workflow UI: Registration, Verifier Dashboard, Bank/Services
- Local hashing of user details before blockchain submission
- On-chain identity lookup by wallet address
- Approve/Reject controls for verifier role
- Status mapping and color-coded verification state
- Signed access-proof generator for purpose-based authorization
- JSON proof verification tool for external services
- Responsive split layout for third-party workflow on mobile and desktop

## Project Structure

```text
blockchain_project/
|-- contracts/
|   `-- IdentityVerification.sol
|-- migrations/
|   `-- 1_deploy_identity_verification.js
|-- scripts/
|   `-- simulate.js
|-- test/
|   `-- IdentityVerification.test.js
|-- build/
|   `-- contracts/
|       `-- IdentityVerification.json
|-- truffle-config.js
|-- package.json
|-- README.md
|-- QUICKSTART.md
|-- DEMO.md
|-- client/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- App.css
|   |   |-- main.jsx
|   |   |-- index.css
|   |   `-- contractABI.json
|   |-- public/
|   |-- contracts/
|   |   `-- IdentityVerification.sol
|   |-- migrations/
|   |   `-- 1_deploy_identity_verification.js
|   |-- scripts/
|   |   `-- simulate.js
|   |-- package.json
|   |-- vite.config.js
|   `-- index.html
`-- UNDOCUMENTED_FEATURES.md
```

## Useful Commands

Root (Truffle):

```bash
npm run compile
npm run deploy:local
npm run test
npm run test:local
npm run console
npm run simulate
```

Frontend (`client`):

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Troubleshooting

1. `Could not connect to 127.0.0.1:7545`
   - Start Ganache and confirm port 7545 is active.

2. MetaMask opens but transactions fail
   - Ensure MetaMask is on Ganache network and not Mainnet/Sepolia.

3. Frontend calls revert after redeployment
   - Update `CONTRACT_ADDRESS` in `client/src/App.jsx` and refresh ABI in `client/src/contractABI.json`.

4. Verifier actions fail with role/authorizer errors
   - Use the owner or authorized verifier account from Ganache.

5. PowerShell does not run npm scripts
   - Use `npm.cmd` variants, for example `npm.cmd run dev`.
