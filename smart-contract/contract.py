"""
ChainGrant Escrow Smart Contract
=================================
This ARC-4 Algorand smart contract acts as an escrow vault for a single grant.

Flow:
  1. Sponsor calls create_grant() with a grouped payment transaction → ALGO locked in app.
  2. For each approved milestone, sponsor calls release_funds() → ALGO sent directly to student wallet.
  3. Sponsor can call request_changes() to mark a milestone blocked (purely informational on-chain).
  4. Sponsor can reclaim remaining ALGO via close_grant() if grant is cancelled.

Global State keys (8 total):
  - sponsor      : Address of grant creator
  - student      : Address of student receiving payments
  - total_locked : uint64 — total ALGO (microALGO) deposited
  - released     : uint64 — running total microALGO already paid out
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
)


class ChainGrant(ARC4Contract):
    """Escrow vault for a single ChainGrant grant."""

    # ------------------------------------------------------------------ #
    # Global state declarations                                            #
    # ------------------------------------------------------------------ #
    sponsor: GlobalState[Account]
    student: GlobalState[Account]
    total_locked: GlobalState[UInt64]
    released: GlobalState[UInt64]

    # ------------------------------------------------------------------ #
    # Lifecycle                                                            #
    # ------------------------------------------------------------------ #

    @arc4.abimethod(create="require")
    def create_grant(
        self,
        student: arc4.Address,
        payment: gtxn.PaymentTransaction,
    ) -> None:
        """
        Deploy the contract and lock funds in one grouped transaction.

        Grouped tx:
          [0] ApplicationCall (this transaction, deploying the contract)
          [1] PaymentTransaction — sending ALGO from sponsor to app address

        Args:
            student:  Algorand address of the grant recipient (student).
            payment:  Grouped PaymentTransaction that sends ALGO to this app.
        """
        # Validate the payment goes to this app's escrow address
        assert payment.receiver == Global.current_application_address, "Payment must go to app"
        assert payment.amount > UInt64(0), "Must lock at least 1 microALGO"

        # Store state
        self.sponsor.value = Txn.sender
        self.student.value = Account(student.bytes)
        self.total_locked.value = payment.amount
        self.released.value = UInt64(0)

    # ------------------------------------------------------------------ #
    # Actions                                                              #
    # ------------------------------------------------------------------ #

    @arc4.abimethod
    def release_funds(self, amount_micro_algo: arc4.UInt64) -> None:
        """
        Release a specific amount (microALGO) from escrow to the student.
        Only the sponsor can call this.

        Args:
            amount_micro_algo: Amount in microALGO to release (1 ALGO = 1_000_000 µA).
        """
        assert Txn.sender == self.sponsor.value, "Only sponsor can release funds"

        release_amount = amount_micro_algo.native
        remaining = self.total_locked.value - self.released.value
        assert release_amount <= remaining, "Not enough locked funds"
        assert release_amount > UInt64(0), "Amount must be positive"

        # Transfer ALGO to student
        itxn.Payment(
            receiver=self.student.value,
            amount=release_amount,
            fee=Global.min_txn_fee,
        ).submit()

        self.released.value = self.released.value + release_amount

    @arc4.abimethod
    def request_changes(self, milestone_name: arc4.String) -> None:
        """
        Record a 'changes requested' event on-chain (via app log / note).
        Only the sponsor can call this. Does not move funds.

        Args:
            milestone_name: Name of the milestone being flagged.
        """
        assert Txn.sender == self.sponsor.value, "Only sponsor can request changes"
        # The call itself (with its note) is the on-chain record — no state change needed.
        _ = milestone_name  # suppress linter warning; value is in tx note/log

    @arc4.abimethod
    def close_grant(self) -> None:
        """
        Return all remaining unclaimed ALGO to the sponsor and close the app.
        Only callable by the sponsor.
        """
        assert Txn.sender == self.sponsor.value, "Only sponsor can close"

        remaining = self.total_locked.value - self.released.value
        if remaining > UInt64(0):
            itxn.Payment(
                receiver=self.sponsor.value,
                amount=remaining,
                fee=Global.min_txn_fee,
            ).submit()

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
