---
title: Overview
description: A quick overview of remote attestation.
---

## Why Remote Attestation Matters

Organizations spend heavily on firewalls, identity systems, and endpoint monitoring. But one critical question often goes unasked: **can you trust the platform itself?**

If the firmware, OS kernel, or hypervisor is compromised, no amount of network or application security can fully protect you. **Remote Attestation (RA)** addresses this gap by using a **hardware root of trust** to measure and verify a device’s state before granting trust.

---

## Hardware Root of Trust, in Practice

At the core of RA is a special, tamper-resistant hardware component (such as a TPM, HSM, or CPU security extension). This hardware is responsible for:

- **Measuring**: recording cryptographic hashes of firmware, OS, and critical components during boot and runtime.
- **Anchoring trust**: ensuring these measurements cannot be forged or altered.
- **Reporting**: producing signed “attestation reports” that can be verified remotely.

This process gives an external system high-confidence evidence of **what is running** on the device — not just what it claims to be running.

---

## Where It Matters

### Firmware / BIOS

- Traditional defenses can’t detect if firmware or bootloaders have been swapped or patched.
- RA verifies the firmware hash against known-good values before sensitive operations.

### Hypervisor / Trusted Execution Environments

- Even isolated workloads can be exposed if the hypervisor or host is compromised.
- RA ensures secrets and workloads only run inside **measured, trusted enclaves.**

### Secrets and Key Management

- Secrets must never be provisioned into a compromised system.
- RA enforces **“release only to attested states”**, protecting cryptographic material end-to-end.

### Supply Chain & Insider Threats

- Malware slipped in during build, deployment, or by insiders can be detected.
- RA validates platform state continuously, not just once at install time.

---

## Let’s Be Clear

- **Not a silver bullet**: RA won’t stop phishing or patch management issues, but it protects against **deep platform compromise** that other tools miss.
- **Snapshot of State**: RA is not a blanket guarantee of trust forever. It provides a point-in-time cryptographic snapshot of a platform’s state. In other words, it answers: “At the moment I asked, is this platform in the expected, uncompromised state?”
- **Trust enforcement is the key**: measurements are only useful if tied to **policy decisions** (e.g., no keys unless the device is verified).
- **Complements existing controls**: RA adds a **new layer** of defense, not a replacement for network, endpoint, or identity protections.

**Esperanto lowers the barrier**: Instead of custom integrations for each TEE, vendor, and platform, Esperanto provides a unified way to verify and enforce trust.

---
