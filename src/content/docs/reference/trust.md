---
title: Trust & Attestation
description: The trust model behind Ratatouille — what it guarantees, where the chain starts, and what its limits are.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

## Trust is never absolute: it's a chain

Remote attestation doesn't create trust from nothing. It creates a **verifiable chain**
from a hardware root of trust through to a relying party's policy decision.

Each link in the chain has explicit trust assumptions. The TPM Endorsement Key requires trusting the TPM manufacturer's CA. The AIK binding requires trusting the Keylime registrar's credential issuance. PCR measurements require trusting that the TPM measures boot components faithfully. The IMA log requires trusting the Linux kernel's integrity measurement subsystem. The runtime policy requires trusting the identity that signed it (Sigstore OIDC). The Rekor log requires trusting the Sigstore transparency log, which is append-only and publicly verifiable.

This is analogous to the TLS/X.509 trust model: you trust the CA, and the CA vouches for
the certificate. RA is the same pattern, starting from silicon instead of a CA database.

---

## What the attestation evidence proves

A successful Ratatouille attestation proves:

1. **The machine has a real TPM**: the AIK is bound to an EK with a valid manufacturer certificate chain
2. **The TPM measured the boot sequence**: PCR values reflect what actually ran at boot
3. **PCR 10 reflects the IMA log**: every IMA entry is accounted for in the running PCR accumulator
4. **The IMA log matches the approved policy**: every executed binary is in the signed allow-list
5. **The policy was signed by an authorized identity**: Sigstore verification + Rekor log entry
6. **The quote is fresh**: nonce-based challenge prevents replay attacks

Together, these proofs mean: **at the time of verification, this machine was running exactly
the software stack its policy approves, and the claim is backed by hardware that cannot be
forged in software.**

---

## What it doesn't prove

Attestation is not a guarantee of application security. An approved, attested binary can still contain vulnerabilities. It is also not immune to pre-enrollment compromise: if the machine was tampered with before baseline enrollment, the tampered state becomes the approved policy. Detection has a latency of up to ~10 seconds: an unauthorized binary that executes will be captured in the IMA log and detected on the next poll cycle, but there is a window between execution and the FAILED status firing. Attacks that compromise the TPM itself (DMA attacks, hardware implants, supply chain compromise of the chip) are out of scope. Finally, Ratatouille attests what ran; preventing a tampered bootloader from running in the first place requires UEFI Secure Boot, which is independent of RA.

---

## How the agent proves itself, every session

The hardware chain establishes that *a* TPM exists and that an Attestation Key (AK) is registered for the device. But how does the verifier know that the connection it's accepting *right now* is from the agent whose AK was enrolled, and not from someone who copied the AK public key off the wire?

Keylime's push model uses **Proof of Possession (PoP)** on every session:

1. The agent opens a session: `POST /v3.0/sessions`
2. The verifier responds with a fresh random challenge nonce
3. The agent asks its TPM to run `TPM2_Certify` with the AK as both the object being certified and the signing key, using the challenge as `qualifyingData`. This produces a signed assertion that proves possession of the AK private key inside the TPM at this moment
4. The agent sends the signed assertion back: `PATCH /v3.0/sessions/{sid}`
5. The verifier checks the signature against the AK public key it has on file from registrar enrollment, and confirms the nonce matches the one it issued
6. The verifier returns a short-lived bearer token (~15 minutes)

Subsequent attestation pushes carry this bearer token in `Authorization: Bearer ...`. When it expires, the agent opens a new session. The AK private key never leaves the TPM, so an attacker with root on the agent host cannot impersonate the agent from elsewhere — they would have to physically remove the TPM.

This replaces an older Keylime model that authenticated agents via mTLS client certificates. Those certs lived on the agent's filesystem and, if exfiltrated, granted admin-level access to the verifier. PoP eliminates both the filesystem secret and the over-broad authorization.

---

## The trust chain root: TPM manufacturer

The chain starts at the TPM manufacturer (Infineon, STMicroelectronics, Nuvoton, etc.).
They issue an **Endorsement Key (EK) certificate** for every TPM they produce.
This certificate chains to a manufacturer CA, which chains to a root CA published by the manufacturer.

The Keylime registrar verifies the EK certificate chain during enrollment.
This is the first link: it proves the agent is talking to a real TPM, not a software emulator
pretending to be one.

For cloud VMs with virtual TPMs (vTPMs), the trust root shifts to the cloud provider's
vTPM CA, meaning you're trusting Google, AWS, or Azure's attestation of the virtualized TPM.
This is a weaker guarantee than physical TPM hardware, but it's still hardware-rooted trust
rather than pure software assertion.

---

## Sigstore and the policy chain

The other trust root is the policy signer. Runtime policies are signed using Sigstore keyless signing:

- The signer authenticates via OIDC (Google Workspace, GitHub Actions, Azure AD, etc.)
- Sigstore issues a short-lived certificate binding the signature to the authenticated identity
- The certificate and signature are logged to **Rekor**, a public, append-only transparency ledger

The Rekor log is checkpointed and monitored by independent parties. A valid Rekor inclusion
proof means the signing event is permanently recorded and cannot be retroactively removed.

This means there are no long-lived signing keys that can be stolen. Every policy approval is attributable to a specific authenticated identity, and the approval is public and auditable, which is useful as compliance evidence.

---

## Ratatouille's trust philosophy

Ratatouille makes no claim to eliminate trust dependencies. That's impossible.
It makes the trust explicit, verifiable, and hardware-anchored rather than implicit
and based on human attestation.

**Before Ratatouille:** "We believe this machine is running approved software because someone filled out a form."

**With Ratatouille:** "We can verify this machine is running approved software because its TPM (manufactured by Infineon) measured its boot chain, its IMA log as recorded by PCR 10 matches the policy signed by this specific authorized identity, and the quote was produced 8 seconds ago with nonce `3Rgkfv2F`. All of this is verifiable independently, without trusting Ratatouille."

That's the goal: **make the relying party's trust decision as independent of human attestation as possible.**
