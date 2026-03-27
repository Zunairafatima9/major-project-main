@echo off
REM Quick Start Script for Identity Verification System
REM This script opens multiple terminals for each component

echo.
echo ========================================
echo Identity Verification System - Quick Start
echo ========================================
echo.
echo This script will open 4 terminals for:
echo   1. Hardhat Blockchain Node (port 8545)
echo   2. Identity Contract Deployment
echo   3. Backend Verification Server (port 5000)
echo   4. Frontend React App (port 3000)
echo.
echo IMPORTANT: MetaMask must be installed
echo Add Hardhat network: http://127.0.0.1:8545 (Chain ID: 31337)
echo.
pause

cd /d "%~dp0"

REM Terminal 1: Hardhat Node
echo Starting Hardhat blockchain node...
start "1. Hardhat Node" cmd /k "cd identity-blockchain && npx hardhat node"

timeout /t 3 /nobreak

REM Terminal 2: Deploy Contract
echo Starting contract deployment...
start "2. Deploy Contract" cmd /k "cd identity-blockchain && timeout /t 5 && npx hardhat ignition deploy ./ignition/modules/IdentityModule.js --network localhost"

timeout /t 3 /nobreak

REM Terminal 3: Backend Server
echo Starting backend verification server...
start "3. Backend Server" cmd /k "cd identity-backend && npm install && npm start"

timeout /t 3 /nobreak

REM Terminal 4: Frontend
echo Starting React frontend...
start "4. Frontend React App" cmd /k "cd identity-frontend\myapp && npm install && npm start"

timeout /t 2 /nobreak

echo.
echo ========================================
echo Starting all services...
echo ========================================
echo.
echo Once all terminals are ready:
echo   - Frontend: http://localhost:3000
echo   - Backend: http://localhost:5000
echo   - Blockchain: http://127.0.0.1:8545
echo.
echo DO NOT close any terminal window!
echo.
pause
