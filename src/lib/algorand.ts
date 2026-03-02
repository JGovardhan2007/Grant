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
