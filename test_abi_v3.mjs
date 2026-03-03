import algosdk from 'algosdk';

const microAlgo = BigInt(1000000);
const proofHash = "some_hash";

const uintType = new algosdk.ABIUintType(64);
const stringType = new algosdk.ABIStringType();

const encodedUint = uintType.encode(microAlgo);
const encodedString = stringType.encode(proofHash);

console.log('Encoded Uint (len):', encodedUint.length);
console.log('Encoded String (len):', encodedString.length);
console.log('First 2 bytes of string (prefix):', encodedString[0], encodedString[1]);
