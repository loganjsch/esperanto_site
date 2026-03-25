---
title: Linux IMA
description: How Ratatouille uses the Linux Integrity Measurement Architecture to detect runtime tampering.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

**IMA** (Integrity Measurement Architecture) is a Linux kernel subsystem that measures files as they are accessed — recording a cryptographic hash of every executable, kernel module, and shared library that loads. These measurements are extended into TPM PCR[10], making them tamper-evident: the OS cannot alter what IMA recorded without breaking the PCR value that Keylime verifies.

---

## What IMA records

IMA maintains a runtime measurement log at `/sys/kernel/security/ima/ascii_runtime_measurements`. Each entry contains:

- The PCR index the measurement was extended into (always 10 for IMA)
- The SHA-256 hash of the file contents at the time it was loaded
- The file path

Every time an ELF binary executes, a kernel module loads, or a shared library maps into a process, IMA extends its hash into PCR[10] and appends to the log. Because PCR extension is a one-way operation, the final PCR[10] value is a cryptographic commitment to the entire history of what ran on the machine since boot.

---

## Why the OS cannot lie about it

A compromised OS could theoretically modify the IMA log file in `/sys/kernel/security/ima/`. But it cannot modify PCR[10] in the TPM — PCRs can only be extended, not overwritten, and the TPM is a separate hardware component. Keylime verifies that the IMA log hash-extends correctly into the PCR[10] value in the TPM quote. If the log has been tampered with, the hashes won't match the PCR, and attestation fails.

---

## IMA policy

IMA's measurement scope is controlled by a policy loaded at boot. By default many distributions only measure kernel modules (`MODULE_CHECK`). Ratatouille's install script loads a broader policy that adds:

```
measure func=BPRM_CHECK mask=MAY_EXEC pcr=10
measure func=MMAP_CHECK  mask=MAY_EXEC pcr=10
measure func=MODULE_CHECK pcr=10
measure func=FIRMWARE_CHECK pcr=10
```

This ensures user-space executables, shared libraries, and firmware are measured — not just kernel modules.

For `BPRM_CHECK` (user-space executables) to be active, the kernel must be booted with `ima_policy=tcb` in `GRUB_CMDLINE_LINUX`. Without it, IMA only measures kernel modules.

---

## How Ratatouille uses IMA

At enrollment, Ratatouille captures the IMA log from a known-good machine (the baseline) and generates a runtime policy: the set of file hashes that are allowed to appear in the IMA log. This policy is signed with Cosign and pushed to Git.

On every attestation cycle (~10 seconds), Keylime:
1. Requests a fresh TPM quote covering PCR[10]
2. Requests the new IMA log entries since the last cycle
3. Verifies each new entry's hash appears in the active policy
4. Verifies the log correctly extends into the quoted PCR[10]

Any binary that runs and wasn't in the baseline policy fails attestation immediately.

---

## Further reading

[Keylime](/reference/keylime) — the engine that verifies IMA logs against your policy.
[Sigstore / Cosign](/reference/sigstore) — how IMA-derived policies are signed and deployed.
[RATS Framework](/reference/rats) — the attestation architecture IMA measurements feed into.
