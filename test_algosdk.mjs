import algosdk from 'algosdk';

const baseServer = 'http://localhost:5173/algonode-testnet';
const client = new algosdk.Algodv2('', baseServer, undefined);

console.log('Client configuration:');
const c = client.c;
if (c) {
    console.log('Base Server:', c.baseServer);
    console.log('Port:', c.port);
} else {
    console.log('Internal client configuration (c) not found.');
    console.log('Internal props:', Object.keys(client));
}
