import { useState, useEffect } from 'react'
import './App.css'

// Verification results display component
function VerificationResults({ data }) {
  if (!data) return null

  const { trustScore, ocrPhase, facePhase, blockchainPhase, fraudDetection, decentralizedIdentifier } = data

  // Trust score progress ring
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (trustScore?.score || 0) / 100 * circumference
  
  const getTrustColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const getTrustLevel = (score) => {
    if (score >= 80) return 'HIGHLY TRUSTED'
    if (score >= 50) return 'MODERATE RISK'
    return 'HIGH RISK'
  }

  return (
    <div className="verification-results">
      {/* Trust Score Circle */}
      <div className="results-header">
        <div className="trust-circle">
          <svg width="140" height="140" className="progress-ring-lg">
            <circle cx="70" cy="70" r="55" className="progress-background" />
            <circle
              cx="70"
              cy="70"
              r="55"
              className="progress-ring-lg"
              style={{
                strokeDashoffset: circumference - (trustScore?.score / 100) * circumference,
                stroke: getTrustColor(trustScore?.score),
              }}
              strokeDasharray={circumference}
            />
            <text x="70" y="75" textAnchor="middle" className="trust-score-text">
              {trustScore?.score}
            </text>
          </svg>
          <div className="trust-label">{getTrustLevel(trustScore?.score)}</div>
        </div>
        <h1>Verification Complete</h1>
        <p>Your Identity Has Been Successfully Verified!</p>
      </div>

      {/* Results Grid */}
      <div className="results-grid">
        {/* Blockchain Verified */}
        <div className="result-card">
          <div className="result-icon success">✓</div>
          <h3>Blockchain Verified</h3>
          <p>Data Secured on Blockchain</p>
          {blockchainPhase?.verified && blockchainPhase.verified !== 'Failed' && (
            <div className="tx-hash">TX: {blockchainPhase.verified.substring(0, 12)}...</div>
          )}
        </div>

        {/* AI Fraud Detection */}
        <div className="result-card">
          <div className={`result-icon ${fraudDetection?.isSuspicious ? 'warning' : 'success'}`}>
            {fraudDetection?.isSuspicious ? '⚠' : '✓'}
          </div>
          <h3>AI Fraud Detection</h3>
          <p>{fraudDetection?.isSuspicious ? 'Suspicious Activity Detected' : 'No Fraudulent Activity Detected'}</p>
          <div className="risk-badge" style={{backgroundColor: fraudDetection?.fraudRiskScore > 50 ? '#ef4444' : '#10b981'}}>
            Risk: {fraudDetection?.fraudRiskScore}%
          </div>
        </div>

        {/* Biometric Match */}
        <div className="result-card">
          <div className={`result-icon ${facePhase?.faces_match ? 'success' : 'warning'}`}>
            {facePhase?.faces_match ? '✓' : '⚠'}
          </div>
          <h3>Biometric Match</h3>
          <p>Biometric Data Verified</p>
          <div className="match-status">
            {facePhase?.faces_match ? 'Faces Match ✓' : 'No Match ✗'}
          </div>
        </div>

        {/* ID Document Verified */}
        <div className="result-card">
          <div className="result-icon success">✓</div>
          <h3>ID Document Verified</h3>
          <p>Document Authenticated</p>
          <div className="doc-info">
            {ocrPhase?.extracted_text_length > 50 ? 'Text Extracted ✓' : 'Limited Text'}
          </div>
        </div>
      </div>

      {/* DID Section */}
      {decentralizedIdentifier?.did && (
        <div className="did-section">
          <h3>Decentralized Identifier (DID)</h3>
          <p>Use this for future verifications without re-uploading documents</p>
          <code className="did-display">{decentralizedIdentifier.did}</code>
        </div>
      )}

      {/* Footer */}
      <div className="results-footer">
        <p className="timestamp">{new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}

// Main App Component
export default function App() {
  const [step, setStep] = useState('questions') // 'questions', 'upload', 'verifying', 'complete', 'error'
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    governmentId: '',
    documentType: 'National ID'
  })
  const [idFile, setIdFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)
  const [walletAddress, setWalletAddress] = useState(null)
  const [verificationData, setVerificationData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [verificationProgress, setVerificationProgress] = useState('Initializing...')

  // Connect wallet on load
  useEffect(() => {
    connectWallet()
  }, [])

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setErrorMessage('MetaMask not detected. Please install MetaMask.')
        return
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setWalletAddress(accounts[0])
      
      // Switch to Hardhat Local network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }]
        })
      } catch (err) {
        if (err.code === 4902) {
          // Network not added, add it
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69',
              chainName: 'Hardhat Local',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
            }]
          })
        }
      }
    } catch (err) {
      console.error('Wallet connection error:', err)
    }
  }

  // Handle form input
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Proceed to upload step
  const handleNextClick = () => {
    if (!formData.fullName || !formData.dateOfBirth || !formData.governmentId) {
      setErrorMessage('Please fill in all fields')
      return
    }
    setStep('upload')
    setErrorMessage('')
  }

  // Handle file uploads
  const handleIdUpload = (e) => {
    setIdFile(e.target.files[0])
  }

  const handleSelfieUpload = (e) => {
    setSelfieFile(e.target.files[0])
  }

  // Submit verification
  const handleVerify = async () => {
    if (!idFile || !selfieFile) {
      setErrorMessage('Please upload both ID and selfie')
      return
    }

    if (!walletAddress) {
      setErrorMessage('Wallet not connected')
      return
    }

    setStep('verifying')
    setErrorMessage('')
    setVerificationProgress('Initializing...')

    try {
      const formDataPayload = new FormData()
      formDataPayload.append('id', idFile)
      formDataPayload.append('selfie', selfieFile)
      formDataPayload.append('address', walletAddress)

      console.log('🚀 Starting verification...')
      setVerificationProgress('📊 Processing with AI...')

      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), 300000) // 5 min timeout

      console.log('📤 Sending files to backend...')
      const response = await fetch('http://localhost:5000/verify', {
        method: 'POST',
        body: formDataPayload,
        signal: abortController.signal,
        headers: {
          'Accept': 'application/json'
        }
      })

      clearTimeout(timeoutId)
      
      setVerificationProgress('⚙️ Finalizing...')
      console.log('🔗 Response received:', response.status)

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 Response data:', data)

      if (data.success) {
        setVerificationData(data.details)
        setStep('complete')
        console.log('✅ Verification successful!')
      } else {
        setErrorMessage(data.message || 'Verification failed')
        setStep('error')
      }
    } catch (err) {
      console.error('❌ Verification error:', err)
      
      if (err.name === 'AbortError') {
        setErrorMessage('Verification timed out (5 minutes). Please try again.')
      } else if (err instanceof SyntaxError) {
        setErrorMessage('Invalid response from server')
      } else {
        setErrorMessage(err.message || 'Verification failed. Please try again.')
      }
      setStep('error')
    }
  }

  // Restart verification
  const handleRestart = () => {
    setStep('questions')
    setFormData({ fullName: '', dateOfBirth: '', governmentId: '', documentType: 'National ID' })
    setIdFile(null)
    setSelfieFile(null)
    setVerificationData(null)
    setErrorMessage('')
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🔐</span>
            <h1>RecaWorks</h1>
          </div>
          <div className="header-info">
            {walletAddress && <div className="wallet-badge">Connected: {walletAddress.substring(0, 12)}...</div>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {step === 'questions' && (
          <div className="step-container questions-step">
            <div className="step-header">
              <h2>Answer a Few Questions</h2>
              <p>Please provide the following information.</p>
            </div>

            <form className="question-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleFormChange('fullName', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <div className="date-input-group">
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Government ID Number</label>
                <input
                  type="text"
                  placeholder="Enter your ID number"
                  value={formData.governmentId}
                  onChange={(e) => handleFormChange('governmentId', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Select Document Type</label>
                <select
                  value={formData.documentType}
                  onChange={(e) => handleFormChange('documentType', e.target.value)}
                >
                  <option>National ID</option>
                  <option>Passport</option>
                  <option>Driver License</option>
                  <option>Other ID</option>
                </select>
              </div>

              {errorMessage && <div className="error-message">{errorMessage}</div>}

              <button type="button" className="btn-primary btn-next" onClick={handleNextClick}>
                Next
              </button>
            </form>
          </div>
        )}

        {step === 'upload' && (
          <div className="step-container upload-step">
            <div className="step-header">
              <h2>Upload Your Documents</h2>
              <p>Please upload your government-issued ID and a selfie for verification.</p>
            </div>

            <div className="upload-area">
              <div className="upload-box">
                <h3>Government ID</h3>
                <p>Upload a clear photo of your ID document</p>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdUpload}
                    className="file-input"
                  />
                  <span className="file-input-text">
                    {idFile ? `✓ ${idFile.name}` : '📄 Click to upload'}
                  </span>
                </label>
              </div>

              <div className="upload-box">
                <h3>Selfie Photo</h3>
                <p>Upload a clear photo of your face</p>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieUpload}
                    className="file-input"
                  />
                  <span className="file-input-text">
                    {selfieFile ? `✓ ${selfieFile.name}` : '📷 Click to upload'}
                  </span>
                </label>
              </div>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <div className="upload-footer">
              <button type="button" className="btn-secondary" onClick={() => setStep('questions')}>
                Back
              </button>
              <button type="button" className="btn-primary" onClick={handleVerify}>
                Verify Identity
              </button>
            </div>
          </div>
        )}

        {step === 'verifying' && (
          <div className="step-container verifying-step">
            <div className="verifying-content">
              <h2>Verifying Your Identity</h2>
              <p>Please wait while we process your verification</p>

              {/* Animated verification ring */}
              <div className="verification-ring"></div>

              <div className="verification-status">
                <p>{verificationProgress}</p>
              </div>

              <div className="progress-indicators">
                <div className="indicator">
                  <div className="indicator-dot"></div>
                  <span>Blockchain</span>
                </div>
                <div className="indicator">
                  <div className="indicator-dot"></div>
                  <span>AI Analysis</span>
                </div>
                <div className="indicator">
                  <div className="indicator-dot"></div>
                  <span>Processing</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="step-container complete-step">
            <VerificationResults data={verificationData} />
            <div className="complete-actions">
              <button className="btn-secondary" onClick={handleRestart}>
                Verify Another Identity
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="step-container error-step">
            <div className="error-content">
              <div className="error-icon">❌</div>
              <h2>Verification Failed</h2>
              <p className="error-details">{errorMessage}</p>
              <button className="btn-primary" onClick={handleRestart}>
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Secure, Private, and Reliable Identity Verification using Blockchain and AI</p>
      </footer>
    </div>
  )
}
