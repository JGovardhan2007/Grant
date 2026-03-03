import algosdk from 'algosdk';

const ALGOD_SERVER = window.location.origin + '/algonode-testnet';
const ALGOD_TOKEN = '';
const ALGOD_PORT = undefined;

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Standard App ID and Address for legacy/singleton support
export const CHAIN_GRANT_APP_ID = 756452255;
export const CHAIN_GRANT_APP_ADDR = algosdk.getApplicationAddress(CHAIN_GRANT_APP_ID);

/**
 * Enhanced error handler for Algorand network requests
 */
export const handleNetworkError = (error: any) => {
  console.error('Algorand error:', error);
  if (error.message?.includes('Failed to fetch')) {
    return 'Network Error: Cannot reach Algorand Testnet. Check your internet or if the proxy is running.';
  }
  return `Transaction Error: ${error.message || 'Unknown error'}`;
};

/**
 * Manually concatenate Uint8Arrays because algosdk.concatArrays might be missing in some versions
 */
export const concatUint8Arrays = (arrays: Uint8Array[]): Uint8Array => {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
};

/**
 * Utility to format Algorand addresses for display
 */
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Build the application-call transaction to release funds for one milestone.
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

  // ARC-4 ABI: amount (uint64) is exactly 8 bytes big-endian
  const amountEncoded = algosdk.encodeUint64(microAlgo);

  // ARC-4 ABI: string is 2-byte length prefixed (dynamic)
  const proofEncoded = new algosdk.ABIStringType().encode(proofHash);

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: sponsorAddress,
    suggestedParams: { ...params, fee: 2000, flatFee: true }, // Cover inner payment
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      method.getSelector(),
      amountEncoded,
      proofEncoded
    ],
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

  const nameEncoded = new algosdk.ABIStringType().encode(milestoneName);

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: sponsorAddress,
    suggestedParams: { ...params, fee: 1000, flatFee: true },
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      method.getSelector(),
      nameEncoded
    ],
  });

  return txn;
};
