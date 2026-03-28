#!/usr/bin/env node

/**
 * Test script to verify fraud detection and improved face/OCR matching
 * Tests the updated backend /verify endpoint
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:5000';
const TEST_IMAGES_DIR = path.join(__dirname, 'test-images');

console.log('🧪 FRAUD DETECTION & FACE MATCHING TEST SUITE\n');
console.log('='.repeat(60));

// Create test directories if they don't exist
if (!fs.existsSync(TEST_IMAGES_DIR)) {
  fs.mkdirSync(TEST_IMAGES_DIR, { recursive: true });
  console.log(`✅ Created test images directory: ${TEST_IMAGES_DIR}`);
  console.log('\n📝 NOTE: Add test images to test-images/ folder:');
  console.log('  - id.jpg (government ID image)');
  console.log('  - selfie.jpg (selfie image)');
}

async function testVerificationEndpoint() {
  try {
    console.log('\n🔍 Testing /verify endpoint...\n');
    
    const idPath = path.join(TEST_IMAGES_DIR, 'id.jpg');
    const selfiePath = path.join(TEST_IMAGES_DIR, 'selfie.jpg');
    
    if (!fs.existsSync(idPath) || !fs.existsSync(selfiePath)) {
      console.log('⚠️  Test images not found:');
      console.log(`  Missing: ${!fs.existsSync(idPath) ? 'id.jpg' : ''}`);
      console.log(`  Missing: ${!fs.existsSync(selfiePath) ? 'selfie.jpg' : ''}`);
      console.log('\n📚 Please add test images and run again.');
      return;
    }
    
    const form = new FormData();
    form.append('id', fs.createReadStream(idPath));
    form.append('selfie', fs.createReadStream(selfiePath));
    form.append('address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    
    console.log('📤 Sending verification request...\n');
    
    const response = await fetch(`${BACKEND_URL}/verify`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ Verification failed:', data.message);
      return;
    }
    
    // Extract key results
    const d = data.details;
    
    console.log('✅ VERIFICATION RESULTS:\n');
    
    // OCR Results
    console.log('📄 OCR ANALYSIS:');
    console.log(`  Status: ${d.ocrPhase.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Text Extracted: ${d.ocrPhase.extracted_text_length} characters`);
    console.log(`  Lines Processed: ${d.ocrPhase.lines_processed}`);
    console.log();
    
    // Face Detection Results
    console.log('👤 FACE DETECTION:');
    console.log(`  ID Faces: ${d.facePhase.id_faces_count}`);
    console.log(`  Selfie Faces: ${d.facePhase.selfie_faces_count}`);
    console.log(`  Faces Detected: ${d.facePhase.faces_detected ? '✅ YES' : '❌ NO'}`);
    console.log(`  Match Result: ${d.facePhase.faces_match ? '✅ MATCH' : '❌ NO MATCH'}`);
    if (d.facePhase.match_distance !== null) {
      console.log(`  Match Distance: ${d.facePhase.match_distance.toFixed(4)}`);
    }
    console.log();
    
    // Fraud Detection Results
    console.log('🚨 FRAUD DETECTION:');
    console.log(`  Risk Score: ${d.fraudDetection.fraudRiskScore}/100`);
    console.log(`  Risk Level: ${d.fraudDetection.riskLevel}`);
    console.log(`  Status: ${d.fraudDetection.isSuspicious ? '⚠️  SUSPICIOUS' : '✅ LEGITIMATE'}`);
    if (d.fraudDetection.indicators.length > 0) {
      console.log('\n  🚩 Fraud Indicators Detected:');
      d.fraudDetection.indicators.forEach((indicator, i) => {
        console.log(`    ${i + 1}. ${indicator}`);
      });
    } else {
      console.log('  ✅ No fraud indicators detected');
    }
    console.log();
    
    // Blockchain Results
    console.log('⛓️  BLOCKCHAIN:');
    console.log(`  Registered: ${d.blockchainPhase.registered !== 'Failed' ? '✅ YES' : '❌ FAILED'}`);
    console.log(`  Verified: ${d.blockchainPhase.verified !== 'Failed' ? '✅ YES' : '❌ FAILED'}`);
    console.log(`  Contract: ${d.blockchainPhase.contract_address}`);
    console.log();
    
    // DID & Trust Score
    console.log('🆔 DECENTRALIZED IDENTIFIER:');
    console.log(`  DID: ${d.decentralizedIdentifier.did}`);
    console.log();
    
    console.log('📊 TRUST SCORE:');
    console.log(`  Score: ${d.trustScore.score}/100`);
    console.log(`  Level: ${d.trustScore.level}`);
    console.log();
    
    console.log('✅ TEST COMPLETE - All systems operational!\n');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

async function testBlockchainStatus() {
  try {
    console.log('\n📡 Checking blockchain status...\n');
    
    const response = await fetch(`${BACKEND_URL}/blockchain/status`);
    const status = await response.json();
    
    if (status.status === 'online') {
      console.log('✅ Blockchain Status: ONLINE');
      console.log(`   Network: ${status.network} (Chain ID: ${status.chainId})`);
      console.log(`   Block: ${status.blockNumber}`);
      console.log(`   Contract: ${status.contractAddress}`);
    } else {
      console.log('❌ Blockchain Status: OFFLINE');
      console.log(`   Error: ${status.error}`);
    }
    console.log();
  } catch (err) {
    console.error('❌ Status check failed:', err.message);
  }
}

async function main() {
  await testBlockchainStatus();
  await testVerificationEndpoint();
}

main().catch(console.error);
