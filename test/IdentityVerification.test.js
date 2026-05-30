const IdentityVerification = artifacts.require("IdentityVerification");

contract("IdentityVerification", (accounts) => {
  const owner = accounts[0];
  const user = accounts[1];
  const unauthorized = accounts[2];

  let contract;

  const hashProfile = (name, dob, collegeId) =>
    web3.utils.soliditySha3(
      { type: "string", value: name },
      { type: "string", value: dob },
      { type: "string", value: collegeId }
    );

  beforeEach(async () => {
    contract = await IdentityVerification.new({ from: owner });
  });

  it("registers a user identity", async () => {
    const profileHash = hashProfile("Alice", "2004-05-15", "PES1202001234");
    const metadataURI = "ipfs://alice-doc";

    const tx = await contract.registerIdentity(profileHash, metadataURI, { from: user });
    assert.equal(tx.logs[0].event, "IdentityRegistered");

    const identity = await contract.getIdentity(user);
    assert.equal(identity.profileHash, profileHash);
    assert.equal(identity.metadataURI, metadataURI);
    assert.equal(identity.status.toNumber(), 0);

    console.log("✓ registerIdentity works");
  });

  it("blocks duplicate registration", async () => {
    const profileHash = hashProfile("Alice", "2004-05-15", "PES1202001234");
    await contract.registerIdentity(profileHash, "ipfs://alice-doc", { from: user });

    try {
      await contract.registerIdentity(profileHash, "ipfs://alice-doc", { from: user });
      assert.fail("Expected revert for duplicate registration");
    } catch (error) {
      assert.include(error.message, "Identity already exists");
    }

    console.log("✓ duplicate registration is blocked");
  });

  it("allows authorizer to approve identity", async () => {
    const profileHash = hashProfile("Bob", "2003-11-21", "PES1202002222");
    await contract.registerIdentity(profileHash, "ipfs://bob-doc", { from: user });

    const tx = await contract.reviewIdentity(user, true, "Documents valid", { from: owner });
    assert.equal(tx.logs[0].event, "IdentityVerificationUpdated");

    const isVerified = await contract.isIdentityVerified(user);
    assert.equal(isVerified, true);

    console.log("✓ reviewIdentity approval works");
  });

  it("blocks unauthorized verifier", async () => {
    const profileHash = hashProfile("Carol", "2002-10-10", "PES1202003333");
    await contract.registerIdentity(profileHash, "ipfs://carol-doc", { from: user });

    try {
      await contract.reviewIdentity(user, true, "Fake verification", { from: unauthorized });
      assert.fail("Expected revert for unauthorized verifier");
    } catch (error) {
      assert.include(error.message, "Not an authorizer");
    }

    console.log("✓ unauthorized verifier is blocked");
  });

  it("resets status to Unverified on identity update", async () => {
    const initialHash = hashProfile("Dave", "2001-01-01", "PES1202004444");
    await contract.registerIdentity(initialHash, "ipfs://dave-v1", { from: user });
    await contract.reviewIdentity(user, true, "Verified once", { from: owner });

    const updatedHash = hashProfile("Dave", "2001-01-01", "PES1202004444-NEW");
    await contract.updateIdentity(updatedHash, "ipfs://dave-v2", { from: user });

    const identity = await contract.getIdentity(user);
    assert.equal(identity.status.toNumber(), 0);
    assert.equal(identity.profileHash, updatedHash);

    console.log("✓ updateIdentity resets verification state");
  });

  it("runs end-to-end flow: register -> verify -> authorization digest", async () => {
    const profileHash = hashProfile("Eve", "2000-09-09", "PES1202005555");
    await contract.registerIdentity(profileHash, "ipfs://eve-doc", { from: user });
    await contract.reviewIdentity(user, true, "KYC passed", { from: owner });

    const purposeHash = web3.utils.soliditySha3("bank_transfer");
    const nonce = 0;
    const now = Math.floor(Date.now() / 1000);
    const deadline = now + 3600;

    const digest = await contract.buildAuthorizationDigest(user, purposeHash, nonce, deadline);
    assert.isTrue(digest.startsWith("0x"));
    assert.equal((await contract.nonces(user)).toNumber(), 0);

    console.log("✓ E2E flow works: register -> verify -> buildAuthorizationDigest");
  });
});
