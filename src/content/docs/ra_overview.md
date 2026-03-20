---
title: Remote Attestation Primer
description: What remote attestation is, how TPMs and IMA work, and why hardware-rooted integrity matters.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

Remote Attestation (RA) answers one question: **is this machine running what it's supposed to be running?**

Not "does it have the right certificate?" Certificates prove identity, not state.
Not "did it pass an audit last year?" Audits are snapshots, not signals.

RA uses hardware to produce a **cryptographic proof of the current execution state** of a machine —
signed by a tamper-resistant chip that cannot lie about what it measured.

---

## The hardware root of trust: TPM

At the center of remote attestation is a **Trusted Platform Module (TPM)**: a dedicated,
tamper-resistant chip present on most modern server, desktop, laptop, and IoT hardware.

The TPM does three things that software cannot replicate:

**1. Measures.** During boot, the firmware, bootloader, and OS loader each extend a set of
**Platform Configuration Registers (PCRs)** in the TPM. Each extension is `SHA256(current_PCR || new_measurement)`.
PCRs cannot be reset or replayed without a physical reboot; a compromised OS cannot clear them.

**2. Anchors.** The TPM holds an **Endorsement Key (EK)**: an asymmetric key pair burned into
the chip by the manufacturer. The private key never leaves the TPM. The EK certificate chain leads
back to the TPM manufacturer's CA. This is the hardware root of trust.

**3. Reports.** The TPM can produce a **TPM Quote**: a snapshot of PCR values, signed by an
**Attestation Identity Key (AIK)**, which is itself bound to the EK. A remote verifier with the
AIK's public key can confirm: (a) the signature is valid, (b) the AIK was issued by a real TPM,
(c) the PCR values are what the TPM measured, not what the OS claims.

---

## Runtime integrity: IMA

PCRs capture boot state. But what about what runs *after* boot?

**Linux IMA (Integrity Measurement Architecture)** is a kernel subsystem that measures files
at execution time. Every time an ELF binary is executed, a kernel module is loaded, or a
file with execute permission is mapped, IMA records a SHA256 hash of the file contents
and appends it to the **IMA measurement log**.

Critically, IMA extends **PCR 10** in the TPM with each new measurement. This means the TPM's
PCR 10 value is a running cryptographic accumulator of everything that has executed since boot.

The verifier can:
1. Check the TPM quote: PCR 10's value is signed and fresh
2. Walk the IMA log: each entry must hash-extend to match PCR 10
3. Compare each IMA entry against an approved **runtime policy** (the set of allowed binaries)

If any new binary appears in the IMA log that isn't in the policy, the verifier knows immediately.
The TPM makes it impossible to fake PCR 10 retroactively. To change it, you'd have to reboot the machine.

---

## The RATS framework (IETF)

The IETF **RATS** (Remote ATtestation procedureS) working group defines the roles and data flows that Ratatouille implements. The **Attester** is the machine whose state is being proved: it runs the Keylime agent and holds the TPM. The **Verifier** checks the evidence (TPM quote + IMA log) against reference values (the runtime policy). The **Relying Party** consumes the attestation result to grant access, issue tokens, or make policy decisions. The **Reference Value Provider** produces the approved reference values; in Ratatouille, this is the policy author via a signed Git push.

The RATS model separates *evidence production* (what the machine reports) from *appraisal*
(whether that evidence meets policy) from *consumption* (what the relying party does with the result).
Ratatouille implements all three layers.

---

## Why software-only integrity checking isn't enough

File integrity monitors like Tripwire and AIDE run in userspace, so if the kernel is compromised, the monitor is too. Signed containers and images prove what was *deployed*, not what's *running* right now. EDR and endpoint agents operate above the OS, leaving them blind to firmware and kernel-level persistence. TPM Secure Boot measures the boot chain only and does not cover runtime execution after the OS hands off.

Hardware-rooted attestation is the only approach where the integrity measurement is made by a component the OS *cannot* influence: the TPM.

---

## What RA does not protect against

RA is powerful but scoped. It *detects* when execution state deviates from the approved baseline; it doesn't prevent the compromise from occurring in the first place. Attacks above the measurement boundary (application-layer vulnerabilities, SQL injection, phishing) are outside its scope. Boot-level attacks are detectable but not always preventable: RA will catch a tampered bootloader, but preventing it from running requires UEFI Secure Boot and firmware protections independent of RA. Finally, the baseline must itself be trustworthy. If the machine was compromised before enrollment, the tampered state becomes the approved policy.

Used correctly, RA adds a hardware-rooted integrity layer that sits *below* everything else in your security stack and catches what everything else misses.

---

## Ratatouille's implementation

Ratatouille assembles these components into a complete, operational pipeline:

```
Keylime registrar  → EK/AIK enrollment (one-time, at provisioning)
Keylime agent      → runs on the attested machine, serves TPM quotes
Keylime verifier   → polls every ~10 seconds, checks TPM quote + IMA log
Sigstore / cosign  → signs runtime policies (approved baseline hash set)
Rekor              → public transparency log for all policy signatures
Ratatouille Core   → orchestrates enrollment, policy GitOps, fan-out, status
```

See [What is Ratatouille?](/esperanto_overview) for the full architecture and trust chain.
