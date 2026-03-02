# ChainGrant Smart Contract - README

## Files
- `contract.py` — Algorand Python smart contract source
- `deploy.py` — Compile & deploy to Testnet, returns App ID
- `requirements.txt` — Python dependencies

## Setup Steps (do these in order)

### 1. Install Python 3.12
Download from https://www.python.org/downloads/ and check "Add to PATH".

### 2. Open terminal in this directory
```
cd smart-contract
```

### 3. Install Python dependencies
```
pip install -r requirements.txt
```

### 4. Compile the contract to TEAL
```
algokit compile python contract.py --out-dir ./artifacts
```
This creates `artifacts/ChainGrant.approval.compiled` and `artifacts/ChainGrant.clear.compiled`

### 5. Deploy to Testnet
```
python deploy.py
```
When prompted, paste your **25-word Pera Wallet mnemonic**.
> You can get your mnemonic from Pera Wallet → Settings → Show Passphrase.

### 6. Copy the App ID
The script will print something like:
```
✅  Contract deployed successfully!
    App ID : 123456789
```
Copy this ID and paste it into `src/lib/algorand.ts` as `CHAIN_GRANT_APP_ID`.

## Security
**Never share your mnemonic publicly.**
For production, use a `.env` file: `SPONSOR_MNEMONIC=your 25 words here`
