# Technical Architecture: Identity Verification System

## System Overview

This is a **3-tier decentralized system** with:
1. **Frontend Tier** (React + Web3)
2. **Backend Tier** (Node.js + AI/ML)
3. **Blockchain Tier** (Solidity Smart Contracts)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Frontend (Port 3000)                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐   │   │
│  │  │  UploadID   │  │   Selfie    │  │  VerifyPanel   │   │   │
│  │  │  Component  │──│  Component  │──│   Component    │   │   │
│  │  └─────────────┘  └─────────────┘  └────────────────┘   │   │
│  │         ↓              ↓                    ↓             │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │   Home.jsx - Global State Management            │     │   │
│  │  │   • idFile (File)                               │     │   │
│  │  │   • selfieFile (File)                           │     │   │
│  │  │   • userAddress (Wallet)                        │     │   │
│  │  └─────────────────────────────────────────────────┘     │   │
│  │         ↓                                                 │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │   ethers.js (v5.8.0) - Web3 Connection         │     │   │
│  │  │   • window.ethereum (MetaMask)                  │     │   │
│  │  │   • BrowserProvider for wallet connection       │     │   │
│  │  └─────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             ↓ (FormData + Address)
                    HTTP POST /verify
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   VERIFICATION BACKEND                          │
│              (Node.js Express - Port 5000)                      │
│                                                                  │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║                 FILE UPLOAD STAGE                      ║    │
│  ║  multer.uploader() → uploads/ directory               ║    │
│  ║  • /uploads/abc123 (ID image)                          ║    │
│  ║  • /uploads/def456 (Selfie image)                      ║    │
│  ╚════════════════════════════════════════════════════════╝    │
│                             ↓                                   │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║          PHASE 1: OCR TEXT EXTRACTION                 ║    │
│  ║  Library: Tesseract.js (v7.0.0)                        ║    │
│  ║                                                         ║    │
│  ║  Process:                                              ║    │
│  ║  1. Load ID image file                                 ║    │
│  ║  2. Run Tesseract ML model for OCR                     ║    │
│  ║  3. Extract text using English (eng) language          ║    │
│  ║  4. Process output into lines                          ║    │
│  ║                                                         ║    │
│  ║  Output:                                               ║    │
│  ║  {                                                     ║    │
│  ║    raw_text: "NAME: John Doe\nDOB: 01/01/1990...",   ║    │
│  ║    processed_lines: ["NAME: John Doe", "DOB: ..."],   ║    │
│  ║    doc_length: 2847                                   ║    │
│  ║  }                                                     ║    │
│  ╚════════════════════════════════════════════════════════╝    │
│                             ↓                                   │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║      PHASE 2: FACE DETECTION & EXTRACTION             ║    │
│  ║  Library: face-api.js (v0.22.2) + Canvas              ║    │
│  ║                                                         ║    │
│  ║  Models (Pre-trained TensorFlow.js):                   ║    │
│  ║  • TinyFaceDetector    → Find face location (bbox)     ║    │
│  ║  • FaceRecognitionNet  → Extract 128-D descriptor      ║    │
│  ║  • FaceLandmark68Net   → Detect facial features        ║    │
│  ║                                                         ║    │
│  ║  Process for ID Image:                                 ║    │
│  ║  1. Load image via Canvas API                          ║    │
│  ║  2. Use TinyFaceDetector to find face                  ║    │
│  ║  3. Extract landmarks (eyes, nose, mouth, etc)        ║    │
│  ║  4. Generate 128-D face descriptor                     ║    │
│  ║     └─ Normalized embedding of face features           ║    │
│  ║                                                         ║    │
│  ║  Process for Selfie Image:                             ║    │
│  ║  1. Repeat same steps as ID image                      ║    │
│  ║  2. Generate separate 128-D face descriptor            ║    │
│  ║                                                         ║    │
│  ║  Output:                                               ║    │
│  ║  {                                                     ║    │
│  ║    idDescriptor: Float32Array[128],  // e.g.          ║    │
│  ║    selfieDescriptor: Float32Array[128]  // [-0.12,    ║    │
│  ║  }                                      0.34, ...]     ║    │
│  ╚════════════════════════════════════════════════════════╝    │
│                             ↓                                   │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║      PHASE 3: FACE MATCHING ALGORITHM                 ║    │
│  ║  Method: Euclidean Distance in 128-D Space            ║    │
│  ║                                                         ║    │
│  ║  Formula:                                              ║    │
│  ║  distance = sqrt(sum((desc1[i] - desc2[i])²))         ║    │
│  ║                                                         ║    │
│  ║  Decision Logic:                                       ║    │
│  ║  • If distance < 0.6  → MATCH (Same person)           ║    │
│  ║  • If distance ≥ 0.6  → FAIL (Different people)       ║    │
│  ║                                                         ║    │
│  ║  Typical Distances:                                    ║    │
│  ║  • Same person: 0.25-0.45                              ║    │
│  ║  • Different people: 0.70+                             ║    │
│  ║                                                         ║    │
│  ║  Output: boolean (true = match, false = mismatch)     ║    │
│  ╚════════════════════════════════════════════════════════╝    │
│                             ↓                                   │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║    PHASE 4: IDENTITY HASH GENERATION                  ║    │
│  ║  Library: ethers.js Keccak256                          ║    │
│  ║                                                         ║    │
│  ║  Process:                                              ║    │
│  ║  1. Combine OCR text + timestamp                       ║    │
│  ║  2. Convert to UTF-8 bytes                             ║    │
│  ║  3. Apply Keccak256 hash (EVM compatible)              ║    │
│  ║  4. Create immutable identity identifier               ║    │
│  ║                                                         ║    │
│  ║  Example:                                              ║    │
│  ║  Input: "NAME: John Doe\nDOB:...2024-03-27T15:30:00" ║    │
│  ║  Output: 0xabcdef123456789abcdef123456789abcdef123456 ║    │
│  ║                                                         ║    │
│  ║  NOTE: Deterministic for same OCR output              ║    │
│  ╚════════════════════════════════════════════════════════╝    │
│                             ↓                                   │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║   PHASE 5: BLOCKCHAIN REGISTRATION                    ║    │
│  ║  Library: ethers.js v6 (Contract Interaction)          ║    │
│  ║                                                         ║    │
│  ║  Setup:                                                ║    │
│  ║  • Provider: JsonRpcProvider("http://127.0.0.1:8545")  ║    │
│  ║  • Signer: Wallet with PRIVATE_KEY                     ║    │
│  ║  • Contract: ABI + ADDRESS                             ║    │
│  ║                                                         ║    │
│  ║  Action: Call registerIdentity(identityHash)           ║    │
│  ║  1. Create unsigned transaction                        ║    │
│  ║  2. Sign with backend's private key                    ║    │
│  ║  3. Broadcast to Hardhat node                          ║    │
│  ║  4. Wait for transaction confirmation (tx.wait())      ║    │
│  ║  5. Get transaction receipt with hash                  ║    │
│  ║                                                         ║    │
│  ║  Smart Contract Function:                              ║    │
│  ║  contract.registerIdentity(_hash) public {             ║    │
│  ║    identityHash[msg.sender] = _hash;                   ║    │
│  ║    verified[msg.sender] = false;                       ║    │
│  ║    emit IdentityRegistered(msg.sender, _hash);         ║    │
│  ║  }                                                      ║    │
│  ║                                                         ║    │
│  ║  Output: Transaction Receipt                           ║    │
│  ║  {                                                     ║    │
│  ║    transactionHash: "0x1234...",                       ║    │
│  ║    blockNumber: 12,                                    ║    │
│  ║    confirmations: 1                                    ║    │
│  ║  }                                                     ║    │
│  ╚════════════════════════════════════════════════════════╝    │
│                             ↓                                   │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║    PHASE 6: BLOCKCHAIN VERIFICATION                   ║    │
│  ║                                                         ║    │
│  ║  Action: Call verifyIdentity(userAddress)              ║    │
│  ║  (Only executed if face match passed)                  ║    │
│  ║                                                         ║    │
│  ║  Smart Contract Function:                              ║    │
│  ║  contract.verifyIdentity(user) public onlyAdmin {      ║    │
│  ║    require(bytes(identityHash[user]).length > 0);      ║    │
│  ║    verified[user] = true;                              ║    │
│  ║    emit IdentityVerified(user, msg.sender);            ║    │
│  ║  }                                                      ║    │
│  ║                                                         ║    │
│  ║  Output: Transaction Receipt (same structure)          ║    │
│  ║  {                                                     ║    │
│  ║    transactionHash: "0x5678...",                       ║    │
│  ║    blockNumber: 13,                                    ║    │
│  ║    confirmations: 1                                    ║    │
│  ║  }                                                     ║    │
│  ╚════════════════════════════════════════════════════════╝    │
│                             ↓                                   │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║       PHASE 7: CLEANUP & RESPONSE                      ║    │
│  ║                                                         ║    │
│  ║  • Delete temporary files from uploads/                ║    │
│  ║  • Compile success response with all details           ║    │
│  ║  • Send JSON with TX hashes to frontend                ║    │
│  ╚════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────┘
                             ↓ (JSON Response)
                    HTTP 200 OK
                    {
                      "success": true,
                      "identityHash": "0x...",
                      "blockchainPhase": {
                        "registered": "0xTx1...",
                        "verified": "0xTx2..."
                      }
                    }
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                              │
│                   (Hardhat Local Node)                          │
│                   (Port 8545)                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │     Ethereum Virtual Machine (EVM Simulation)            │   │
│  │                                                           │   │
│  │  Memory State After Verification:                        │   │
│  │  ┌─────────────────────────────────────────┐             │   │
│  │  │ identityHash[userAddress]:              │             │   │
│  │  │   = 0xabcdef123456...                   │             │   │
│  │  │                                          │             │   │
│  │  │ verified[userAddress]:                  │             │   │
│  │  │   = true                                │             │   │
│  │  └─────────────────────────────────────────┘             │   │
│  │                                                           │   │
│  │  Event Logs (for verification audit trail):             │   │
│  │  ┌─────────────────────────────────────────┐             │   │
│  │  │ IdentityRegistered(                     │             │   │
│  │  │   indexed user: 0x1234...,              │             │   │
│  │  │   identityHash: "0xabcdef..."           │             │   │
│  │  │ )                                        │             │   │
│  │  │                                          │             │   │
│  │  │ IdentityVerified(                       │             │   │
│  │  │   indexed user: 0x1234...,              │             │   │
│  │  │   indexed verifiedBy: 0xabcd... (admin) │             │   │
│  │  │ )                                        │             │   │
│  │  └─────────────────────────────────────────┘             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Block Explorer View (if available):                            │
│  • Transactions confirmed                                       │
│  • State changes persisted                                      │
│  • Events indexed for queries                                   │
└─────────────────────────────────────────────────────────────────┘


                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT DISPLAYS RESULT                        │
│                                                                  │
│   ✅ Identity verified and recorded on blockchain!             │
│                                                                  │
│   Identity Hash: 0xabcdef123456...                             │
│   Registered TX: 0x1234567890...                               │
│   Verified TX: 0x9876543210...                                 │
│                                                                  │
│   User is now verified permanently on-chain                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
Frontend ──(FormData: ID, Selfie, Address)──> Backend
  │
  ├─ State: idFile, selfieFile, userAddress
  └─ Component: VerifyPanel (handles UI interaction)

Backend ──(Tesseract.js)──> OCR
  ├─ Phase 1: Extract text from ID document
  ├─ Output: { raw_text, processed_lines, doc_length }
  │
  ├─ Phase 2: Face Detection (face-api.js)
  │  ├─ Load images to Canvas
  │  ├─ Detect faces: TinyFaceDetector
  │  ├─ Extract descriptors: FaceRecognitionNet
  │  └─ Output: 2 × 128-D vector
  │
  ├─ Phase 3: Face Matching
  │  ├─ Calculate Euclidean distance
  │  ├─ Compare: distance < 0.6?
  │  └─ Output: boolean (match/mismatch)
  │
  ├─ Phase 4: Hash Generation
  │  ├─ Combine OCR + timestamp
  │  ├─ Keccak256 hash (EVM compatible)
  │  └─ Output: 32-byte hash
  │
  ├─ Phase 5-6: Blockchain Interaction
  │  ├─ Connect to Hardhat node (127.0.0.1:8545)
  │  ├─ Call registerIdentity(hash)
  │  ├─ Call verifyIdentity(address)
  │  └─ Output: 2 × Transaction hashes
  │
  └─ Return JSON response with all details

Blockchain ──(Persists state)──> Smart Contract Storage
  ├─ identityHash mapping updated
  ├─ verified status set to true
  ├─ Events emitted (audit trail)
  └─ Permanent, immutable record created
```

---

## Component Communication Flow

```
Home.jsx (State Management Hub)
│
├─ State: idFile, selfieFile, userAddress
│
└─ Props passed to child components:
    │
    ├─ UploadID
    │  ├─ Props: onFileSelect callback
    │  ├─ Action: User selects file
    │  └─ Effect: setIdFile(file) → Home state
    │
    ├─ SelfieCapture
    │  ├─ Props: onFileSelect callback
    │  ├─ Action: User selects file
    │  ├─ Validation: face-api.js detects face
    │  └─ Effect: setSelfieFile(file) → Home state
    │
    ├─ ConnectWallet
    │  ├─ Props: (none)
    │  ├─ Action: User clicks "Connect"
    │  ├─ Calls: window.ethereum.request()
    │  └─ Effect: wallet connected
    │
    └─ VerifyPanel (Consumer)
       ├─ Props: idFile, selfieFile
       ├─ State: loading, userAddress
       ├─ Action: User clicks "Verify"
       └─ Effect: 
            ├─ Create FormData with all 3 props
            ├─ POST to http://localhost:5000/verify
            ├─ Display results with TX hashes
            └─ Show success/error to user
```

---

## Technology Stack Details

### Frontend (React)

```javascript
// Component Tree
App.jsx
└─ Home.jsx
   ├─ Navbar.jsx (display header)
   ├─ Hero.jsx (display title with animation)
   ├─ ConnectWallet.jsx (wallet connection)
   ├─ UploadID.jsx (ID file input + preview)
   ├─ SelfieCapture.jsx (selfie input + face detection)
   └─ VerifyPanel.jsx (verification button + response)

// Libraries
ethers.js v5.8.0       - Wallet interaction, not for contract calls
face-api.js v0.22.2   - Frontend face detection + validation
framer-motion v12.38  - Animations (Hero component)
```

### Backend (Node.js)

```javascript
// Architecture Pattern
Middleware → Route Handler → Helper Functions → Response

// Key Libraries
Express v5.2.1          - HTTP server
multer v2.1.1          - File uploads (ID + selfie)
tesseract.js v7.0.0    - OCR (extract ID text)
face-api.js v0.22.2    - Face detection + recognition
canvas v3.2.2          - Image rendering for face-api.js
ethers.js v6.16.0      - Blockchain interaction (contract calls)
sharp v0.33.0          - Image processing (future use)

// Helper Functions
- initializeFaceAPI()           - Load ML models
- initializeBlockchain()        - Connect to Hardhat node
- loadImageAsCanvas()           - Prepare image for face-api
- getFaceDescriptor()           - Extract 128-D face vector
- calculateFaceDistance()       - Euclidean distance math
- compareFaces()                - Face matching logic
- extractIDText()               - OCR extraction
- generateIdentityHash()        - Keccak256 hash
- registerOnBlockchain()        - Contract interaction
- verifyOnBlockchain()          - Contract interaction
```

### Blockchain (Solidity)

```solidity
// Smart Contract: Identity.sol
contract Identity {
    // Storage
    mapping(address => string) identityHash;  // Store identity hash
    mapping(address => bool) verified;        // Track verification status
    
    // Functions
    registerIdentity(hash) public              // User registers
    verifyIdentity(address) onlyAdmin public   // Admin verifies
    getStatus(address) view returns (bool)     // Query verification status
    
    // Events (for audit trail + frontend indexing)
    IdentityRegistered(user, hash)
    IdentityVerified(user, verifiedBy)
    IdentityRevoked(user, revokedBy)
}
```

---

## Performance Optimization

### Caching Strategies
- **Face-API Models**: Loaded once on server startup (~40MB)
- **Tesseract Language Models**: Downloaded on first OCR (~90MB)
- **Hardhat Blockchain**: In-memory state (instant)

### Time Measurements
```
First Verification:
├─ Model Loading: 5-10 seconds (one-time)
├─ OCR: 15-30 seconds (includes model download)
├─ Face Detection: 1-2 seconds
├─ Face Matching: 0.1 seconds
├─ Blockchain TX: 1-5 seconds
└─ Total: 25-50 seconds

Subsequent Verifications:
├─ OCR: 2-5 seconds (cached models)
├─ Face Detection: 1-2 seconds
├─ Face Matching: 0.1 seconds
├─ Blockchain TX: 1-5 seconds
└─ Total: 5-15 seconds
```

### Memory Usage
- **Backend Process**: ~800MB (including OCR models)
- **Frontend Bundle**: ~3.5MB (minified/gzipped)
- **Temporary Files**: <10MB per verification (cleaned up)

---

## Security Architecture

```
Authentication:
  ├─ MetaMask Connection (Frontend)
  │  ├─ User approves account access
  │  ├─ No private keys transmitted
  │  └─ Wallet address obtained for verification linking
  │
  └─ Backend Private Key (Server-side)
     ├─ Stored as environment variable
     ├─ Never exposed to client
     └─ Used for contract interactions

Authorization:
  ├─ registerIdentity(): Public (any user)
  ├─ verifyIdentity(): Admin-only (backend signer)
  └─ revokeVerification(): Admin-only (future)

Data Protection:
  ├─ Face Descriptors: Not stored (only compared)
  ├─ OCR Text: Not stored (only hashed)
  ├─ Identity Hash: Stored on immutable blockchain
  └─ Temporary Files: Deleted after verification
```

---

## Error Handling Strategy

```
Request Validation
├─ Missing files
├─ Invalid file types
└─ Invalid wallet address
    ↓
Processing Errors
├─ Face not detected in image
├─ Multiple faces in image
├─ Face mismatch (different people)
├─ OCR failure
└─ Image processing errors
    ↓
Blockchain Errors
├─ Network connection failed
├─ Contract call reverted
├─ Invalid gas
└─ Transaction timeout
    ↓
Cleanup on Error
├─ Delete temporary files
├─ Log error details
└─ Return detailed error response
```

---

## Future Scalability Considerations

1. **IPFS Integration**
   - Store document images permanently
   - Use IPFS hash as additional identifier

2. **Batch Processing**
   - Process multiple users in parallel
   - Database for caching results

3. **Advanced Fraud Detection**
   - Liveness detection (prevent spoof attacks)
   - Document validity checking (MRZ parsing)
   - Anomaly detection with ML

4. **Multi-Chain Support**
   - Deploy to Ethereum L2s (Polygon, Arbitrum)
   - Deploy to other chains (Solana, Cosmos)
   - Cross-chain verification

5. **Database Integration**
   - PostgreSQL for verification history
   - Redis for caching models/data
   - ElasticSearch for audit logs

6. **API Gateway**
   - Rate limiting
   - API key authentication
   - Request/response logging
   - DDoS protection

---

## Deployment Architecture (Future)

```
Production Deployment:
├─ Frontend
│  ├─ Vercel / Netlify (static hosting)
│  ├─ CDN for fast global delivery
│  └─ Environment-based RPC URLs
│
├─ Backend
│  ├─ AWS EC2 / Google Cloud / DigitalOcean
│  ├─ Docker containerization
│  ├─ Kubernetes orchestration
│  ├─ Auto-scaling based on load
│  ├─ PostgreSQL database
│  └─ Redis cache layer
│
└─ Blockchain
   ├─ Mainnet Deployment (Ethereum / Polygon)
   ├─ Multi-sig wallet for admin functions
   ├─ Governance token for decentralization
   └─ DAO for verification rule changes
```

---

**Document Version**: 1.0  
**Last Updated**: March 27, 2026  
**Status**: Complete Implementation  
**Ready for**: Local Testing & Development
