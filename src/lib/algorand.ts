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
//  SMART CONTRACT HELPERS                                                      //
//  Replace CHAIN_GRANT_APP_ID with the real App ID after running deploy.py    //
// ─────────────────────────────────────────────────────────────────────────── //

/**
 * App ID of the deployed ChainGrant escrow contract on Algorand Testnet.
 * Set this after running: smart-contract/deploy.py
 */
export const CHAIN_GRANT_APP_ID = 756434988; // Deployed on Algorand Testnet
export const CHAIN_GRANT_APP_ADDR = 'FO7AU2I7IJ4USPEJCHV6SZNRL5XAOH2MCTB2QFELSNWXY3OYEY62ECH6ZI';

/**
 * Build the grouped transactions to create a grant on-chain.
 * Group:
 *   [0] ApplicationCreateTxn  — deploy a fresh ChainGrant instance
 *   [1] PaymentTxn            — lock ALGO into the new app's escrow account
 *
 * NOTE: "create per grant" requires deploying one contract per grant.
 * For a simpler testnet demo you can deploy ONCE and call create_grant()
 * as an app-call instead. Ask your assistant to switch to that pattern if needed.
 */
export const createGrantContract = async (
  sponsorAddress: string,
  studentAddress: string,
  amountAlgo: number,
  note?: string
) => {
  const params = await algodClient.getTransactionParams().do();
  const microAlgo = algosdk.algosToMicroalgos(amountAlgo);

  // Encode the student address as 32-byte argument for ABI
  const studentBytes = algosdk.decodeAddress(studentAddress).publicKey;

  // ApplicationCallTxn to create_grant  (you will sign this via Pera Wallet)
  const appCallTxn = algosdk.makeApplicationCreateTxnFromObject({
    sender: sponsorAddress,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    // Approval + ClearState program must be loaded from compiled artifacts.
    // For now this is a placeholder — replace with real compiled bytes after deploy.
    approvalProgram: new Uint8Array([1]),
    clearProgram: new Uint8Array([1]),
    numGlobalByteSlices: 2,
    numGlobalInts: 2,
    appArgs: [
      new TextEncoder().encode('create_grant'),
      studentBytes,
    ],
    note: note ? new TextEncoder().encode(note) : undefined,
  });

  // Payment to lock the funds
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: sponsorAddress,
    receiver: algosdk.getApplicationAddress(CHAIN_GRANT_APP_ID),
    amount: microAlgo,
    suggestedParams: params,
  });

  algosdk.assignGroupID([appCallTxn, paymentTxn]);
  return [appCallTxn, paymentTxn];
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
