---
status: accepted
---

# Account Credit Card Spending on Purchase Date and Treat Bill Payments as Internal Transfers

Monthly expense summaries count credit card purchases on their purchase date rather than when the bill is paid. Both sides of a credit card bill payment (the debit from the checking account and the credit on the credit card) are classified as `Internal Transfer` and excluded from monthly income and expense totals while remaining visible in the ledger for balance reconciliation.

## Considered Options

- **Cash-basis accounting (count only bill payments from checking)**: Rejected because it collapses a month of categorized purchases into a single lump-sum bill payment, destroying category visibility.
- **Naive sum of all debits**: Rejected because it double-counts every credit card purchase (once on the card, once when paying the bill).
- **Purchase-date accrual + bill payments as `Internal Transfer` (chosen)**: Preserves accurate per-category monthly spending while preventing double-counting and keeping full ledger auditability.

## Consequences

- Monthly cashflow summaries reflect real spending behavior by category and month, not checking-account liquidity timing.
- The system must support marking bill-payment transactions (and other own-account transfers) as `Internal Transfer` without deleting them from the ledger.
