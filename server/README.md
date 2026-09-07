# Payment integration status

This directory implements a server-only SQLite ledger based on the supplied
FastAPI example. It is not a deployed checkout or webhook. The current game
still uses browser-local currency; do not sell that balance for real money.

Implemented: server-priced orders, exact amount/currency/provider matching,
atomic credits/debits and inventory, database-enforced deduplication, request
retries, foreign keys, and concurrent transaction tests. Money amounts use
integer minor units. Tests contain fictional prices, not commercial offers.

Run from the project root: `python -m unittest discover -s server -v`.

Before enabling checkout:

1. Choose the merchant's payment provider and obtain sandbox credentials through
   secret configuration, plus merchant-approved package prices and currency.
2. Implement account authentication and resolve user identity from the session.
3. Implement a provider adapter that verifies webhook signatures and retrieves
   the completed capture, merchant/payee and server order reference. Only that
   adapter may call `credit_verified_payment`; never expose this function as an
   unauthenticated JSON endpoint. An approved order alone is not a paid capture.
4. Move paid inventory and currency operations to authenticated server APIs;
   never import client-reported gold as a purchased balance. Include refunds,
   reversals, order reconciliation, receipts and recovery across devices.
5. Test sandbox checkout, duplicate/out-of-order notifications, refunds and
   interrupted requests before any live charge.

Deployment is undecided. The existing website is a Cloudflare Worker; this
Python/SQLite module is not automatically part of that deployment. A FastAPI
service requires an appropriate persistent host, or the ledger must be adapted
to Cloudflare's server/database runtime. No paid service has been provisioned.
