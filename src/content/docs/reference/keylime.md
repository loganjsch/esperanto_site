---
title: Keylime
description: How Ratatouille uses Keylime for TPM-based remote attestation and IMA log verification.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

**Keylime** is an open source, CNCF-hosted remote attestation system built on TPM 2.0. It is the core attestation engine Ratatouille runs on top of. Rather than rebuilding TPM quote verification, IMA log appraisal, and agent lifecycle management, Ratatouille orchestrates Keylime and adds the policy management, GitOps integration, and API layer on top.

[Keylime documentation](https://keylime.dev) — [GitHub](https://github.com/keylime/keylime)

---

## Components

Keylime has three components. The **agent** runs on every device being attested. It is a Rust binary that interfaces with the local TPM — producing quotes, registering with the registrar, and streaming IMA log data to the verifier. Ratatouille's install script deploys and configures the agent automatically.

The **registrar** is a central service that holds the enrolled agent inventory and their AIK (Attestation Identity Key) certificates. When an agent enrolls, the registrar verifies its EK certificate against the TPM manufacturer's CA, establishes the AIK, and records the device.

The **verifier** receives attestations pushed by enrolled agents — by default every ~10 seconds — each containing a fresh TPM quote and the new IMA log entries since the last cycle. It appraises the quote signature, PCR values, and IMA log entries against the active policy for that agent. Ratatouille's verifier adapter wraps Keylime's verifier API to pull attestation results and surface them in the dashboard and API.

Keylime's push model replaces the older pull design in which the verifier reached into agents over the network. With the push model, agents make only outbound connections, never opening an inbound port — a meaningful security and deployability win for edge and IoT fleets.

---

## What Keylime verifies

On each pushed attestation, Keylime verifies:

- The TPM quote is signed by the agent's AIK (proving it came from a registered TPM)
- The quote includes the requested nonce (proving freshness — not a replay)
- PCR values in the quote match expected values (Ratatouille configures PCR[7] for Secure Boot state and PCR[10] for the IMA log)
- IMA log entries hash-extend correctly into PCR[10] (the log hasn't been truncated or tampered with)
- Each IMA log entry's file hash appears in the active runtime policy (no unknown binaries executed)

If any check fails, the agent's status is set to `FAILED` and Ratatouille surfaces the failure immediately.

---

## How Ratatouille uses Keylime

Ratatouille treats Keylime as infrastructure. When you enroll a device via `rat enroll`, the install script:

1. Installs and starts the Keylime Rust agent
2. The agent registers with Ratatouille's registrar via the TPM activate-credential ceremony
3. The agent opens a Proof-of-Possession (PoP) session with the verifier — proving control of the registered Attestation Key via a TPM-signed challenge — and receives a short-lived bearer token
4. Ratatouille's tenant controller (`keylime_tenant`) pushes the active runtime policy to the verifier for that agent
5. The agent begins pushing attestations to the verifier on the configured interval

Policy updates (from a signed Git push) are fanned out via `keylime_tenant -c update` to the verifier, which evaluates the new allowed-hash set against subsequent pushed attestations.

---

## Further reading

[RATS Framework](/reference/rats) — the IETF architecture Keylime implements.
[Linux IMA](/reference/ima) — the kernel subsystem that produces the measurements Keylime verifies.
[Sigstore / Cosign](/reference/sigstore) — how runtime policies are signed before being pushed to Keylime.
