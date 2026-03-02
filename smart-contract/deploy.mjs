/**
 * ChainGrant Deploy Script (Node.js)
 * =====================================
 * Uses the algosdk npm package (already in the project) to deploy
 * the compiled TEAL contract to Algorand Testnet.
 *
 * Run from the project root:
 *   node smart-contract/deploy.mjs
 */

import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// -------------------------------------------------- //
//  Config                                             //
// -------------------------------------------------- //
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
const ALGOD_PORT = 443;

const ARTIFACTS = path.join(__dirname, 'artifacts');

// -------------------------------------------------- //
//  Helpers                                            //
// -------------------------------------------------- //

function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function compileTeal(client, tealSource) {
    const result = await client.compile(tealSource).do();
    return new Uint8Array(Buffer.from(result.result, 'base64'));
}

// -------------------------------------------------- //
//  Main                                               //
// -------------------------------------------------- //

async function main() {
    const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

    // 1. Load TEAL source files
    const approvalPath = path.join(ARTIFACTS, 'ChainGrant.approval.teal');
    const clearPath = path.join(ARTIFACTS, 'ChainGrant.clear.teal');

    if (!fs.existsSync(approvalPath)) {
        console.error(`\n❌  Approval TEAL not found at ${approvalPath}`);
        console.error('   Run: algokit compile python contract.py --out-dir ./artifacts');
        process.exit(1);
    }

    const approvalTeal = fs.readFileSync(approvalPath, 'utf-8');
    const clearTeal = fs.readFileSync(clearPath, 'utf-8');

    // 2. Compile TEAL to bytecode
    console.log('\n⚙️   Compiling TEAL...');
    const approvalProgram = await compileTeal(client, approvalTeal);
    const clearProgram = await compileTeal(client, clearTeal);
    console.log('✅  TEAL compiled.');

    // 3. Get mnemonic from user
    const mn = await prompt('\n🔑  Paste your Pera Wallet mnemonic (25 words, space-separated):\n> ');
    const privateKey = algosdk.mnemonicToSecretKey(mn);
    const senderAddr = privateKey.addr;
    console.log(`\n📤  Deploying from: ${senderAddr}`);

    // 4. Build ApplicationCreateTxn
    const params = await client.getTransactionParams().do();

    const txn = algosdk.makeApplicationCreateTxnFromObject({
        sender: senderAddr,
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram,
        clearProgram,
        numGlobalByteSlices: 3,   // sponsor (address), student (address), latest_proof_hash (string)
        numGlobalInts: 3,         // total_locked, released, initialized
        numLocalByteSlices: 0,
        numLocalInts: 0,
    });

    // 5. Sign and send
    const signedTxn = txn.signTxn(privateKey.sk);
    const sendResult = await client.sendRawTransaction(signedTxn).do();
    const txid = sendResult.txid;   // algosdk v3 returns lowercase 'txid'
    console.log(`\n⏳  Waiting for confirmation (tx: ${txid})...`);

    const result = await algosdk.waitForConfirmation(client, txid, 10);
    // algosdk v3 uses camelCase
    const appId = result.applicationIndex ?? result['application-index'];

    // 6. Done!
    console.log('\n🎉  ============================================================');
    console.log(`    CONTRACT DEPLOYED SUCCESSFULLY`);
    console.log(`    App ID   : ${appId}`);
    console.log(`    App Addr : ${algosdk.getApplicationAddress(appId)}`);
    console.log(`    Explorer : https://lora.algokit.io/testnet/application/${appId}`);
    console.log('    ============================================================');
    console.log('\n👉  Now open  src/lib/algorand.ts');
    console.log(`    Replace:  export const CHAIN_GRANT_APP_ID = 0;`);
    console.log(`    With:     export const CHAIN_GRANT_APP_ID = ${appId};`);
}

main().catch(err => {
    console.error('\n❌  Deploy failed:', err.message ?? err);
    process.exit(1);
});
