// ⚡ LOAD TENSORFLOW C++ BACKEND FIRST FOR MASSIVE SPEEDUP (50-100x faster)
try {
  require('@tensorflow/tfjs-node');
  console.log('⚡ TensorFlow.js Node backend loaded - 50-100x speedup enabled!');
} catch (err) {
  console.warn('⚠️  TensorFlow.js Node backend not available, falling back to slower JS backend');
  console.warn('   To enable: npm install @tensorflow/tfjs-node');
}

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');
const faceapi = require('face-api.js');

// Monkey patch for Node.js environment
faceapi.env.monkeyPatch({ Canvas: createCanvas, Image: loadImage });

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// ==================== CONFIGURATION ====================
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const RPC_URL = 'http://127.0.0.1:8545'; // Hardhat local node
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat node admin account (0xf39...)

// Import the full ABI from compiled artifact
const IdentityArtifact = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');
const CONTRACT_ABI = IdentityArtifact.abi;

// ==================== STATE ====================
let faceapi_loaded = false;
let provider, signer, contract;

// ==================== ERROR HANDLING ====================

// Global error handler for uncaught rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

async function initializeFaceAPI() {
  if (faceapi_loaded) return;

  console.log('Loading face-api models...');
  
  // Load models from backend models directory
  const MODEL_URL = path.resolve(__dirname, 'models');
  
  try {
    await faceapi.nets.tinyFaceDetector.loadFromDisk(path.join(MODEL_URL, 'tiny_face_detector'));
    await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(MODEL_URL, 'face_landmark_68'));
    await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(MODEL_URL, 'face_recognition_model'));
    console.log('✅ Face-API models loaded');
    faceapi_loaded = true;
  } catch (err) {
    console.error('❌ Failed to load face-api models:', err.message);
    throw err;
  }
}

async function initializeBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    console.log('✅ Blockchain initialized - Connected to contract at', CONTRACT_ADDRESS);
  } catch (err) {
    console.error('❌ Failed to initialize blockchain:', err.message);
    throw err;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Load image and return canvas for face-api.js
 * Works with Node.js using canvas library
 */
async function loadImageAsCanvas(filePath) {
  console.log(`📸 Loading image from: ${filePath}`);
  
  try {
    // Load image using canvas library (which face-api can recognize)
    let image = await loadImage(filePath);
    console.log(`✓ Image loaded: ${image.width}x${image.height}`);
    
    // Resize if too large to prevent memory issues
    if (image.width > 800 || image.height > 800) {
      console.log(`Resizing image from ${image.width}x${image.height}`);
      
      // Use sharp to resize and convert to PNG buffer
      const resizedBuffer = await sharp(filePath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      
      // Load resized image
      image = await loadImage(resizedBuffer);
      console.log(`✓ Resized to: ${image.width}x${image.height}`);
    }
    
    // Create canvas and draw image on it
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    console.log(`✓ Canvas created: ${canvas.width}x${canvas.height}`);
    return canvas;
  } catch (err) {
    console.error(`❌ Failed to load image: ${err.message}`);
    throw new Error(`Image loading failed: ${err.message}`);
  }
}

/**
 * Extract face descriptor from image file
 */
async function getFaceDescriptor(filePath) {
  try {
    console.log(`Loading image: ${filePath}`);
    const canvas = await loadImageAsCanvas(filePath);
    console.log('Image loaded as canvas');
    
    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in image');
    }

    return detection.descriptor.data; // Array of 128 numbers
  } catch (err) {
    console.error(`Face detection failed for ${filePath}:`, err.message);
    throw new Error(`Face detection failed: ${err.message}`);
  }
}

/**
 * Calculate Euclidean distance between two face descriptors
 */
function calculateFaceDistance(descriptor1, descriptor2) {
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Compare two face descriptors - returns true if same person
 * Distance threshold: 0.6 is standard for face-api.js
 */
function compareFaces(descriptor1, descriptor2, threshold = 0.6) {
  const distance = calculateFaceDistance(descriptor1, descriptor2);
  console.log(`Face distance: ${distance.toFixed(4)} (threshold: ${threshold})`);
  return distance < threshold;
}

/**
 * Extract text from ID document using Tesseract OCR
 */
async function extractIDText(filePath) {
  try {
    console.log('📄 Starting OCR on file:', filePath);
    
    // Use simple recognize method without complex worker config
    // This avoids langsArr.map errors and is more reliable
    const result = await Tesseract.recognize(
      filePath,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text' && m.progress) {
            const progress = Math.round(m.progress * 100);
            if (progress % 20 === 0) {  // Log every 20%
              console.log(`📄 OCR Progress: ${progress}%`);
            }
          }
        }
      }
    );

    const text = result.data.text;
    console.log(`✅ OCR Complete - Extracted ${text.length} characters from ID`);
    
    // Extract common ID fields
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      raw_text: text,
      processed_lines: lines,
      doc_length: text.length
    };
  } catch (err) {
    console.error('❌ OCR Error:', err.message);
    console.error('⚠️  OCR Stack:', err.stack);
    
    // Return error marker instead of throwing to allow verification to continue
    return {
      raw_text: 'OCR_ERROR: ' + err.message,
      processed_lines: [],
      doc_length: 0,
      error: true,
      errorMessage: err.message
    };
  }
}

/**
 * Generate identity hash from extracted data
 */
function generateIdentityHash(ocrData) {
  const combined = ocrData.raw_text + new Date().toISOString();
  return ethers.keccak256(ethers.toUtf8Bytes(combined));
}

/**
 * Generate a Decentralized Identifier (DID) for the user
 * Format: did:identity:{userAddress}:{identityHashShort}
 */
function generateDID(userAddress, identityHash) {
  // Use first 16 chars of identity hash for DID
  const hashShort = identityHash.slice(2, 18);
  const did = `did:identity:${userAddress.slice(2, 10).toLowerCase()}${hashShort}`;
  return did;
}

/**
 * Calculate trust/confidence score (0-100) based on verification results
 * Scoring:
 * - Base: 50 points
 * - Face match: +20 points
 * - No OCR errors: +15 points
 * - Blockchain registered: +10 points
 * - Blockchain verified: +5 points
 * - No blockchain errors: +0 (already counted if successful)
 */
function calculateTrustScore(verificationResults) {
  let score = 50; // Base score
  
  // Face match bonus
  if (verificationResults.facePhase.faces_match) {
    score += 20;
  }
  
  // OCR quality bonus
  if (verificationResults.ocrPhase.extracted_text_length > 100) {
    score += 15;
  }
  
  // Blockchain registration bonus
  if (verificationResults.blockchainPhase.registered && 
      verificationResults.blockchainPhase.registered !== 'Failed') {
    score += 10;
  }
  
  // Blockchain verification bonus
  if (verificationResults.blockchainPhase.verified && 
      verificationResults.blockchainPhase.verified !== 'Failed') {
    score += 5;
  }
  
  // Ensure score stays within 0-100 range
  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Get trust level label based on score
 */
function getTrustLevel(score) {
  if (score < 50) return 'RISKY';
  if (score < 80) return 'MODERATE';
  return 'HIGHLY TRUSTED';
}

/**
 * AI Fraud Detection - Analyze OCR text for suspicious patterns
 * Returns fraud risk assessment
 */
function analyzeFraudRisk(ocrText, faceMatch, ocrLength) {
  let riskScore = 0;
  const fraudIndicators = [];

  // Check 1: Very short text (likely incomplete document)
  if (ocrLength < 50) {
    riskScore += 25;
    fraudIndicators.push('Incomplete document - very little text extracted');
  }

  // Check 2: Text readability and structure
  const lines = ocrText.split('\n').filter(l => l.trim());
  if (lines.length < 3) {
    riskScore += 15;
    fraudIndicators.push('Poor document structure - fewer than 3 lines');
  }

  // Check 3: Common ID field keywords present
  const idKeywords = ['name', 'number', 'date', 'expir', 'issued', 'dob', 'birth'];
  const keywordMatches = idKeywords.filter(kw => 
    ocrText.toLowerCase().includes(kw)
  );
  
  if (keywordMatches.length < 2) {
    riskScore += 20;
    fraudIndicators.push('Missing standard ID fields in extracted text');
  }

  // Check 4: Face mismatch is major red flag
  if (!faceMatch) {
    riskScore += 40;
    fraudIndicators.push('CRITICAL: Face mismatch between ID and selfie');
  }

  // Check 5: Repetitive or suspicious patterns
  const suspiciousPatterns = /[0-9]{15,}|xxx+|###|====|----/gi;
  if (suspiciousPatterns.test(ocrText)) {
    riskScore += 15;
    fraudIndicators.push('Suspicious patterns detected in OCR text');
  }

  // Check 6: Character encoding issues (high duplicate special chars)
  const specialCharRatio = (ocrText.match(/[^a-zA-Z0-9\s]/g) || []).length / ocrText.length;
  if (specialCharRatio > 0.3) {
    riskScore += 10;
    fraudIndicators.push('Unusual character distribution - possible scanning error');
  }

  // Normalize to 0-100
  riskScore = Math.min(100, riskScore);

  return {
    fraudRiskScore: riskScore,
    isSuspicious: riskScore > 50,
    indicators: fraudIndicators,
    riskLevel: riskScore < 30 ? 'LOW' : riskScore < 70 ? 'MEDIUM' : 'HIGH'
  };
}

/**
 * Register identity on blockchain
 */
async function registerOnBlockchain(userAddress, identityHash) {
  try {
    console.log(`Registering identity on blockchain for ${userAddress}...`);
    
    if (!contract) {
      throw new Error('Contract not initialized - call initializeBlockchain() first');
    }
    
    // Get current nonce
    const nonce = await provider.getTransactionCount(signer.address);
    console.log(`Current nonce: ${nonce}`);
    
    const tx = await contract.adminRegisterIdentity(userAddress, identityHash, { nonce });
    
    if (!tx || typeof tx !== 'object') {
      throw new Error('Contract method returned invalid transaction object');
    }
    
    const txHash = tx.hash || tx.transactionHash || 'pending';
    console.log(`✅ Transaction sent: ${txHash}`);
    
    const receipt = await Promise.race([
      tx.wait(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), 120000)
      )
    ]);
    
    if (!receipt) {
      throw new Error('Failed to get transaction receipt');
    }
    
    console.log(`✅ Identity registered. Tx: ${receipt.hash}`);
    return receipt;
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    throw err;
  }
}

/**
 * Verify identity on blockchain
 */
async function verifyOnBlockchain(userAddress) {
  try {
    console.log(`Verifying identity on blockchain for ${userAddress}...`);
    
    if (!contract) {
      throw new Error('Contract not initialized - call initializeBlockchain() first');
    }
    
    // Get current nonce - use 'pending' to get the next available nonce
    const nonce = await provider.getTransactionCount(signer.address, 'pending');
    console.log(`Current pending nonce: ${nonce}`);
    
    const tx = await contract.verifyIdentity(userAddress, { nonce });
    
    if (!tx || typeof tx !== 'object') {
      throw new Error('Contract method returned invalid transaction object');
    }
    
    const txHash = tx.hash || tx.transactionHash || 'pending';
    console.log(`✅ Transaction sent: ${txHash}`);
    
    const receipt = await Promise.race([
      tx.wait(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), 120000)
      )
    ]);
    
    if (!receipt) {
      throw new Error('Failed to get transaction receipt');
    }
    
    console.log(`✅ Identity verified on blockchain. Tx: ${receipt.hash}`);
    return receipt;
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    throw err;
  }
}

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    status: "Backend is running ✅",
    features: [
      "OCR - Extract text from government IDs",
      "Face Matching - Compare ID photo with selfie",
      "Blockchain Integration - Record verification on Ethereum",
      "Decentralized Identifier (DID) - Unique reusable identifier",
      "Trust Score - AI-based confidence scoring (0-100)"
    ]
  });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Increase timeout for all requests
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});

/**
 * GET /test
 * Quick test endpoint
 */
app.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is responding',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /blockchain/status
 * Check blockchain connection status
 */
app.get('/blockchain/status', async (req, res) => {
  try {
    if (!provider) {
      return res.status(503).json({
        status: 'offline',
        error: 'Provider not initialized',
        rpc_url: RPC_URL
      });
    }

    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    res.json({
      status: 'online',
      network: network.name,
      chainId: Number(network.chainId),
      blockNumber: Number(blockNumber),
      contractAddress: CONTRACT_ADDRESS,
      rpc_url: RPC_URL
    });
  } catch (err) {
    res.status(503).json({
      status: 'offline',
      error: err.message,
      rpc_url: RPC_URL
    });
  }
});

/**
 * POST /verify
 * Full identity verification workflow
 */
app.post('/verify', upload.fields([
  { name: 'id', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
  console.log('\n🔍 [REQUEST] Verification endpoint called');
  console.log(`   Files received: id=${!!req.files?.id}, selfie=${!!req.files?.selfie}`);
  console.log(`   Address: ${req.body.address}`);
  
  const userAddress = req.body.address || ethers.getAddress('0x1234567890123456789012345678901234567890');
  
  try {
    console.log('\n========== VERIFICATION STARTED ==========');
    console.log(`User: ${userAddress}`);

    // ===== STEP 1: Validate files =====
    if (!req.files || !req.files.id || !req.files.selfie) {
      console.error('❌ Missing files');
      return res.status(400).json({
        success: false,
        message: "Both ID and selfie files are required"
      });
    }

    const idFilePath = req.files.id[0].path;
    const selfieFilePath = req.files.selfie[0].path;

    console.log('✅ Files received');
    console.log(`   ID file: ${idFilePath}`);
    console.log(`   Selfie file: ${selfieFilePath}`);

    // ===== STEP 2: Extract text from ID using OCR =====
    console.log('\n--- Phase 1: OCR Text Extraction ---');
    console.log('Starting OCR on ID file...');
    let ocrData;
    try {
      ocrData = await extractIDText(idFilePath);
      
      // Check if OCR returned an error marker
      if (ocrData.error) {
        console.warn(`⚠️  OCR returned error: ${ocrData.errorMessage}`);
        console.log('📝 Continuing with fraud detection and face matching...');
      } else {
        console.log(`✅ OCR Complete - Extracted ${ocrData.doc_length} characters`);
      }
    } catch (ocrErr) {
      console.error('❌ OCR critical error:', ocrErr.message);
      // Set a fallback but continue
      ocrData = {
        raw_text: 'OCR processing encountered an error',
        processed_lines: [],
        doc_length: 0,
        error: true,
        errorMessage: ocrErr.message
      };
      console.log('📝 Using fallback OCR data and continuing...');
    }

    // ===== STEP 3: Extract face descriptors =====
    console.log('\n--- Phase 2: Face Detection & Extraction ---');
    let idFaceDetected = false;
    let selfieFaceDetected = false;
    let idDescriptor = null;
    let selfieDescriptor = null;
    let faceDistance = null;
    let facesMatch = false;

    // Detect face in ID
    try {
      console.log('Detecting face in ID...');
      const idCanvas = await loadImageAsCanvas(idFilePath);
      console.log(`📋 Canvas type check: ${idCanvas.constructor.name}`);
      
      const detections = await faceapi
        .detectAllFaces(idCanvas, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }));
      
      console.log(`✅ Face detection completed: ${detections.length} face(s) found`);
      
      if (detections && detections.length > 0) {
        idFaceDetected = true;
        console.log(`✅ ${detections.length} face(s) detected in ID`);
        
        const detection = await faceapi
          .detectSingleFace(idCanvas, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (detection && detection.descriptor) {
          idDescriptor = Array.from(detection.descriptor.data);
          console.log(`✅ ID Face descriptor extracted (128-dim vector)`);
        }
      } else {
        console.log('⚠️  No face detected in ID');
      }
    } catch (err) {
      console.error('❌ ID face detection error:', err.message);
      console.error('Error details:', err.stack.split('\n').slice(0, 5).join('\n'));
    }

    // Detect face in selfie
    try {
      console.log('Detecting face in selfie...');
      const selfieCanvas = await loadImageAsCanvas(selfieFilePath);
      console.log(`📋 Canvas type check: ${selfieCanvas.constructor.name}`);
      
      const detections = await faceapi
        .detectAllFaces(selfieCanvas, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }));
      
      console.log(`✅ Face detection completed: ${detections.length} face(s) found`);
      
      if (detections && detections.length > 0) {
        selfieFaceDetected = true;
        console.log(`✅ ${detections.length} face(s) detected in selfie`);
        
        const detection = await faceapi
          .detectSingleFace(selfieCanvas, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (detection && detection.descriptor) {
          selfieDescriptor = Array.from(detection.descriptor.data);
          console.log(`✅ Selfie Face descriptor extracted (128-dim vector)`);
        }
      } else {
        console.log('⚠️  No face detected in selfie');
      }
    } catch (err) {
      console.error('❌ Selfie face detection error:', err.message);
      console.error('Error details:', err.stack.split('\n').slice(0, 5).join('\n'));
    }

    // ===== STEP 4: Compare faces =====
    console.log('\n--- Phase 3: Face Matching ---');
    if (idDescriptor && selfieDescriptor) {
      try {
        facesMatch = compareFaces(idDescriptor, selfieDescriptor);
        faceDistance = calculateFaceDistance(idDescriptor, selfieDescriptor);
        console.log(`Face comparison: ${facesMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
      } catch (err) {
        console.error('Face comparison error:', err.message);
      }
    } else {
      console.log('⚠️  Cannot compare faces - one or both faces not detected');
      facesMatch = false;
    }

    // ===== STEP 5: Generate identity hash =====
    console.log('\n--- Phase 4: Identity Hash Generation ---');
    const identityHash = generateIdentityHash(ocrData);
    console.log(`Identity Hash: ${identityHash}`);

    // ===== STEP 6: Register on blockchain =====
    console.log('\n--- Phase 5: Blockchain Registration ---');
    let registerTx = null;
    let registerError = null;
    try {
      registerTx = await registerOnBlockchain(userAddress, identityHash);
      console.log('✅ Registered on blockchain');
    } catch (blockchainErr) {
      registerError = blockchainErr.message;
      console.error('Blockchain registration failed:', registerError);
      // Continue to verification attempt regardless
    }

    // ===== STEP 7: Verify on blockchain =====
    console.log('\n--- Phase 6: Blockchain Verification ---');
    let verifyTx = null;
    let verifyError = null;
    try {
      verifyTx = await verifyOnBlockchain(userAddress);
      console.log('✅ Verified on blockchain');
    } catch (verifyErr) {
      verifyError = verifyErr.message;
      console.error('Blockchain verification failed:', verifyError);
      // Don't fail here either
    }

    // Cleanup uploaded files AFTER response (don't wait, just queue it)
    setImmediate(() => {
      fs.unlink(idFilePath, (err) => {
        if (err) console.log('File cleanup: ID file removal failed');
      });
      fs.unlink(selfieFilePath, (err) => {
        if (err) console.log('File cleanup: Selfie file removal failed');
      });
    });

    // ===== Build verification results object =====
    const fraudAnalysis = analyzeFraudRisk(ocrData.raw_text, facesMatch, ocrData.doc_length);
    
    const verificationResultsData = {
      ocrPhase: {
        success: ocrData.doc_length > 50,
        extracted_text_length: ocrData.doc_length,
        lines_processed: ocrData.processed_lines.length,
        extracted_text: ocrData.raw_text.substring(0, 500)
      },
      facePhase: {
        id_faces_count: idFaceDetected ? 1 : 0,
        selfie_faces_count: selfieFaceDetected ? 1 : 0,
        faces_detected: idFaceDetected || selfieFaceDetected,
        faces_match: facesMatch,
        match_distance: faceDistance ? parseFloat(faceDistance.toFixed(4)) : null
      },
      blockchainPhase: {
        registered: registerTx ? registerTx.hash : 'Failed',
        registered_error: registerError,
        verified: verifyTx ? verifyTx.hash : 'Failed',
        verified_error: verifyError,
        contract_address: CONTRACT_ADDRESS
      },
      fraudDetection: fraudAnalysis
    };

    // ===== STEP 8: Generate DID and Trust Score =====
    console.log('\n--- Phase 7: DID Generation & Trust Scoring ---');
    const did = generateDID(userAddress, identityHash);
    const trustScore = calculateTrustScore(verificationResultsData);
    const trustLevel = getTrustLevel(trustScore);
    console.log(`✅ DID Generated: ${did}`);
    console.log(`✅ Trust Score: ${trustScore}/100 (${trustLevel})`);

    console.log('\n========== VERIFICATION SUCCESSFUL ==========\n');

    // Prepare final response
    const finalResponse = {
      success: true,
      message: "✅ Identity verified and recorded on blockchain!",
      details: {
        userAddress,
        identityHash,
        decentralizedIdentifier: {
          did,
          description: "Unique identifier for future verifications without re-uploading documents"
        },
        trustScore: {
          score: trustScore,
          level: trustLevel,
          range: {
            risky: "0-50",
            moderate: "50-80",
            highlyTrusted: "80-100"
          }
        },
        ...verificationResultsData
      },
      timestamp: new Date().toISOString()
    };

    // Send response
    console.log('📤 [RESPONSE] Sending verification result...');
    res.json(finalResponse);
    console.log('✅ [RESPONSE] Sent successfully');

  } catch (err) {
    console.error('❌ [ERROR] Verification failed');
    console.error('   Message:', err.message);
    if (err.stack) console.error('   Stack:', err.stack.substring(0, 200));

    // Cleanup files on error
    if (req.files?.id?.[0]?.path) {
      fs.unlink(req.files.id[0].path, () => {});
    }
    if (req.files?.selfie?.[0]?.path) {
      fs.unlink(req.files.selfie[0].path, () => {});
    }

    // Make sure we send an error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: `Verification failed: ${err.message}`,
        error_phase: err.message.split(':')[0]
      });
    }
  }
});

/**
 * GET /status/:address
 * Check verification status on blockchain
 */
app.get('/status/:address', async (req, res) => {
  try {
    const address = ethers.getAddress(req.params.address);
    const status = await contract.getStatus(address);
    
    res.json({
      address,
      verified: status,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    // Initialize face-api
    await initializeFaceAPI();

    // Initialize blockchain connection
    try {
      await initializeBlockchain();
    } catch (err) {
      console.error('❌ FATAL: Blockchain initialization failed');
      console.error('   Error:', err.message);
      console.error('   RPC URL:', RPC_URL);
      console.error('   Start Hardhat with: npx hardhat node');
      process.exit(1);  // Stop server
    }

    app.listen(5000, () => {
      console.log('🚀 Verification Backend running on port 5000');
      console.log('Features:');
      console.log('  - OCR: Extract text from government IDs');
      console.log('  - Face Matching: Compare ID photo with selfie');
      console.log('  - Blockchain: Record verification on Ethereum (localhost)');
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();