# FinPulse

Personal finance domain for synchronizing, categorizing, and summarizing a user's **Accounts** and **Transactions** from Open Finance (Banco Inter personal accounts via Meu Pluggy).

## Language

### Accounts & Money

**Account**:
A financial account held at an institution — either a **Checking Account** or a **Credit Card** — that owns **Transactions** and reports a balance.
_Avoid_: Wallet, Bank account (when referring to both checking and credit card)

**Checking Account**:
A deposit **Account** where inflows increase the available balance and outflows decrease it.
_Avoid_: Bank account, Current account

**Credit Card**:
A revolving credit **Account** where purchases increase the owed balance and bill payments or **Refunds** reduce it.
_Avoid_: Card account, Credit line

**Money**:
An exact, non-negative monetary amount paired with an ISO currency code (such as BRL).
_Avoid_: Float, Price, Value

### Transactions & Classification

**Transaction**:
A single financial movement belonging to an **Account**, with a non-negative **Money** amount, an **Accounting Date**, a **Category**, a lifecycle status (`Pending`, `Posted`, or `Cancelled`), and a kind (**Income**, **Expense**, **Refund**, or **Internal Transfer**).
_Avoid_: Entry, Movement, Launch, Record

**Accounting Date**:
The calendar date in the user's configured timezone (defaulting to `America/Sao_Paulo`) that determines which month a **Transaction** belongs to in summaries.
_Avoid_: Timestamp, Created date

**Income**:
A **Transaction** representing real money earned or received (such as salary or incoming transfers from others) that increases monthly net cashflow.
_Avoid_: Credit (when referring to domain classification), Revenue

**Expense**:
A **Transaction** representing real spending (whether paid from a **Checking Account** or purchased on a **Credit Card**) that increases monthly spending totals.
_Avoid_: Debit (when referring to domain classification), Spend, Outflow

**Refund**:
A **Transaction** returning money from a prior **Expense** (such as a cancelled purchase or chargeback). Reduces net spending in its **Category** and month rather than inflating **Income**.
_Avoid_: Reversal, Cashback, Credit

**Internal Transfer**:
A **Transaction** moving money between the user's own **Accounts** — including **Credit Card** bill payments made from a **Checking Account**. Kept in the ledger for reconciliation, but excluded from monthly **Income** and **Expense** totals.
_Avoid_: Self-transfer, Neutral transaction

**Category**:
A user-managed spending or income label assigned to a **Transaction** (with `Uncategorized` as the permanent fallback).
_Avoid_: Tag, Group, Bucket

**Manual Override**:
A user's explicit edit to a **Transaction**'s **Category** or classification kind. Always takes precedence over provider defaults and is never overwritten by subsequent **Sync Runs**.
_Avoid_: Custom field, User patch

### Synchronization

**Sync Run**:
A single execution that fetches **Accounts** and **Transactions** from the external Open Finance provider and reconciles them into FinPulse without duplicating existing records or losing **Manual Overrides**.
_Avoid_: Import, Sync job, Crawl
