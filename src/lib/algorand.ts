import algosdk from 'algosdk';

// Testnet configuration
const algodToken = '';
const algodServer = window.location.origin + '/algonode-testnet';

export const algodClient = new algosdk.Algodv2(algodToken, algodServer, undefined);

/**
 * Enhanced error handler for Algorand network requests.
 */
export const handleNetworkError = (error: any): string => {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return 'Network Connection Error: Unable to reach the Algorand node. Please check if your VPN or Firewall is blocking https://testnet-api.algonode.cloud';
  }
  if (error?.message?.includes('ERR_CONNECTION_RESET')) {
    return 'Connection Reset: The connection to the Algorand network was interrupted. This often happens due to network instability or security software.';
  }
  return error?.message || 'An unknown error occurred during the blockchain operation.';
};

/**
 * Helper to concatenate multiple Uint8Arrays into one.
 * Useful for combining signed transactions for group submission.
 */
export const concatUint8Arrays = (arrays: Uint8Array[]) => {
  const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
};


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
  try {
    const params = await algodClient.getTransactionParams().do();
    const microAlgo = algosdk.algosToMicroalgos(amountAlgo);

    // 1. Deploy the Contract (Bare Create)
    const deployTxn = algosdk.makeApplicationCreateTxnFromObject({
      sender: sponsorAddress,
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram: getProgramBytes(APPROVAL_PROGRAM_B64),
      clearProgram: getProgramBytes(CLEAR_PROGRAM_B64),
      numGlobalByteSlices: 3,
      numGlobalInts: 3,
      appArgs: [],
      note: note ? new TextEncoder().encode(note) : undefined,
    });

    return [deployTxn];
  } catch (error) {
    console.error('Failed to prepare deployment transaction:', error);
    throw new Error(handleNetworkError(error));
  }
};


/**
 * Build the application-call transaction to release funds for one milestone.
 * Only the sponsor can call this; the contract transfers ALGO directly to the student.
 */
export const releaseMilestoneFunds = async (
  sponsorAddress: string,
  appId: number,
  studentAddress: string,
  amountInr: number,
  proofHash: string
) => {
  const params = await algodClient.getTransactionParams().do();
  // 1 INR = 1000 microALGO for testnet demo balance
  const microAlgo = BigInt(Math.round(amountInr * 1000));

  const method = algosdk.ABIMethod.fromSignature('release_funds(uint64,string)void');

  // ARC-4 ABI: Arguments must be packed into a single tuple and passed as appArgs[1]
  const argTypes = method.args.map(a => a.type as algosdk.ABIType);
  const tupleType = new algosdk.ABITupleType(argTypes);
  const packedArgs = tupleType.encode([microAlgo, proofHash]);

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: sponsorAddress,
    suggestedParams: { ...params, fee: 2000, flatFee: true }, // Cover inner payment
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [method.getSelector(), packedArgs],
    accounts: [studentAddress], // Must include recipient for inner txn
  });

  return txn;
};

/**
 * Build the application-call transaction to record a change request on-chain.
 */
export const requestMilestoneChanges = async (
  sponsorAddress: string,
  appId: number,
  milestoneName: string
) => {
  const params = await algodClient.getTransactionParams().do();
  const method = algosdk.ABIMethod.fromSignature('request_changes(string)void');

  const argTypes = method.args.map(a => a.type as algosdk.ABIType);
  const tupleType = new algosdk.ABITupleType(argTypes);
  const packedArgs = tupleType.encode([milestoneName]);

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: sponsorAddress,
    suggestedParams: { ...params, fee: 1000, flatFee: true },
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [method.getSelector(), packedArgs],
  });

  return txn;
};
