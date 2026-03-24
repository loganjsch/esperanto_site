---
title: What is Ratatouille?
description: Ratatouille is a continuous TPM-backed attestation system — hardware to runtime, cryptographically verifiable.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

## The short version

**Ratatouille** (Remote ATTestation made practical) is a continuous TPM-backed attestation system.
It lets you prove, cryptographically and in real time, that every machine in your fleet is running
exactly the software you approved, and has not been tampered with since enrollment.

The name is a play on **R**emote **AT**t**e**station. The rat mascot is intentional.

---

## What problem does it solve?

Traditional compliance relies on periodic scanning and policy documents.
You run a configuration scanner, review the results, and repeat on a quarterly or annual schedule.
None of that tells you what's *actually running* on your machines right now — only what was true when the scanner ran.

Ratatouille replaces periodic, software-level scanning with a **continuous, hardware-rooted cryptographic chain**:

```
TPM hardware → measured software state → signed policy approval → real-time continuous verification
```

If a machine deviates from its approved state — a new binary executes, a module loads that
wasn't in the baseline — the verifier catches it within seconds.
Not at the next scan. Not at the next audit.

---

## What it actually does

Ratatouille enrolls each machine's TPM with the open source [Keylime](https://keylime.dev) tool, which performs a hardware credential ceremony to verify the manufacturer-issued Endorsement Key and establish a device-unique Attestation Key for signing quotes. It then:

- Captures boot integrity through PCR snapshots taken at startup
- Records runtime integrity via the IMA log, a kernel-level record of every binary and module loaded since boot, cryptographically anchored to PCR 10
- Stores runtime policies in Git, signed with Sigstore cosign, so every policy approval is versioned, attributable, and auditable
- Polls every enrolled agent every ~10 seconds and produces a TRUSTED or FAILED status that relying parties can act on for access control, alerting, or token issuance
- Backs every attestation event with signed, verifiable records and Rekor transparency log entries

Instead of assembling TPMs, IMA logs, Sigstore signing, policy pipelines, and Keylime yourself, Ratatouille operationalizes the entire model end-to-end.

---

## Who is it for?

Ratatouille is designed for teams across very different contexts who share one need:
**verifiable proof of what's running on their machines**.

- **Government / law enforcement** — CJIS, FedRAMP, DoD IL requirements demand cryptographic
  proof that the connecting machine is approved. Ratatouille replaces human attestation with
  a verifiable chain the relying party can check independently.

- **IoT product companies** — Your devices ship with TPMs. Ratatouille turns that hardware
  into a fleet-scale integrity signal. Policy changes via Git push, fan out to every device automatically.

- **Cloud and enterprise teams** — You don't own the hardware at cloud providers. Ratatouille gives you
  cryptographic proof of the measured state of your VMs, with the same workflow for hybrid, multi-cloud, and on-prem.

---

## The full trust chain

Every attestation token Ratatouille issues is backed by this chain, and every link is verifiable:

```
TPM Manufacturer
  └── EK (Endorsement Key — burned into hardware at manufacture)
        └── AIK (Attestation Identity Key — registered with Ratatouille)
              └── TPM Quote (signed PCR snapshot, fresh each poll cycle)
                    └── PCR 10 (extends on every IMA measurement since boot)
                          └── IMA Log (every ELF binary, kernel module loaded since boot)
                                └── Runtime Policy (your approved baseline, versioned in Git)
                                      └── Sigstore Signature (authorized identity signed it)
                                            └── Rekor Transparency Log (public, immutable, auditable)
                                                  └── Attestation Token (issued only after all above pass)
                                                        └── Relying Party (FBI system, API gateway, etc.)
```

---

## Built on open standards

Ratatouille does not introduce a proprietary trust model. It operationalizes proven open-source components:

- **[Keylime](https://keylime.dev)** — TPM-based remote attestation and IMA log verification
- **[Sigstore / Cosign](https://sigstore.dev)** — Keyless code signing and policy verification
- **[IMA (Linux Integrity Measurement Architecture)](https://sourceforge.net/p/linux-ima/wiki/Home/)** — Kernel-level measurement of every executed binary
- **[IETF RATS](https://datatracker.ietf.org/wg/rats/about/)** — The standards framework defining Attester, Verifier, and Relying Party roles

You own the policies, the evidence, and the cryptographic chain. No lock-in.

---

## Next steps

The [Remote Attestation Primer](/ra_overview) covers the underlying concepts (TPMs, IMA, and the RATS framework) for readers who want to understand the mechanics. The [Use Cases](/usecases) page walks through how different teams apply Ratatouille for CJIS compliance, IoT fleets, and cloud workloads. To get a machine enrolled, start with the [Quickstart Guide](/guides/quickstart). To see the full flow live, including a triggered attestation failure, go to the [Live Demo](/demo).
