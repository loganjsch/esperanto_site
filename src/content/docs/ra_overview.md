---
title: Remote Attestation Primer
description: What remote attestation is, how TPMs and IMA work, and why hardware-rooted integrity matters.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

Remote Attestation (RA) answers one question: **is this machine running what it's supposed to be running?**

RA uses hardware to produce a **cryptographic proof of the current execution state** of a machine —
signed by a tamper-resistant security processor that cannot lie about what it measured.

---

## The hardware root of trust: TPM

At the center of remote attestation is a **Trusted Platform Module (TPM)**: a dedicated,
tamper-resistant security processor present on most modern server, desktop, laptop, and IoT hardware.

The TPM provides three capabilities that software cannot replicate:

**1. Tamper-resistant storage for boot measurements.** During boot, the firmware, bootloader, and OS loader each call `TPM_PCRExtend` to record measurements into **Platform Configuration Registers (PCRs)**. The TPM stores these in shielded memory. PCRs cannot be reset or replayed without a physical reboot; no software running after boot — not even a compromised OS — can clear or rewrite them.

**2. A hardware-burned root of trust.** The TPM holds an **Endorsement Key (EK)**: an asymmetric key pair burned into the security processor by the manufacturer. The private key never leaves the TPM. The EK certificate chain leads back to the TPM manufacturer's CA. This is the anchor the entire trust chain extends from.

**3. Signed attestation quotes.** The TPM can produce a **TPM Quote**: a snapshot of PCR values signed by an **Attestation Identity Key (AIK)**, which is itself bound to the EK. A remote verifier with the AIK's public key can confirm: (a) the signature is valid, (b) the AIK was issued by a real TPM, (c) the PCR values are what the hardware recorded, not what the OS claims.

---

## Runtime integrity: IMA

PCRs capture boot state. But what about what runs *after* boot?

**Linux IMA (Integrity Measurement Architecture)** is a kernel subsystem that measures files
at execution time. Every time an ELF binary is executed, a kernel module is loaded, or a
file with execute permission is mapped, IMA records a SHA256 hash of the file contents
and appends it to the **IMA measurement log**.

Critically, IMA extends **PCR 10** in the TPM with each new measurement. PCR 10 becomes a
running cryptographic accumulator of everything that has executed since boot — stored in the
same tamper-resistant hardware that the OS cannot modify.

This is what makes the IMA log trustworthy: a verifier can replay every entry in the log and confirm that the resulting hash chain matches the PCR 10 value in the TPM quote. Because the TPM quote is signed by the AIK (a key that never leaves the hardware), and PCR 10 can only change by executing code, any gap, insertion, or modification to the IMA log would produce a mismatch. The log cannot be selectively edited after the fact.

The full verification procedure:
1. Check the TPM quote: PCR 10's value is hardware-signed and fresh
2. Walk the IMA log: replaying each entry must reproduce the PCR 10 value exactly
3. Compare each IMA entry against the **runtime policy** — the approved set of binaries and modules

If any binary appears in the IMA log that isn't in the policy, the verifier knows immediately.
If the IMA log has been tampered with, the PCR 10 mismatch exposes it.
To change PCR 10 retroactively, you would have to reboot the machine — which resets the entire measurement chain and triggers re-enrollment.

---

## Secure Boot and the boot trust anchor

Most modern hardware ships with **UEFI Secure Boot** enabled: an OEM-controlled mechanism that only allows bootloaders and kernels signed by trusted keys (the OEM's keys, the platform manufacturer's keys, or keys explicitly enrolled by the platform owner) to execute during the boot sequence. Secure Boot is the manufacturer's integrity enforcement layer for the boot process.

Its state is measured into **PCR 7** during boot. Ratatouille includes this measurement in every TPM quote, which means attestation evidence includes cryptographic proof that Secure Boot completed in the expected configuration — not just that Secure Boot is enabled in the BIOS settings, but that the measured boot chain passed Secure Boot validation.

This matters because Secure Boot *enforces* at boot time, but it does not *prove* to a remote party that enforcement ran correctly. Ratatouille provides that proof.

---

## The RATS framework (IETF)

The IETF **RATS** (Remote ATtestation procedureS) working group defines the roles and data flows that Ratatouille implements. The **Attester** is the machine whose state is being proved: it runs the Keylime agent and holds the TPM. The **Verifier** checks the evidence (TPM quote + IMA log) against reference values (the runtime policy). The **Relying Party** consumes the attestation result to grant access, issue tokens, or make policy decisions. The **Reference Value Provider** produces the approved reference values; in Ratatouille, this is the policy author via a signed Git push.

The RATS model separates *evidence production* (what the machine reports) from *appraisal*
(whether that evidence meets policy) from *consumption* (what the relying party does with the result).
Ratatouille implements all three layers.

---

## Why software-only integrity checking isn't enough

Software-based file integrity monitors run as userspace processes and read the filesystem via kernel syscalls. If the kernel is compromised — for example, via a rootkit that hooks `sys_read`, `getdents`, or `stat` — the monitor's queries return whatever the kernel tells them. The monitor sees clean files while the rootkit hides modifications at the syscall layer. This is precisely how rootkits are designed to work: subverting the measurement layer by controlling the interface it uses.

Signed container images verify what was pushed to a registry — not what the process is executing right now, nor whether the host kernel that manages the container is trustworthy. If the host is compromised, the container's image signature says nothing about the actual runtime environment.

EDR and endpoint agents operate above the OS, leaving them blind to firmware and kernel-level persistence. Configuration scanners run periodically and produce point-in-time snapshots, not a continuous signal.

Hardware-rooted attestation is the only approach where the integrity measurement is made by a component the OS *cannot* influence: the TPM stores PCR values in shielded hardware, and the IMA log's authenticity is proven by matching that hardware-anchored state.

---

## What RA does not protect against

RA is powerful but scoped. It *detects* when execution state deviates from the approved baseline; it doesn't prevent the compromise from occurring in the first place. Attacks above the measurement boundary — application-layer vulnerabilities, SQL injection, phishing — are outside its scope.

Boot-level attacks are detectable but not always preventable before they run: RA will catch a tampered bootloader the next time attestation runs, but preventing unsigned boot code from executing in the first place is the role of UEFI Secure Boot. Most modern enterprise hardware ships with Secure Boot enabled, but Secure Boot can be disabled with BIOS access, and known vulnerabilities in Secure Boot implementations (BootHole, BATON DROP, and others) have allowed unsigned code to bypass it. RA and Secure Boot are complementary controls: one prevents, the other proves.

Finally, the baseline must itself be trustworthy. If the machine was compromised before enrollment, the tampered state becomes the approved policy.

Used correctly, RA adds a hardware-rooted integrity layer that sits *below* everything else in your security stack and catches what everything else misses.

---

## Ratatouille's implementation

Ratatouille assembles these components into a complete, operational pipeline:

```
Keylime registrar  → EK verification and AIK enrollment (one-time, at provisioning)
Keylime agent      → runs on the attested machine, serves TPM quotes
Keylime verifier   → polls every ~10 seconds, checks TPM quote + IMA log
Sigstore / cosign  → signs runtime policies (approved baseline hash set)
Rekor              → public transparency log for all policy signatures
Ratatouille Core   → orchestrates enrollment, policy GitOps, fan-out, status
```

See [What is Ratatouille?](/esperanto_overview) for the full architecture and trust chain.
