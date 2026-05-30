const IdentityVerification = artifacts.require("IdentityVerification");

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0];
    const user = accounts[1];

    const contract = await IdentityVerification.deployed();

    const profileHash = web3.utils.soliditySha3(
      { type: "string", value: "Demo User" },
      { type: "string", value: "2004-05-15" },
      { type: "string", value: "PES1202009999" }
    );

    const metadataURI = "ipfs://demo-user-encrypted-profile";

    console.log("\n=== TRUFFLE + GANACHE CONTRACT SIMULATION ===");
    console.log("Contract:", contract.address);
    console.log("Owner/Verifier:", owner);
    console.log("User:", user);

    console.log("\n1) Register identity");
    await contract.registerIdentity(profileHash, metadataURI, { from: user });

    let identity = await contract.getIdentity(user);
    console.log("   status after registration:", identity.status.toString(), "(Unverified)");

    console.log("\n2) Verify identity by authorizer");
    await contract.reviewIdentity(user, true, "Documents validated", { from: owner });

    identity = await contract.getIdentity(user);
    console.log("   status after review:", identity.status.toString(), "(Verified)");

    console.log("\n3) Verification gate check");
    const isVerified = await contract.isIdentityVerified(user);
    console.log("   isIdentityVerified:", isVerified);

    console.log("\n4) Build authorization digest");
    const purposeHash = web3.utils.soliditySha3("demo-service-access");
    const nonce = (await contract.nonces(user)).toNumber();
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const digest = await contract.buildAuthorizationDigest(user, purposeHash, nonce, deadline);

    console.log("   purposeHash:", purposeHash);
    console.log("   nonce:", nonce);
    console.log("   deadline:", deadline);
    console.log("   digest:", digest);

    console.log("\nSimulation complete. Your contract is running correctly on local Ganache.\n");
    callback();
  } catch (error) {
    callback(error);
  }
};
