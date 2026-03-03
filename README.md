# ChainGrant: Decentralized Transparent Grant Management

ChainGrant is a blockchain-powered platform designed to bring transparency and accountability to grant management and student funding. Built on **Algorand**, it ensures that funds are only released when milestones are met and verified, creating a trustless ecosystem for sponsors and recipients.

## 🚀 Key Features

- **Decentralized Escrow**: Funds are locked in smart contracts and released only upon approval.
- **Milestone Tracking**: Students upload proof of work (hashed on-chain) for verification.
- **Sponsor Dashboard**: Full control over fund release and change requests.
- **Student Dashboard**: Track progress and manage work submissions.
- **ARC-4 Compliant**: All smart contract interactions follow the latest Algorand standards.
- **Netlify Ready**: Pre-configured for seamless production deployment.

## 🛠 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion.
- **Blockchain**: Algorand (algosdk), PyTeal/Algopy (Smart Contracts).
- **Database**: Firebase Firestore (Metadata & Tracking).
- **Auth**: Firebase Authentication (Wallet-linked).

## 🌍 Live Demo

Once deployed on Netlify, your URL will appear here.

## 🔧 Local Development

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Algokit](https://github.com/algorandfoundation/algokit-cli) (for contract development)
- A Testnet Account (Get one at [Pera Wallet](https://perawallet.app/))

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/JGovardhan2007/Grant.git
cd Grant

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Locally
```bash
npm run dev
```
The app uses a Vite proxy at `/algonode-testnet` to connect to `https://testnet-api.algonode.cloud` without CORS issues.

## 📜 Smart Contract Architecture

The contract (`smart-contract/contract.py`) handles:
- **`initialize_grant(student, pay)`**: Locks funds and binds names.
- **`release_funds(amount, proof)`**: Transfers ALGO from escrow to student.
- **`request_changes(feedback)`**: Records revision requests on-chain.
- **`close_grant()`**: Refunds remaining balance to the sponsor.

## 🚀 Deployment to Netlify

The project includes a `netlify.toml` for automated configuration:
1. Connect this repo to Netlify.
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Redirects and API Proxying (Testnet) are handled automatically.

## 📄 License
This project is licensed under the MIT License.
