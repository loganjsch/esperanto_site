---
title: Usecases
description: A guide in my new Starlight docs site.
---

## Example Use Cases for Remote Attestation

### Firmware and OS Integrity Verification

- RA ensures that a platform boots into a known, untampered state.
- Critical for highly sensitive workloads like key management services (STS) or secure enclave execution.
- Without RA, an attacker with physical or supply chain access could modify firmware or the OS and bypass higher-level security controls.

### Secure Over-the-Air (OTA) Updates

- RA allows a device to prove its integrity before receiving signed updates.
- Prevents malicious updates from being installed on compromised devices.
- Combined with signed update enforcement, RA significantly reduces the risk of firmware or software corruption in the field.

### Trusted Edge Inference / Compute

- In edge computing scenarios, RA can verify that a device performing inference runs in a trusted state before sending sensitive data or results to the cloud.
- Protects intellectual property and ensures critical decisions are made on verified platforms.

### IP Protection and Licensing Enforcement

- RA ensures that proprietary software or models only execute on trusted platforms.
- Useful for SaaS or AI providers distributing sensitive workloads without exposing IP to unauthorized environments.

---
