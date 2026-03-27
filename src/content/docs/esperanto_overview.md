---
title: What is Ratatouille?
description: Ratatouille makes TPM/IMA attestation for Linux operationally accessible while producing evidence any third party can independently verify — without trusting Ratatouille.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

## The short version

**Ratatouille** (Remote ATTestation made practical) is a continuous TPM-backed attestation system for **Linux machines with TPM 2.0**.

It lets you prove, cryptographically and in real time, that every machine in your Linux fleet is running exactly the software you approved, and has not been tampered with since enrollment. The critical distinction: the evidence Ratatouille produces is independently verifiable by any third party using open tooling — not just by trusting Ratatouille's dashboard.

Think of it as a **notarized audit trail for machine state**. Except the notary is the TPM hardware itself, so no vendor needs to be trusted — including us.

---

## What problem does it solve?

Traditional compliance relies on periodic scanning and policy documents — or on vendor-attested dashboards that tell you your configuration settings are correct. Neither tells you what's *actually running* on your machines right now, and both require you to trust the vendor's report.

Ratatouille solves two related problems simultaneously:

**The integrity problem:** A compromised kernel, bootloader, or binary executing below your security stack is invisible to firewalls, IAM, and EDR. None of those controls start until after the kernel loads.

**The trust problem:** Every compliance SaaS (Vanta, Drata, Secureframe) produces vendor-attested reports stored in the vendor's cloud, presented through the vendor's portal, and verified only by trusting that the vendor accurately collected the data. If the vendor is compromised, wrong, or simply gone, the evidence is worthless.

Ratatouille replaces periodic, software-level scanning with a **continuous, hardware-rooted cryptographic chain** that any auditor can independently replay and verify:

```
TPM hardware → measured software state → signed policy approval → real-time continuous verification
```

If a machine deviates from its approved state — a new binary executes, a module loads that wasn't in the baseline — the verifier catches it within seconds. Not at the next scan. Not at the next audit.

---

## What it actually does

Ratatouille targets **Linux machines with TPM 2.0** — physical servers, cloud VMs with vTPMs (AWS NitroTPM, GCP Shielded VM, Azure Trusted Launch), and Linux-based IoT or edge devices. It is not a general-purpose attestation platform for macOS, Windows, or heterogeneous hardware.

It enrolls each machine's TPM with the open-source [Keylime](https://keylime.dev) engine (CNCF Sandbox project, shipped in RHEL 9), which performs a hardware credential ceremony to verify the manufacturer-issued Endorsement Key and establish a device-unique Attestation Key for signing quotes. It then:

- Captures boot integrity through PCR snapshots taken at startup
- Records runtime integrity via the IMA log, a kernel-level record of every binary and module loaded since boot, cryptographically anchored to PCR 10
- Stores runtime policies in Git, signed with Sigstore cosign, so every policy approval is versioned, attributable, and auditable
- Polls every enrolled agent every ~10 seconds and produces a TRUSTED or FAILED status that relying parties can act on for access control, alerting, or token issuance
- Backs every attestation event with signed, verifiable records and Rekor transparency log entries that any third party can independently verify with `tpm2-tools`, `cosign verify`, and `rekor-cli`

Instead of assembling TPMs, IMA logs, Sigstore signing, policy pipelines, and Keylime yourself — Keylime alone has four components, mTLS certificate management, and 42 configuration options — Ratatouille operationalizes the entire model end-to-end.

Ratatouille is to Keylime what Terraform Cloud is to Terraform.

---

## Who is it for?

The primary audience for Phase 1 is **platform engineering teams at companies that sell to U.S. government or defense customers** — Series B+ or mid-market companies (200–2,000 employees) where someone already knows they need attestation because a customer or auditor asked for it, but looked at raw Keylime and decided the operational burden was too high.

**Why now:** Three converging FY2027 compliance deadlines create urgency:
- **DoD Zero Trust Strategy** requires Target Level compliance by September 30, 2027. The NSA Device Pillar guidance explicitly names TPM Platform Certificates and Reference Integrity Manifests.
- **CJIS Security Policy v6.0** phases in firmware integrity verification (NIST SP 800-53 SI-7) by October 2027.
- **FedRAMP High** baseline requires SI-7(15) — cryptographic code authentication prior to installation — which TPM-based attestation directly satisfies.

**Other audiences:**

- **Government / law enforcement** — CJIS, FedRAMP, DoD IL requirements demand cryptographic proof that the connecting machine is running approved software. Ratatouille replaces human attestation with a verifiable chain the relying party can check independently.

- **Cloud and enterprise teams** — You don't own the hardware at cloud providers. Ratatouille gives you cryptographic proof of the measured state of your VMs, with the same workflow for hybrid, multi-cloud, and on-prem.

- **IoT and edge device companies** — Your devices ship with TPMs. Ratatouille turns that hardware into a fleet-scale integrity signal. Policy changes via Git push, fan out to enrolled devices automatically.

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
