# Identity Verification System - Complete Setup Guide

This is a **decentralized identity verification system** using:
- **Frontend**: React with face detection
- **Backend**: Node.js with OCR, face matching, and blockchain integration
- **Blockchain**: Solidity smart contracts on Hardhat

## Architecture

```
User (React App)
    ↓
Frontend (http://localhost:3000)
    ↓ (upload ID + selfie, connect wallet)
    ↓
Backend API (http://localhost:5000)
    ├─ OCR: Extract text from ID
    ├─ Face Detection: Compare ID photo with selfie
    ├─ Face Matching: Verify same person
    └─ Blockchain: Record verification
    ↓
Smart Contract (localhost:8545)
    └─ Store identity hash + verification status
```

---

## Prerequisites

- Node.js v18+ (Install from https://nodejs.org)
- npm v9+
- MetaMask browser extension (for wallet connection)
- Git
- Python 3.8+ (for tesseract build dependencies)

---

## Step 1: Start Hardhat Blockchain Node

The backend needs a running Ethereum node with the Identity contract deployed.

```bash
# Terminal 1: Start Hardhat network
cd c:\Users\WINDOWS\ 10\ PRO\Desktop\8th\ sem\ project\identity-blockchain
npm install  # if not already installed
npx hardhat node

# Output should show addresses and a listening on port 8545
# Copy the first account's private key (you'll see it in the output)
```

The first account from Hardhat (with default private key `0xac0974bec39a17e36ba4a6b4d238ff944bacb476c3c796fa149a9723ee4c6b88`) is already configured in the backend.

---

## Step 2: Deploy Identity Contract

In a **new terminal window while the node is running**:

```bash
# Terminal 2: Deploy contract
cd c:\Users\WINDOWS\ 10\ PRO\Desktop\8th\ sem\ project\identity-blockchain
npx hardhat ignition deploy ./ignition/modules/IdentityModule.js --network localhost

# Output will show:
# ✓ IdentityModule#Identity - 0x5FbDB2315678afecb367f032d93F642f64180aa3 (deployed)
```

The contract address should be: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

---

## Step 3: Start Backend Server

In a **new terminal window**:

```bash
# Terminal 3: Start backend
cd c:\Users\WINDOWS\ 10\ PRO\Desktop\8th\ sem\ project\identity-backend
npm install  # if not already installed
npm start

# Expected output:
# ✅ Face-API models loaded
# ✅ Blockchain initialized - Connected to contract at 0x5FbDB2315678afecb367f032d93F642f64180aa3
# 🚀 Verification Backend running on port 5000
```

### Backend Features:
- **OCR**: Uses Tesseract.js to extract text from government IDs
- **Face Detection**: Uses face-api.js to detect faces in images
- **Face Matching**: Compares face descriptors with Euclidean distance
- **Blockchain**: Records identity hashes and verification status

---

## Step 4: Start Frontend

In a **new terminal window**:

```bash
# Terminal 4: Start frontend
cd c:\Users\WINDOWS\ 10\ PRO\Desktop\8th\ sem\ project\identity-frontend\myapp
npm install  # if not already installed
npm start

# Opens http://localhost:3000 automatically
```

---

## Step 5: Use the Application

1. **Open Frontend**: Navigate to `http://localhost:3000`

2. **Connect Wallet**:
   - Click "Connect Wallet" button
   - Select your MetaMask account
   - If using Hardhat, import account with private key from Step 1

3. **Upload Government ID**:
   - Click "Upload Government ID" section
   - Select an ID image (passport, driver's license, etc.)
   - Image should include text and face

4. **Upload Selfie**:
   - Click "Upload Selfie" section
   - Take or select a selfie photo
   - Face-API will verify a face is detected

5. **Verify Identity**:
   - Click the blue "Verify Identity" button
   - Backend will:
     - Extract text from ID (OCR)
     - Detect faces in both images
     - Compare faces (must match)
     - Register identity on blockchain
     - Record verification status
   - Success response includes:
     - Identity Hash: `0x...` (stored on chain)
     - Registration TX: Transaction hash
     - Verification TX: Transaction hash

6. **Check Status**:
   - Make a GET request to `http://localhost:5000/status/<wallet-address>`
   - Returns: `{ verified: true/false, timestamp: "..." }`

---

## Verification Workflow

### Backend Verification Process

```
1. FILE VALIDATION ✓
   - Check ID and selfie files received

2. OCR TEXT EXTRACTION ✓
   - Read text from ID document
   - Extract lines and content
   - Store for identity hash

3. FACE DETECTION ✓
   - Load face-api.js models
   - Detect single face in ID photo
   - Detect single face in selfie

4. FACE MATCHING ✓
   - Calculate 128-D face descriptor for ID face
   - Calculate 128-D face descriptor for selfie
   - Compare Euclidean distance (threshold: 0.6)
   - If distance < 0.6: MATCH ✓
   - If distance >= 0.6: FAIL ✗

5. BLOCKCHAIN REGISTRATION ✓
   - Generate identity hash from OCR data
   - Call contract.registerIdentity(hash)
   - Store hash on-chain

6. BLOCKCHAIN VERIFICATION ✓
   - Call contract.verifyIdentity(userAddress)
   - Mark user as verified on-chain

7. CLEANUP ✓
   - Delete temporary uploaded files
   - Return success response with details
```

---

## API Endpoints

### POST /verify
Verify a user's identity.

**Request:**
```javascript
const formData = new FormData();
formData.append('id', idFile);           // Government ID image
formData.append('selfie', selfieFile);   // Selfie image
formData.append('address', userAddress); // Wallet address

const response = await fetch('http://localhost:5000/verify', {
  method: 'POST',
  body: formData
});
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "✅ Identity verified and recorded on blockchain!",
  "details": {
    "userAddress": "0x1234...",
    "identityHash": "0xabcd...",
    "ocrPhase": {
      "extracted_text_length": 1234,
      "lines_processed": 42
    },
    "facePhase": {
      "id_face_detected": true,
      "selfie_face_detected": true,
      "faces_match": true
    },
    "blockchainPhase": {
      "registered": "0xTx1...",
      "verified": "0xTx2...",
      "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    }
  },
  "timestamp": "2024-03-27T12:34:56.789Z"
}
```

**Error Response (400/500)**:
```json
{
  "success": false,
  "message": "Face mismatch - The ID and selfie don't match",
  "details": {
    "phase": "Face Comparison",
    "idFaceDetected": true,
    "selfieFaceDetected": true,
    "facesMatch": false
  }
}
```

### GET /status/:address
Check verification status.

**Request:**
```javascript
const response = await fetch('http://localhost:5000/status/0x1234567890...');
```

**Response:**
```json
{
  "address": "0x1234567890...",
  "verified": true,
  "timestamp": "2024-03-27T12:34:56.789Z"
}
```

---

## Troubleshooting

### Backend won't connect to blockchain
```
❌ "Failed to initialize blockchain"
```
**Solution**: 
1. Ensure Hardhat node is running: `npx hardhat node`
2. Check contract is deployed at `0x5FbDB2315678afecb367f032d93F642f64180aa3`
3. Verify RPC URL is `http://127.0.0.1:8545`

### Face detection fails
```
❌ "No face detected in image"
```
**Solution**:
1. Check image quality and lighting
2. Ensure face is clearly visible
3. Image should be at least 200x200 pixels
4. Use passport/driver's license photos for IDs

### OCR takes too long
```
⏳ OCR Progress: 0%...50%...100%
```
- First run downloads language models (~100MB)
- Subsequent runs are faster
- Complex documents take longer (2-5 seconds)

### Face mismatch error
```
❌ "Face mismatch - The ID and selfie don't match"
```
**Solution**:
1. Ensure the same person is in both photos
2. Good lighting and clear face in both images
3. Distance threshold is 0.6 - similar angle helps

### MetaMask connection fails
```
❌ "MetaMask not installed" or "Failed to connect wallet"
```
**Solution**:
1. Install MetaMask extension: https://metamask.io
2. Add Hardhat network to MetaMask:
   - Network: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337

### Frontend is blank
- Check console for errors (F12)
- Ensure `npm start` is running in the frontend directory
- Clear browser cache
- Restart the dev server

---

## Development Notes

### Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, ethers.js v5 | User interface, wallet connection |
| **Backend** | Node.js, Express | API server for verification |
| **OCR** | Tesseract.js | Extract text from ID documents |
| **Face Detection** | face-api.js | Detect and extract face features |
| **Face Matching** | Euclidean distance | Compare facial descriptors |
| **Blockchain** | Solidity, Hardhat | Smart contract, local testing |
| **Ethereum Interaction** | ethers.js v6 | Contract calls, transactions |

### Important Files

- **Frontend**: [identity-frontend/myapp/src/components/VerifyPanel.jsx](identity-frontend/myapp/src/components/VerifyPanel.jsx)
- **Backend**: [identity-backend/server.js](identity-backend/server.js)
- **Contract**: [identity-blockchain/contracts/Identity.sol](identity-blockchain/contracts/Identity.sol)

### Future Enhancements

1. **IPFS Integration**: Store documents permanently
2. **Fraud Detection**: AI model to detect fake IDs
3. **Multi-signature**: Require multiple verifiers
4. **Document Expiry**: Track ID expiration dates
5. **Revocation**: Admin can revoke verification
6. **Analytics**: Dashboard showing verification stats
7. **Gas Optimization**: Reduce transaction costs
8. **Mainnet Deployment**: Deploy to Ethereum, Polygon, etc.

---

## License

MIT

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review backend console logs
3. Check browser console (F12 → Console)
4. Verify all three services are running
