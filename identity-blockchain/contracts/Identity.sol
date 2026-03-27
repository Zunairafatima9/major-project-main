// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Identity {
    
    address public admin;

    // Identity hash stored by user address
    mapping(address => string) public identityHash;
    
    // Verification status
    mapping(address => bool) public verified;

    // Events (very important for frontend + AI fraud detection off-chain)
    event IdentityRegistered(address indexed user, string identityHash);
    event IdentityVerified(address indexed user, address indexed verifiedBy);
    event IdentityRevoked(address indexed user, address indexed revokedBy);

    constructor() {
        admin = msg.sender;
    }

    // Modifier for admin-only functions
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    /**
     * @notice User registers their own identity hash (e.g., IPFS hash of documents + AI score)
     */
    function registerIdentity(string memory _hash) public {
        require(bytes(_hash).length > 0, "Identity hash cannot be empty");
        
        identityHash[msg.sender] = _hash;
        verified[msg.sender] = false;   // Default: not verified until admin approves

        emit IdentityRegistered(msg.sender, _hash);
    }

    /**
     * @notice Admin registers identity hash for a user (server-side verification)
     */
    function adminRegisterIdentity(address user, string memory _hash) public onlyAdmin {
        require(user != address(0), "Invalid user address");
        require(bytes(_hash).length > 0, "Identity hash cannot be empty");
        
        identityHash[user] = _hash;
        verified[user] = false;   // Default: not verified until admin approves

        emit IdentityRegistered(user, _hash);
    }

    /**
     * @notice Admin verifies a registered identity.
     */
    function verifyIdentity(address user) public onlyAdmin {
        require(user != address(0), "Invalid user address");
        require(bytes(identityHash[user]).length > 0, "Identity not registered");
        require(!verified[user], "Identity already verified");

        verified[user] = true;
        emit IdentityVerified(user, msg.sender);
    }


    /**
     * @notice Admin can revoke verification (e.g., if AI fraud detection flags suspicious activity)
     */
    function revokeVerification(address user) public onlyAdmin {
        require(verified[user] == true, "User is not verified");
        
        verified[user] = false;
        emit IdentityRevoked(user, msg.sender);
    }

    /**
     * @notice Anyone can check verification status
     */
    function getStatus(address user) public view returns (bool) {
        return verified[user];
    }

    /**
     * @notice Get the identity hash of a user
     */
    function getIdentityHash(address user) public view returns (string memory) {
        return identityHash[user];
    }

    /**
     * @notice Check if caller is admin (useful for frontend)
     */
    function isAdmin() public view returns (bool) {
        return msg.sender == admin;
    }
}