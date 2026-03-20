---
title: RATS Framework
description: The IETF Remote ATtestation procedureS (RATS) framework — roles, data flows, and how Ratatouille implements it.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

**RATS** (Remote ATtestation procedureS) is the IETF framework (RFC 9334) that defines
the roles, data flows, and conceptual model for remote attestation. Ratatouille is an
implementation of the RATS architecture.

RFC 9334 is the authoritative reference: [RFC 9334 RATS Architecture](https://www.rfc-editor.org/rfc/rfc9334)

---

## RATS roles

The **Attester** produces evidence about its own trustworthiness; in Ratatouille, this is the agent machine running the Keylime Rust agent with its TPM. The **Verifier** appraises evidence against reference values and produces attestation results; in Ratatouille, this is the Keylime verifier, polling every ~10 seconds. The **Relying Party** consumes attestation results to make trust decisions: an FBI system, API gateway, secrets vault, or any other system that requires a verified platform signal. The **Reference Value Provider** produces the reference values (what the Attester should measure); in Ratatouille, this is the policy author via a signed Git push. The **Endorser** vouches for the Attester's hardware: the TPM manufacturer, through the EK certificate chain.

---

## RATS data flows

The RATS architecture defines two primary topologies:

**Passport model** — The Attester presents pre-obtained attestation results to the Relying Party directly.
The Verifier is not in the critical path of the access request.

**Background check model** — The Relying Party queries the Verifier in real time to appraise
Evidence that the Attester presents. Ratatouille uses a variant of this: the verifier runs continuously
in the background, and its running verdict is what the Relying Party queries.

---

## Evidence, endorsements, and attestation results

**Evidence** is the raw claims from the Attester: PCR values, IMA log, and TPM quote with nonce. Evidence is only meaningful in combination with Reference Values. **Endorsements** are background checks on the Attester's hardware: the TPM manufacturer's EK certificate chain, which the Keylime registrar verifies during enrollment. **Reference Values** are the approved baseline: the Ratatouille runtime policy, expressed as a set of approved IMA measurement hashes, signed by an authorized identity and verified by the Verifier. The **Attestation Result** is the Verifier's verdict (TRUSTED or FAILED), produced by comparing Evidence against Reference Values. This is what Ratatouille surfaces in the UI and API.

---

## Freshness

RATS explicitly addresses the **freshness** problem: an attestation result from yesterday
tells you nothing about the machine's state today.

Ratatouille addresses freshness two ways:

1. **Continuous polling**: the verifier polls every ~10 seconds. Attestation results are
   bounded to at most ~10 seconds stale.

2. **Nonce-based challenges**: each TPM quote request includes a fresh nonce. The TPM quote
   is only valid for that nonce. Replaying an old quote fails verification.

For Relying Parties that need a freshness guarantee before an access decision
(e.g., the FBI database access case), Ratatouille's attestation token issuance will
enforce a maximum staleness bound: you only get a token if the most recent successful
attestation was within the last N seconds.

---

## Further reading

[RFC 9334](https://www.rfc-editor.org/rfc/rfc9334) is the authoritative RATS Architecture specification. [Keylime documentation](https://keylime.dev) covers the verifier and agent implementation Ratatouille builds on. [Sigstore documentation](https://docs.sigstore.dev) covers the policy signing infrastructure. The [Remote Attestation Primer](/ra_overview) is Ratatouille's practical overview of RA concepts for readers who want the mechanics without reading the full RFC.
