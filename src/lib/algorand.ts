import algosdk from 'algosdk';

// Testnet configuration
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

/**
 * Sends a payment transaction on Algorand Testnet.
 */
export const sendPayment = async (sender: string, receiver: string, amount: number, note?: string) => {
  const params = await algodClient.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver,
    amount: algosdk.algosToMicroalgos(amount),
    note: note ? new TextEncoder().encode(note) : undefined,
    suggestedParams: params,
  });

  return txn;
};

/**
 * Mints a non-transferable NFT badge (ASA).
 */
export const mintBadge = async (sender: string, assetName: string, unitName: string, url: string) => {
  const params = await algodClient.getTransactionParams().do();
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    sender,
    assetName,
    unitName,
    assetURL: url,
    total: 1,
    decimals: 0,
    defaultFrozen: true,
    suggestedParams: params,
  });

  return txn;
};

// Utility to shorten addresses for display
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

// ─────────────────────────────────────────────────────────────────────────── //
//  SMART CONTRACT DEPLOYMENT CONSTANTS                                         //
// ─────────────────────────────────────────────────────────────────────────── //

// The original global instance (Kept for backwards compatibility if needed elsewhere)
export const CHAIN_GRANT_APP_ID = 756434988;
export const CHAIN_GRANT_APP_ADDR = 'FO7AU2I7IJ4USPEJCHV6SZNRL5XAOH2MCTB2QFELSNWXY3OYEY62ECH6ZI';

// Base64 Compiled PyTeal from ChainGrant.arc56.json
const APPROVAL_PROGRAM_B64 = 'CyAEAAEgAiYHC2luaXRpYWxpemVkB3Nwb25zb3IIcmVsZWFzZWQMdG90YWxfbG9ja2VkB3N0dWRlbnQEFR98dRFsYXRlc3RfcHJvb2ZfaGFzaDEbQQBAMRkURDEYRIIHBN10r7oEUsoMoQT8zEq7BGQ74FkEuRDHewTFaROGBL+Vl2Q2GgCOBwAKAEwApgDDAPYBBwEYADEZFEQoImcjQzYaAUkVSSQSRDEWIwlJOBAjEkQiKGVEFERJOAcyChJEOAhJRCkxAGckTwISRCcETwJnK0xnKiJnJwaAAGcoI2cjQzYaAUkVgQgSRDYaAkkiWSUISwEVEkQiKGVEIxJEMQAiKWVEEkRMFyIrZUQiKmVETEsBCUsCD0RLAUSxIicEZURLArIIsgcjshAisgGzCCpMZ1cCACcGTGcjQzYaAUkiWSUITBUSRCIoZUQjEkQxACIpZUQSRCNDIihlRCMSRDEAIillRBJEIitlRCIqZUQJSUEAErEiKWVESwGyCLIHI7IQIrIBsygiZyNDIitlRCIqZUQJFicFTFCwI0MiJwRlREkVJBJEJwVMULAjQyIpZURJFSQSRCcFTFCwI0M=';
const CLEAR_PROGRAM_B64 = 'C4EBQw==';

const getProgramBytes = (base64str: string) => {
  const binaryString = window.atob(base64str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Build the grouped transactions to dynamically DEPLOY and INITIALIZE a new ChainGrant smart contract.
 * Group:
 *   [0] ApplicationCreateTxn  — DEPLOYS the base contract to Algorand
 *   [1] PaymentTxn            — Funds the newly created un-initialized contract
 *   [2] ApplicationCallTxn    — Calls `initialize_grant()` on the new app to bind sponsor, student, and funds.
 */
export const createGrantContract = async (
  sponsorAddress: string,
  studentAddress: string,
  amountAlgo: number,
  note?: string
) => {
  const params = await algodClient.getTransactionParams().do();
  const microAlgo = algosdk.algosToMicroalgos(amountAlgo);

  // 1. Deploy the Contract (Bare Create)
  const deployTxn = algosdk.makeApplicationCreateTxnFromObject({
    sender: sponsorAddress,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: getProgramBytes(APPROVAL_PROGRAM_B64),
    clearProgram: getProgramBytes(CLEAR_PROGRAM_B64),
    // Extracted exactly from ARC-56 JSON / contract.py GlobalState counts
    numGlobalByteSlices: 3, // sponsor (account), student (account), latest_proof_hash (String)
    numGlobalInts: 3,       // total_locked, released, initialized
    appArgs: [],
    note: note ? new TextEncoder().encode(note) : undefined,
  });

  // NOTE: A more robust way since we don't know exact app ID at group formation:
  // We can't actually do a 3-txn group if the 2nd txn needs the Receiver address of the app created in txn 1.
  // We have to deploy FIRST as a single atomic transaction, wait for the network to assign an App ID to it, 
  // THEN do the initialize_grant funding group.

  return [deployTxn]; // UI MUST handle this two-step process now.
};

/**
 * Build the application-call transaction to release funds for one milestone.
 * Only the sponsor can call this; the contract transfers ALGO directly to the student.
 */
export const releaseMilestoneFunds = async (
  sponsorAddress: string,
  appId: number,
  amountAlgo: number,
) => {
  const params = await algodClient.getTransactionParams().do();
  const microAlgo = algosdk.algosToMicroalgos(amountAlgo);

  // ABI encode the amount
  const amountEncoded = algosdk.encodeUint64(microAlgo);

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: sponsorAddress,
    suggestedParams: params,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new TextEncoder().encode('release_funds'),
      amountEncoded,
    ],
  });

  return txn;
};
