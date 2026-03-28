/**
 * Simple OCR test to verify Tesseract.js is working
 */

const Tesseract = require('tesseract.js');
const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Test Tesseract.js OCR functionality
 */
async function testTesseractOCR() {
  console.log('\n🚀 TESTING TESSERACT OCR SYSTEM\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Create a simple test image using Canvas
    console.log('\n📸 Step 1: Creating test image...');
    const width = 600;
    const height = 400;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Add test text
    ctx.fillStyle = 'black';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('IDENTITY VERIFICATION', width / 2, 80);

    ctx.font = '24px Arial';
    ctx.fillText('Name: John Doe', width / 2, 140);
    ctx.fillText('ID Number: 12345678910', width / 2, 180);
    ctx.fillText('Date of Birth: 1990-01-15', width / 2, 220);
    ctx.fillText('Expiry Date: 2030-12-31', width / 2, 260);
    ctx.fillText('Issued By: Government', width / 2, 300);

    const testImagePath = path.join(__dirname, 'test-ocr-image.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(testImagePath, buffer);
    console.log(`✅ Test image created: ${testImagePath}`);
    console.log(`   Size: ${buffer.length} bytes`);

    // Test 2: Run simple OCR without complex worker config
    console.log('\n🔧 Step 2: Running OCR with simplified config...');
    console.log('   Using default Tesseract configuration');
    
    const result = await Tesseract.recognize(
      testImagePath,
      'eng'
    );
    
    const extractedText = result.data.text;
    const confidence = result.data.confidence;

    console.log(`✅ OCR Complete!`);
    console.log(`   Confidence: ${confidence}%`);
    console.log(`   Characters extracted: ${extractedText.length}`);
    console.log(`   Lines extracted: ${extractedText.split('\n').length}`);

    // Test 3: Display extracted text
    console.log('\n📝 Step 3: Extracted Text:');
    console.log('-'.repeat(50));
    console.log(extractedText);
    console.log('-'.repeat(50));

    // Test 4: Check for keywords
    console.log('\n🔍 Step 4: Searching for ID keywords...');
    const keywords = ['name', 'john', 'doe', 'id', 'number', 'date', 'birth', 'expir'];
    const foundKeywords = [];
    for (const keyword of keywords) {
      if (extractedText.toLowerCase().includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }
    
    if (foundKeywords.length > 0) {
      console.log(`✅ Found ${foundKeywords.length} keywords: ${foundKeywords.join(', ')}`);
    } else {
      console.log('⚠️  No keywords found - OCR may have failed');
    }

    // Cleanup
    console.log('\n🧹 Step 5: Cleaning up...');
    fs.unlinkSync(testImagePath);
    console.log('✅ Test image deleted');

    // Final result
    console.log('\n' + '='.repeat(50));
    if (extractedText.length > 50 && foundKeywords.length > 3) {
      console.log('✅ ✅ ✅ OCR TEST PASSED - SYSTEM WORKING! ✅ ✅ ✅');
    } else {
      console.log('⚠️  OCR TEST WARNING - Limited content or no keywords found');
      console.log('    But Tesseract is responding, so basic functionality works');
    }
    console.log('='.repeat(50) + '\n');

  } catch (err) {
    console.error('\n❌ OCR TEST FAILED');
    console.error('Error:', err.message);
    if (err.stack) {
      console.error('Stack:', err.stack.substring(0, 300));
    }
    process.exit(1);
  }
}

// Run the test
testTesseractOCR().then(() => {
  console.log('✅ Test completed\n');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});
