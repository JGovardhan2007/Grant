import algosdk from 'algosdk';

// Testnet configuration
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Utility to shorten addresses for display
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};
