# Undocumented & Implemented Features

This document outlines features, logic, and implementations present in the codebase that are **not** explicitly detailed in the main `README.md`.

## 1. Dynamic Authorizer Management
While the README mentions there is an `onlyAuthorizer` restriction, it does not document that the contract includes a dynamic `setAuthorizer(address account, bool isAuthorized)` function. 
*   **Implementation:** The `contractOwner` can dynamically add or revoke authorizers at any time without needing to redeploy the contract. This is crucial for onboarding new verifying entities (like new banks or universities).

## 2. Cryptographic Details for the Profile Hash
The README mentions a generic `profileHash`. However, the exact cryptographic mapping is explicitly implemented in the test and simulation modules (`IdentityVerification.test.js` and `simulate.js`).
*   **Implementation:** The code uses `web3.utils.soliditySha3` to construct a hash directly combining three specific, distinct strings: 
    *   **Name** (e.g., "Alice")
    *   **Date of Birth** (e.g., "2004-05-15")
    *   **College ID / SRN / PRN** (e.g., "PES1202001234")
    This tightly binds the student identity scope specifically to the generated user hash.

## 3. EIP-191 Compliant Signatures
The README briefly mentions "signature authorization" and lists the function names (`verifyAuthorization`).
*   **Implementation:** The actual Solidity contract handles complex signature parsing natively using `v`, `r`, and `s` byte segments from an ECDSA signature, employing `ecrecover` to extract the signing address. It parses standard `Ethereum Signed Message` headers to guarantee cross-compatibility with wallets like MetaMask.

## 4. `identityId` Keccak256 Generation
The README mentions `identityId` exists in the `Identity` struct, but doesn't explain how it is secured.
*   **Implementation:** Inside `IdentityVerification.sol`, the unique identity token is generated via: `keccak256(abi.encodePacked(msg.sender, profileHash, block.timestamp, block.prevrandao))`. This ensures that even identical payloads produce totally unique, un-mineable IDs on registration.

## 5. Extensive Test Coverage (Reverting Flows)
The README simply says "Truffle tests (behavior checks)". 
*   **Implementation:** The `test/` directory actively enforces state reversions. It implements scenarios to forcefully catch failures, including:
    *   `blocks duplicate registration`: Reverts if an existing user tries to sign up twice.
    *   `blocks unauthorized verifier`: Reverts if a non-authorizer tries to approve an identity.

---

## Complete Project File Tree

```text
blockchain_project/
|-- .git/                              (Git repository configuration)
|-- .gitignore                         (Ignored file patterns for Git)
|-- DEMO.md                            (Script and walk-through for a live demo)
|-- QUICKSTART.md                      (Cheat sheet for quick deployment/testing)
|-- README.md                          (Main project documentation)
|-- rubrics.txt                        (Project prompt & rubric constraints)
|-- truffle-config.js                  (Truffle network and compiler configurations)
|-- package.json                       (Node.js dependencies and script shortcuts)
|-- package-lock.json                  (Dependency tree lockfile)
|
|-- contracts/
|   `-- IdentityVerification.sol       (Core Smart Contract logic)
|
|-- migrations/
|   `-- 1_deploy_identity_verification.js (Deployment script)
|
|-- node_modules/                      (Installed npm packages)
|
|-- scripts/
|   `-- simulate.js                    (Simulation script for interactive backend walkthrough)
|
|-- test/
    `-- IdentityVerification.test.js   (Mocha/Chai tests for contract behavior)
```
