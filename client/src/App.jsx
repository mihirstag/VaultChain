import { useState } from 'react';
import { ethers } from 'ethers';
import abiData from './contractABI.json';
import './App.css';

const DEFAULT_CONTRACT_ADDRESS = "0xE0bEAb30C94aB43FF48f9A387A96Fb9279Db9859";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;

// Maps the numeric status from Solidity to text
const STATUS_MAP = ["Unverified", "Verified", "Rejected", "Revoked"];

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [formData, setFormData] = useState({ name: '', dob: '', collegeId: '' });

  // --- View and Admin States ---
  const [currentView, setCurrentView] = useState('register'); // 'register', 'admin', or 'thirdParty'
  const [searchAddress, setSearchAddress] = useState('');
  const [fetchedIdentity, setFetchedIdentity] = useState(null);

  // --- NEW: Third-Party Service States ---
  const [purpose, setPurpose] = useState('');
  const [generatedProof, setGeneratedProof] = useState('');
  const [proofToVerify, setProofToVerify] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await web3Provider.send("eth_requestAccounts", []);
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        
        setAccount(address);
        
        const identityContract = new ethers.Contract(CONTRACT_ADDRESS, abiData, signer);
        setContract(identityContract);
      } catch (error) {
        console.error("Connection failed:", error);
      }
    } else {
      alert("Please install MetaMask and log into your Ganache network!");
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 1. STUDENT REGISTRATION ---
  const registerIdentity = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Please connect your wallet first!");

    try {
      const profileHash = ethers.utils.solidityKeccak256(
        ["string", "string", "string"], 
        [formData.name, formData.dob, formData.collegeId]
      );

      console.log("Generated Hash for Blockchain:", profileHash);
      
      const tx = await contract.registerIdentity(profileHash, "ipfs://student-encrypted-profile");
      
      alert("Transaction sent! Waiting for confirmation from Ganache...");
      await tx.wait();
      alert("Success! Your digital identity has been registered on the blockchain.");
      
    } catch (error) {
      console.error(error);
      alert("Registration failed. Have you already registered an identity with this wallet?");
    }
  };

  // --- 2. ADMIN VERIFICATION ---
  const fetchIdentity = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet first!");

    try {
      const data = await contract.getIdentity(searchAddress);
      setFetchedIdentity(data);
    } catch (error) {
      console.error(error);
      alert("Could not fetch identity. Make sure the address is correct.");
    }
  };

  const reviewIdentity = async (isApproved) => {
    try {
      const reason = isApproved ? "Documents Validated" : "Information Mismatch";
      const tx = await contract.reviewIdentity(searchAddress, isApproved, reason);
      
      alert(`Transaction sent! Marking as ${isApproved ? 'Approved' : 'Rejected'}...`);
      await tx.wait();
      alert("Identity status updated successfully!");
      
      fetchIdentity({ preventDefault: () => {} }); // Refresh the displayed data
    } catch (error) {
      console.error(error);
      alert("Action failed! Ensure you are logged in as the Admin (Ganache Account 1).");
    }
  };

  // --- 3. NEW: GENERATE PROOF (Student Side) ---
  const generateAccessProof = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet first!");

    try {
      // Re-initialize signer for this specific transaction
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const currentSigner = web3Provider.getSigner();

      // Hash the purpose (e.g., "Bank Loan")
      const purposeHash = ethers.utils.solidityKeccak256(["string"], [purpose]);
      
      // Generate a random nonce and a deadline (valid for 1 hour)
      const nonce = Math.floor(Math.random() * 1000000);
      const deadline = Math.floor(Date.now() / 1000) + 3600; 

      // Ask the contract to build the secure digest
      const digest = await contract.buildAuthorizationDigest(account, purposeHash, nonce, deadline);

      // Student signs the digest with their MetaMask wallet
      const signature = await currentSigner.signMessage(ethers.utils.arrayify(digest));
      
      // Split the signature into v, r, s (required by Solidity)
      const sigParams = ethers.utils.splitSignature(signature);

      // Package the proof as a JSON string
      const proofObj = {
        user: account,
        purposeHash: purposeHash,
        nonce: nonce,
        deadline: deadline,
        v: sigParams.v,
        r: sigParams.r,
        s: sigParams.s
      };

      setGeneratedProof(JSON.stringify(proofObj, null, 2));
      alert("Proof generated successfully! You can now copy this JSON.");
    } catch (error) {
      console.error(error);
      alert("Failed to generate proof. Ensure your identity is 'Verified' by the Admin first!");
    }
  };

  // --- 4. NEW: VERIFY PROOF (Bank Side) ---
  const verifyAccessProof = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet first!");

    try {
      const proof = JSON.parse(proofToVerify);

      // Call the contract to verify the student's signature
      const isValid = await contract.verifyAuthorization(
        proof.user,
        proof.purposeHash,
        proof.nonce,
        proof.deadline,
        proof.v,
        proof.r,
        proof.s
      );

      setVerificationResult(isValid);
    } catch (error) {
      console.error(error);
      setVerificationResult(false);
      alert("Invalid JSON format or verification failed.");
    }
  };

  return (
    <div className="dark-theme-container">
      <header className="nav-bar">
        <h1>Institution Identity Portal</h1>
        
        {/* --- Navigation Tabs --- */}
        <div className="tabs">
          <button className={currentView === 'register' ? 'active-tab' : ''} onClick={() => setCurrentView('register')}>Registration</button>
          <button className={currentView === 'admin' ? 'active-tab' : ''} onClick={() => setCurrentView('admin')}>Verifier Dashboard</button>
          <button className={currentView === 'thirdParty' ? 'active-tab' : ''} onClick={() => setCurrentView('thirdParty')}>Bank / Services</button>
        </div>

        {!account ? (
          <button onClick={connectWallet} className="btn-primary">Connect MetaMask</button>
        ) : (
          <span className="wallet-badge">🟢 Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
        )}
      </header>

      <main className="content">
        
        {/* VIEW 1: REGISTRATION */}
        {currentView === 'register' && (
          <section className="card">
            <h2>Register Digital Identity</h2>
            <p className="subtext">Your details are hashed securely. Only cryptographic proof is sent to the ledger.</p>
            
            <form onSubmit={registerIdentity} className="form-group">
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Full Name (e.g., Alice)" />
              <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
              <input type="text" name="collegeId" value={formData.collegeId} onChange={handleInputChange} required placeholder="College ID (e.g., PES1UG23CS361)" />
              <button type="submit" disabled={!account} className="btn-submit">Submit to Blockchain</button>
            </form>
          </section>
        )}

        {/* VIEW 2: ADMIN VERIFICATION */}
        {currentView === 'admin' && (
          <section className="card admin-card">
            <h2>Verifier Dashboard</h2>
            <p className="subtext">Look up a student's wallet address to verify their identity.</p>
            
            <form onSubmit={fetchIdentity} className="form-group row-form">
              <input type="text" value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} required placeholder="Enter Wallet Address (0x...)" />
              <button type="submit" disabled={!account} className="btn-primary">Search</button>
            </form>

            {fetchedIdentity && fetchedIdentity.exists && (
              <div className="identity-results">
                <p><strong>Status:</strong> <span className={`status-${STATUS_MAP[fetchedIdentity.status]}`}>{STATUS_MAP[fetchedIdentity.status]}</span></p>
                <p><strong>Profile Hash:</strong> {fetchedIdentity.profileHash.slice(0, 15)}...</p>
                
                {/* 0 indicates 'Unverified' */}
                {fetchedIdentity.status === 0 && (
                  <div className="admin-actions">
                    <button onClick={() => reviewIdentity(true)} className="btn-approve">Approve</button>
                    <button onClick={() => reviewIdentity(false)} className="btn-reject">Reject</button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: THIRD-PARTY SERVICES */}
        {currentView === 'thirdParty' && (
          <div className="split-view">
            {/* Left Side: Student generates proof */}
            <section className="card">
              <h2>1. Generate Access Proof (Student)</h2>
              <p className="subtext">Create a cryptographically signed ticket for a service (e.g., "Bank Loan").</p>
              <form onSubmit={generateAccessProof} className="form-group">
                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} required placeholder="Purpose (e.g., Bank Loan)" />
                <button type="submit" disabled={!account} className="btn-primary">Sign & Generate Ticket</button>
              </form>
              
              {generatedProof && (
                <div className="proof-output">
                  <p>Copy this JSON ticket:</p>
                  <textarea readOnly value={generatedProof} rows={8}></textarea>
                </div>
              )}
            </section>

            {/* Right Side: Bank verifies proof */}
            <section className="card">
              <h2>2. Verify Identity (Bank)</h2>
              <p className="subtext">Paste the student's JSON ticket to cryptographically verify their identity via the blockchain.</p>
              <form onSubmit={verifyAccessProof} className="form-group">
                <textarea 
                  value={proofToVerify} 
                  onChange={(e) => setProofToVerify(e.target.value)} 
                  required 
                  placeholder="Paste JSON proof here..." 
                  rows={8}
                ></textarea>
                <button type="submit" disabled={!account} className="btn-submit">Check Validity</button>
              </form>

              {verificationResult !== null && (
                <div className={`verification-badge ${verificationResult ? 'valid' : 'invalid'}`}>
                  {verificationResult ? "✅ SIGNATURE VALID - Identity Confirmed" : "❌ SIGNATURE INVALID - Do Not Trust"}
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;