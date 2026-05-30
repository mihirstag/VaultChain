// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IdentityVerification {
    enum VerificationStatus {
        Unverified,
        Verified,
        Rejected,
        Revoked
    }

    struct Identity {
        address owner;
        bytes32 identityId;
        bytes32 profileHash;
        string metadataURI;
        VerificationStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    address public contractOwner;

    mapping(address => Identity) private identities;
    mapping(bytes32 => address) public identityOwner;
    mapping(address => bool) public authorizers;
    mapping(address => uint256) public nonces;

    event AuthorizerUpdated(address indexed authorizer, bool isAuthorized);
    event IdentityRegistered(address indexed user, bytes32 indexed identityId, bytes32 profileHash, string metadataURI);
    event IdentityUpdated(address indexed user, bytes32 newProfileHash, string newMetadataURI);
    event IdentityVerificationUpdated(address indexed user, VerificationStatus status, string reason, address indexed verifier);
    event IdentityRevoked(address indexed user);
    event AuthorizationConsumed(address indexed user, bytes32 indexed purposeHash, uint256 nonce, address indexed verifier);

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only owner");
        _;
    }

    modifier onlyAuthorizer() {
        require(authorizers[msg.sender], "Not an authorizer");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
        authorizers[msg.sender] = true;
    }

    function setAuthorizer(address account, bool isAuthorized) external onlyOwner {
        require(account != address(0), "Invalid address");
        authorizers[account] = isAuthorized;
        emit AuthorizerUpdated(account, isAuthorized);
    }

    function registerIdentity(bytes32 profileHash, string calldata metadataURI) external {
        require(!identities[msg.sender].exists, "Identity already exists");
        require(profileHash != bytes32(0), "Invalid profile hash");

        bytes32 newIdentityId = keccak256(abi.encodePacked(msg.sender, profileHash, block.timestamp, block.prevrandao));

        Identity storage identity = identities[msg.sender];
        identity.owner = msg.sender;
        identity.identityId = newIdentityId;
        identity.profileHash = profileHash;
        identity.metadataURI = metadataURI;
        identity.status = VerificationStatus.Unverified;
        identity.createdAt = block.timestamp;
        identity.updatedAt = block.timestamp;
        identity.exists = true;

        identityOwner[newIdentityId] = msg.sender;

        emit IdentityRegistered(msg.sender, newIdentityId, profileHash, metadataURI);
    }

    function updateIdentity(bytes32 newProfileHash, string calldata newMetadataURI) external {
        Identity storage identity = identities[msg.sender];
        require(identity.exists, "Identity not found");
        require(identity.status != VerificationStatus.Revoked, "Identity revoked");
        require(newProfileHash != bytes32(0), "Invalid profile hash");

        identity.profileHash = newProfileHash;
        identity.metadataURI = newMetadataURI;
        identity.status = VerificationStatus.Unverified;
        identity.updatedAt = block.timestamp;

        emit IdentityUpdated(msg.sender, newProfileHash, newMetadataURI);
    }

    function reviewIdentity(address user, bool approved, string calldata reason) external onlyAuthorizer {
        Identity storage identity = identities[user];
        require(identity.exists, "Identity not found");
        require(identity.status != VerificationStatus.Revoked, "Identity revoked");

        identity.status = approved ? VerificationStatus.Verified : VerificationStatus.Rejected;
        identity.updatedAt = block.timestamp;

        emit IdentityVerificationUpdated(user, identity.status, reason, msg.sender);
    }

    function revokeOwnIdentity() external {
        Identity storage identity = identities[msg.sender];
        require(identity.exists, "Identity not found");

        identity.status = VerificationStatus.Revoked;
        identity.updatedAt = block.timestamp;

        emit IdentityRevoked(msg.sender);
    }

    function getIdentity(address user)
        external
        view
        returns (
            bytes32 identityId,
            bytes32 profileHash,
            string memory metadataURI,
            VerificationStatus status,
            uint256 createdAt,
            uint256 updatedAt,
            bool exists
        )
    {
        Identity storage identity = identities[user];
        return (
            identity.identityId,
            identity.profileHash,
            identity.metadataURI,
            identity.status,
            identity.createdAt,
            identity.updatedAt,
            identity.exists
        );
    }

    function isIdentityVerified(address user) external view returns (bool) {
        return identities[user].exists && identities[user].status == VerificationStatus.Verified;
    }

    function buildAuthorizationDigest(
        address user,
        bytes32 purposeHash,
        uint256 nonce,
        uint256 deadline
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, purposeHash, nonce, deadline));
    }

    function verifyAuthorization(
        address user,
        bytes32 purposeHash,
        uint256 nonce,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public view returns (bool) {
        if (block.timestamp > deadline) return false;
        if (nonce != nonces[user]) return false;
        if (!identities[user].exists || identities[user].status != VerificationStatus.Verified) return false;

        bytes32 digest = buildAuthorizationDigest(user, purposeHash, nonce, deadline);
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        return signer == user;
    }

    function consumeAuthorization(
        address user,
        bytes32 purposeHash,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyAuthorizer returns (bool) {
        uint256 currentNonce = nonces[user];
        bool valid = verifyAuthorization(user, purposeHash, currentNonce, deadline, v, r, s);
        require(valid, "Invalid authorization");

        nonces[user] = currentNonce + 1;

        emit AuthorizationConsumed(user, purposeHash, currentNonce, msg.sender);
        return true;
    }
}
