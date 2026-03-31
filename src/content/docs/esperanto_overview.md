---
title: What is Ratatouille?
description: Ratatouille makes TPM/IMA attestation for Linux operationally accessible while producing evidence any third party can independently verify — without trusting Ratatouille.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

## Overview

**Ratatouille** (Remote ATTestation made practical) is a continuous TPM-backed attestation system for **Linux machines with TPM 2.0**.

It lets you prove, cryptographically and in real time, that every machine in your Linux fleet is running exactly the software you approved and has not been tampered with since enrollment. The critical distinction here is that the evidence Ratatouille produces is independently verifiable by any third party using open tooling.

You can think of it as a **notarized audit trail for machine state**, except the notary is the TPM hardware itself, so the only people you are trusting are the guys who manufactured your device. (you are already doing this when you *use* that device)

---

## Why?

**Proving platform state is hard.** When an auditor or access-control system asks "how do you know your machines are running what they're supposed to?" the current answer is usually a form, a vendor dashboard, or a periodic scan. None of those are independently verifiable. The relying party has to trust whoever filled out the form or the vendor who ran the scan. Ratatouille replaces that with a cryptographic chain rooted in hardware that any third party can independently replay and verify, without trusting you or any vendor.

**Building it yourself is harder.** The pieces for hardware-rooted attestation exist — TPMs, RATS, Signature verification — but assembling them into an operational system means building TPM registration workflows, IMA policy generation and management, a RATS aligned verifier, a GitOps fan-out pipeline with signature verification, then maintaining all of it across your fleet. Most teams that need this capability don't have months to spend on the infrastructure layer.

Ratatouille operationalizes the full stack so you don't have to build it.

---

## What it actually does

Ratatouille targets **Linux machines with TPM 2.0** like physical servers, cloud VMs with vTPMs (AWS NitroTPM, GCP Shielded VM, Azure Trusted Launch), and Linux-based IoT or edge devices. It is not a general-purpose attestation platform for macOS, Windows, or heterogeneous hardware, yet :).

It enrolls each machine's TPM with the open-source [Keylime](https://keylime.dev) engine (CNCF Sandbox project, shipped in RHEL 9), which performs a hardware credential ceremony to verify the manufacturer-issued Endorsement Key and establish a device-unique Attestation Key for signing quotes. It then:

- Captures boot integrity through PCR snapshots taken during startup
- Records runtime integrity via the IMA log, a kernel-level record of every binary and module loaded since boot, cryptographically anchored to PCR 10
- Stores runtime policies in Git, signed with Sigstore cosign, so every policy approval is versioned, attributable, and auditable
- Polls every enrolled agent every ~10 seconds and produces a TRUSTED or FAILED status that relying parties can act on for access control, alerting, or token issuance
- Backs every attestation event with signed, verifiable records and Rekor transparency log entries that any third party can independently verify with `tpm2-tools`, `cosign verify`, and `rekor-cli`

Instead of assembling TPMs, IMA logs, Sigstore signing, policy pipelines, and Keylime yourself. Keylime alone has four components, mTLS certificate management, and 42 configuration options. Ratatouille operationalizes the entire model end-to-end.

---

## The full trust chain

Every attestation token Ratatouille issues is backed by this chain, and every link is verifiable with open-source tools — independent of any Ratatouille infrastructure:

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
                                                        └── Relying Party (FBI system, API gateway, secrets vault)
```

---

## Built on open standards

Ratatouille does not introduce a proprietary trust model. It operationalizes proven open-source components:

- **[Keylime](https://keylime.dev)** — TPM-based remote attestation and IMA log verification. CNCF Sandbox project, shipped in RHEL 9 and SLE Micro. Ratatouille is the operational layer; Keylime is the engine.
- **[Sigstore / Cosign](https://sigstore.dev)** — Keyless code signing and policy verification. Every policy approval is attributable to a specific authenticated identity and permanently auditable.
- **[IMA (Linux Integrity Measurement Architecture)](https://sourceforge.net/p/linux-ima/wiki/Home/)** — Kernel-level measurement of every executed binary. The OS cannot alter what IMA recorded.
- **[IETF RATS (RFC 9334)](https://datatracker.ietf.org/wg/rats/about/)** — The standards framework defining Attester, Verifier, and Relying Party roles. Ratatouille is aligned with the RATS background-check model, scoped to Linux with TPM 2.0.

You own the policies, the evidence, and the cryptographic chain. No lock-in. If Ratatouille disappears tomorrow, your evidence and policies remain valid and verifiable.

---

## What Ratatouille is not

**Not a general-purpose attestation platform.** Ratatouille covers Linux machines with TPM 2.0. It does not cover macOS, Windows, GPU firmware, NIC firmware, or BMC. If you need heterogeneous hardware attestation, that's a different product.

**Not "platform integrity" in the broad sense.** The term implies coverage of the full hardware stack — GPUs, NICs, BMC, UEFI beyond what IMA measures. Ratatouille provides Linux userspace and kernel runtime integrity via IMA plus measured boot. Call it what it is: Linux runtime integrity.

**Not a compliance dashboard.** Vanta tells you your policies are set correctly. Ratatouille tells you your machines are running what you think they're running. These are different layers — and increasingly, regulations require both.

**Not infinite-scale out of the box.** Every machine type with different software stacks needs its own IMA runtime policy. Every package update across every machine type requires policy regeneration. Policy lifecycle management is the current operational challenge.

---

## Next steps

The [Remote Attestation Primer](/ra_overview) covers the underlying concepts (TPMs, IMA, and the RATS framework) for readers who want to understand the mechanics. The [Use Cases](/usecases) page walks through how different teams apply Ratatouille for CJIS compliance, IoT fleets, and cloud workloads. To get a machine enrolled, start with the [Quickstart Guide](/guides/quickstart). To see the full flow live, including a triggered attestation failure, go to the [Live Demo](/demo).
