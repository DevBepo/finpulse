---
status: accepted
---

# Represent Money as Integer Minor Units with Normalized Direction

FinPulse stores all monetary amounts as exact integer minor units (centavos, e.g., `12345` for R$ 123.45) paired with an ISO currency code (`BRL`), never floating-point numbers. At the Meu Pluggy integration boundary (Anti-Corruption Layer), every incoming transaction is normalized to a non-negative `Money` amount combined with an explicit domain direction/classification.

## Considered Options

- **Signed amounts mirroring Pluggy directly**: Rejected because Pluggy uses opposite signs for checking accounts (expenses negative) and credit cards (purchases positive), which leaks provider quirks into domain calculations.
- **Database `NUMERIC`/decimal strings with signed amounts**: Avoids float rounding errors, but still forces every domain calculation to remember sign conventions per account type.
- **Integer minor units + normalized non-negative `Money` + explicit domain direction (chosen)**: Eliminates floating-point drift across every layer and isolates Pluggy's sign inversion behind the Anti-Corruption Layer.

## Consequences

- Every calculation in the domain operates on integer arithmetic and explicit transaction kinds, never raw provider signs.
- Display formatting (`R$ 1.234,56`) and Pluggy payload conversion happen strictly at the outer adapters (UI and Pluggy ACL).
