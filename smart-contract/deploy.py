"""
ChainGrant Deploy Script
========================
Run this after Python + requirements are installed:

    cd smart-contract
    pip install -r requirements.txt
    algokit compile python contract.py --out-dir ./artifacts
    python deploy.py

It will print the App ID to paste into src/lib/algorand.ts
"""

import base64
import json
import os
import sys

from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCreateTxn,
    PaymentTxn,
    StateSchema,
    wait_for_confirmation,
    assign_group_id,
)

# ------------------------------------------------------------------ #
# Config                                                               #
# ------------------------------------------------------------------ #

ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN   = ""          # Algonode is public, no token needed

# Read sponsor mnemonic from .env or prompt
MNEMONIC = os.environ.get("SPONSOR_MNEMONIC") or input("Paste your Pera Wallet mnemonic (25 words): ").strip()

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

# ------------------------------------------------------------------ #
# Helpers                                                              #
# ------------------------------------------------------------------ #

def load_artifacts() -> tuple[bytes, bytes]:
    """Load compiled approval and clear programs."""
    approval_path = os.path.join(ARTIFACTS_DIR, "ChainGrant.approval.compiled")
    clear_path    = os.path.join(ARTIFACTS_DIR, "ChainGrant.clear.compiled")

    if not os.path.exists(approval_path):
        print(f"\n❌  Compiled artifact not found at {approval_path}")
        print("   Run: algokit compile python contract.py --out-dir ./artifacts")
        sys.exit(1)

    with open(approval_path, "rb") as f:
        approval = f.read()
    with open(clear_path, "rb") as f:
        clear = f.read()

    return approval, clear


def deploy_contract(client: algod.AlgodClient, private_key: str, sender: str) -> int:
    """Deploy the ChainGrant contract and return the App ID."""

    approval, clear = load_artifacts()

    # Global state: 4 byte-slices (sponsor, student) + 2 uint64 (total_locked, released)
    global_schema = StateSchema(num_uints=2, num_byte_slices=2)
    local_schema  = StateSchema(num_uints=0, num_byte_slices=0)

    params = client.suggested_params()

    txn = ApplicationCreateTxn(
        sender=sender,
        sp=params,
        on_complete=0,          # NoOp (create)
        approval_program=approval,
        clear_program=clear,
        global_schema=global_schema,
        local_schema=local_schema,
    )

    signed = txn.sign(private_key)
    tx_id  = client.send_transaction(signed)
    result = wait_for_confirmation(client, tx_id, 4)

    app_id: int = result["application-index"]
    return app_id


# ------------------------------------------------------------------ #
# Main                                                                 #
# ------------------------------------------------------------------ #

if __name__ == "__main__":
    # Recover keys
    private_key = mnemonic.to_private_key(MNEMONIC)
    sender      = account.address_from_private_key(private_key)

    # Connect to Testnet
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

    print(f"\n🚀  Deploying ChainGrant contract from: {sender}")
    app_id = deploy_contract(client, private_key, sender)

    print(f"\n✅  Contract deployed successfully!")
    print(f"    App ID : {app_id}")
    print(f"    App Addr: {account.address_from_private_key(private_key)}")
    print(f"\n👉  Copy this App ID into src/lib/algorand.ts → CHAIN_GRANT_APP_ID")
    print(f"    https://lora.algokit.io/testnet/application/{app_id}")
