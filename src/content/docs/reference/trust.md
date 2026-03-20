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

Together, these five proofs mean: **at the time of verification, this machine was running exactly
the software stack its policy approves, and the claim is backed by hardware that cannot be
forged in software.**

---

## What it doesn't prove

Attestation is not a guarantee of application security. An approved, attested binary can still contain vulnerabilities. It is also not immune to pre-enrollment compromise: if the machine was tampered with before baseline enrollment, the tampered state becomes the approved policy. Attestation is a point-in-time check (every ~10 seconds), so a brief execution that terminates before the next poll cycle could go undetected if the timing is tight enough. Attacks that compromise the TPM itself (DMA attacks, hardware implants, supply chain compromise of the chip) are out of scope. Finally, Ratatouille attests what ran; preventing a tampered bootloader from running in the first place requires UEFI Secure Boot, which is independent of RA.

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
