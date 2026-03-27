import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [idFile, setIdFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)
  const [status, setStatus] = useState('Idle')
  const [transaction, setTransaction] = useState(null)

  useEffect(() => {
    const init = async () => {
      if (window.ethereum?.selectedAddress) {
        setWalletAddress(window.ethereum.selectedAddress)
        setStatus('Wallet connected')
      }
    }
    init()

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    }
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus('MetaMask extension required.')
      return
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (!accounts?.length) {
        setStatus('No account selected in MetaMask.')
        return
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0x7a69') {
        try {
          await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7a69' }] })
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x7a69',
                chainName: 'Hardhat Local',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
              }]
            })
          } else {
            setStatus('Switch to Hardhat Local chain (0x7a69) in MetaMask.')
            return
          }
        }
      }

      setWalletAddress(accounts[0])
      setStatus('Wallet connected successfully')

      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          setWalletAddress('')
          setStatus('Wallet disconnected')
        } else {
          setWalletAddress(newAccounts[0])
        }
      })

      window.ethereum.on('chainChanged', (newChainId) => {
        if (newChainId !== '0x7a69') {
          setStatus('Please switch to Hardhat Local network (0x7a69).')
        }
      })
    } catch (err) {
      if (err?.code === 4001) {
        setStatus('User rejected wallet connection request.')
      } else {
        setStatus(`Wallet error: ${err?.message || err}`)
      }
    }
  }

  const disconnectWallet = () => {
    setWalletAddress('')
    setStatus('Wallet disconnected')
    setTransaction(null)
  }

  const handleVerify = async () => {
    if (!idFile || !selfieFile || !walletAddress) {
      setStatus('Upload ID, selfie, connect wallet first.')
      return
    }

    const body = new FormData()
    body.append('id', idFile)
    body.append('selfie', selfieFile)
    body.append('address', walletAddress)

    setStatus('Verifying identity...')

    try {
      const res = await fetch('http://localhost:5000/verify', {
        method: 'POST',
        body,
      })

      if (!res.ok) {
        throw new Error(`Backend error ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      if (!data.success) {
        setStatus(`Verification failed: ${data.message || 'unknown'}`)
        return
      }

      setTransaction(data.details || data)
      setStatus('Identity verified successfully!')
    } catch (err) {
      console.error('verify error', err)
      const msg = err?.message || err
      if (msg.includes('Failed to fetch')) {
        setStatus('Cannot connect to backend. Make sure it is running at http://localhost:5000')
      } else {
        setStatus(`Verification error: ${msg}`)
      }
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Premium Identity Verification</h1>
        <div className="wallet-info">
          {walletAddress && <span className="wallet-address">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>}
          <button className="btn-primary" onClick={walletAddress ? disconnectWallet : connectWallet}>
            {walletAddress ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>
      </header>
      <main className="content">
        <section className="card">
          <h2>Identity Upload</h2>
          <label className="field">
            Government ID
            <input type="file" accept="image/*" onChange={(e) => setIdFile(e.target.files?.[0])} />
          </label>
          <label className="field">
            Selfie
            <input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0])} />
          </label>
          <button className="btn-action" onClick={handleVerify}>Verify Identity</button>
        </section>
        <section className="card status-card">
          <h2>Status</h2>
          <p>{status}</p>
          {transaction && <pre className="response">{JSON.stringify(transaction, null, 2)}</pre>}
        </section>
      </main>
      <footer className="footer">Powered by OCR + FaceAPI + Blockchain</footer>
    </div>
  )
}

export default App
