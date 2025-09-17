---
title: Overview
description: A quick overview of remote attestation.
---

## Why Remote Attestation Matters

Organizations spend heavily on firewalls, identity systems, and endpoint monitoring. But one critical question often goes unasked: **can you trust the platform itself?**

If the firmware, OS kernel, or hypervisor is compromised, no amount of network or application security can fully protect you. **Remote Attestation (RA)** addresses this gap by using a **hardware root of trust** to measure and verify a device’s state before granting trust.

---

## Hardware Root of Trust, in Practice

At the core of RA is a special, tamper-resistant hardware component such as a TPM or CPU security extension. This hardware is responsible for:

- **Measuring**: recording cryptographic hashes of firmware, OS, and critical components during boot and runtime.
- **Anchoring trust**: ensuring these measurements cannot be forged or altered.
- **Reporting**: producing signed “attestation reports” that can be verified remotely.

This process gives an external system high-confidence evidence of **what is running** on the device — not just what it claims to be running.

---

## Where It Matters

### Firmware & Boot Integrity

If firmware or bootloaders are tampered, the OS and workloads can’t be trusted.  
RA validates the measured boot process against known-good states before workloads start.

### Hypervisors & TEEs

Sensitive workloads need protection even if the broader host is untrusted.  
RA ensures they only run inside **measured and trusted enclaves** (e.g., SGX, Nitro, SEV).

### Secrets & Key Provisioning

Secrets should never be released into a compromised OS or kernel.  
RA enforces **“release only to attested states”**, tying key delivery to verified platform integrity.

### Edge & Distributed Nodes

Remote or IoT nodes are more exposed to tampering and weaker controls.  
RA provides verifiable trust signals before they’re allowed to handle sensitive data.

---

## Let’s Be Clear

- **Not a silver bullet**: RA won’t stop phishing or patch management issues, but it protects against **deep platform compromise** that other tools miss.
- **Snapshot of State**: RA is not a blanket guarantee of trust forever. It provides a point-in-time cryptographic snapshot of a platform’s state. In other words, it answers: “At the moment I asked, is this platform in the expected, uncompromised state?”
- **Trust enforcement is the key**: measurements are only useful if tied to **policy decisions** (e.g., no keys unless the device is verified).
- **Complements existing controls**: RA adds a **new layer** of defense, not a replacement for network, endpoint, or identity protections.

**Esperanto lowers the barrier**: Instead of custom integrations for each TEE, vendor, and platform, Esperanto provides a unified way to verify and enforce trust.

---
