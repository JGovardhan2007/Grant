"""
ChainGrant Escrow Smart Contract
=================================
ARC-4 escrow contract for ChainGrant. One contract instance is deployed
as a "template" and individual grants are tracked via a simple escrow pattern.

Architecture:
  - Deploy ONCE via deploy.mjs → get App ID
  - Frontend calls initialize_grant() per grant (grouped with a payment)
  - Frontend calls release_funds() to pay the student
  - Frontend calls request_changes() to emit an on-chain record
"""

from algopy import (
    ARC4Contract,
    GlobalState,
    UInt64,
    Account,
    Txn,
    Global,
    itxn,
    gtxn,
    arc4,
    Bytes,
    String,
)


class ChainGrant(ARC4Contract):
    """Escrow vault for a single ChainGrant grant."""

    def __init__(self) -> None:
        self.sponsor = GlobalState(Account, key="sponsor", description="Grant sponsor address")
        self.student = GlobalState(Account, key="student", description="Grant student address")
        self.total_locked = GlobalState(UInt64, key="total_locked", description="Total microALGO locked")
        self.released = GlobalState(UInt64, key="released", description="MicroALGO released so far")
        # The most recent IPFS/Keccak256 proof hash submitted by the student and approved
        self.latest_proof_hash = GlobalState(String, key="latest_proof_hash", description="Most recent proof hash")
        self.initialized = GlobalState(UInt64, key="initialized", description="1 when grant is active")

    # ------------------------------------------------------------------ #
    # Bare create — allows simple app creation without ABI args           #
    # ------------------------------------------------------------------ #

    @arc4.baremethod(create="allow")
    def create(self) -> None:
        """Deploy the app. State is initialized later via initialize_grant()."""
        self.initialized.value = UInt64(0)

    # ------------------------------------------------------------------ #
    # Initialize grant with funds                                          #
    # ------------------------------------------------------------------ #

    @arc4.abimethod
    def initialize_grant(
        self,
        student: arc4.Address,
        payment: gtxn.PaymentTransaction,
    ) -> None:
        """
        Set up the grant escrow. Must be called by the sponsor after deployment.

        Grouped tx:
          [0] ApplicationCall (this)
          [1] PaymentTransaction — sends ALGO from sponsor to app escrow

        Args:
            student:  Algorand address of the grant recipient.
            payment:  Grouped payment sending ALGO to this app.
        """
        assert self.initialized.value == UInt64(0), "Grant already initialized"
        assert payment.receiver == Global.current_application_address, "Payment must go to app"
        assert payment.amount > UInt64(0), "Must lock at least 1 microALGO"

        self.sponsor.value = Txn.sender
        self.student.value = Account(student.bytes)
        self.total_locked.value = payment.amount
        self.released.value = UInt64(0)
        self.latest_proof_hash.value = String("")
        self.initialized.value = UInt64(1)

    # ------------------------------------------------------------------ #
    # Release funds to student                                             #
    # ------------------------------------------------------------------ #

    @arc4.abimethod
    def release_funds(self, release_amount: arc4.UInt64, proof_hash: arc4.String) -> None:
        """
        Allows the sponsor to release a specific amount to the student.
        Saves the proof hash to global state as permanent on-chain evidence.
        """
        assert self.initialized.value == UInt64(1), "Grant not initialized"
        assert Txn.sender == self.sponsor.value, "Only sponsor can release funds"

        amount_to_release = release_amount.native
        remaining = self.total_locked.value - self.released.value
        assert amount_to_release <= remaining, "Not enough locked funds"
        assert amount_to_release > UInt64(0), "Amount must be positive"

        itxn.Payment(
            receiver=self.student.value,
            amount=amount_to_release,
            fee=0,
        ).submit()

        self.released.value = self.released.value + amount_to_release
        self.latest_proof_hash.value = proof_hash.native

    # ------------------------------------------------------------------ #
    # Request changes (on-chain record, no fund movement)                  #
    # ------------------------------------------------------------------ #

    @arc4.abimethod
    def request_changes(self, milestone_name: arc4.String) -> None:
        """
        Emit an on-chain record that changes are requested for a milestone.
        Only callable by the sponsor. Does not move any funds.
        """
        assert self.initialized.value == UInt64(1), "Grant not initialized"
        assert Txn.sender == self.sponsor.value, "Only sponsor can request changes"
        # The transaction itself (with milestone_name in the note) IS the on-chain record

    # ------------------------------------------------------------------ #
    # Close grant and reclaim remaining funds                              #
    # ------------------------------------------------------------------ #

    @arc4.abimethod
    def close_grant(self) -> None:
        """Return remaining ALGO to the sponsor. Only callable by sponsor."""
        assert self.initialized.value == UInt64(1), "Grant not initialized"
        assert Txn.sender == self.sponsor.value, "Only sponsor can close"

        remaining = self.total_locked.value - self.released.value
        if remaining > UInt64(0):
            itxn.Payment(
                receiver=self.sponsor.value,
                amount=remaining,
                fee=0,
            ).submit()

        self.initialized.value = UInt64(0)

    # ------------------------------------------------------------------ #
    # Read-only helpers                                                    #
    # ------------------------------------------------------------------ #

    @arc4.abimethod(readonly=True)
    def get_balance(self) -> arc4.UInt64:
        """Returns remaining locked microALGO."""
        return arc4.UInt64(self.total_locked.value - self.released.value)

    @arc4.abimethod(readonly=True)
    def get_student(self) -> arc4.Address:
        """Returns the student's address."""
        return arc4.Address(self.student.value.bytes)

    @arc4.abimethod(readonly=True)
    def get_sponsor(self) -> arc4.Address:
        """Returns the sponsor's address."""
        return arc4.Address(self.sponsor.value.bytes)
