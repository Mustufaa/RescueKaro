# Razorpay test setup

The schema and environment contract reserve Razorpay Test Mode fields, but provider order creation, checkout verification, webhook handling, and reconciliation are not implemented yet. No payment in the current UI is authoritative.

When implementing Phase 5, set `RAZORPAY_MODE=test`, provide `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and a distinct `RAZORPAY_WEBHOOK_SECRET`, create orders server-side, verify checkout signatures against the exact provider order/payment input, verify webhook signatures against raw bytes, validate amount/currency/provider IDs, deduplicate event IDs, and call the idempotent sticker allocator only after authoritative paid/captured state. Use Razorpay’s current official test-mode documentation for test instruments.
