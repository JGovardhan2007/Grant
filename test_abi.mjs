import algosdk from 'algosdk';

const method = algosdk.ABIMethod.fromSignature('release_funds(uint64,string)void');
console.log('Method keys:', Object.keys(method));
console.log('Args:', method.args);
if (method.args && method.args.length > 0) {
    console.log('First arg keys:', Object.keys(method.args[0]));
    console.log('First arg type:', method.args[0].type);
}
