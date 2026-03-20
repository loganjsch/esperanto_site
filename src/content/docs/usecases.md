---
title: Use Cases
description: How Ratatouille provides platform integrity for government compliance, IoT device fleets, cloud workloads, and more.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

Ratatouille is designed for teams that need **verifiable proof of what's running** —
not just a policy document, but a cryptographic chain from hardware to runtime.
The specific compliance framework or scale doesn't matter. If you need to prove integrity, Ratatouille covers it.

---

## Government & Regulated Access (CJIS, FedRAMP, DoD)

**The scenario:** A police department needs to connect to the FBI CJIS database.
Current process: fill out a form attesting that the connecting machine is running approved software.
The FBI trusts that form. A human signed it.

**The problem:** That's not a verifiable claim. If the machine was compromised between the audit
and the connection, no one knows. The relying party (FBI system) has no way to verify independently.

**What Ratatouille provides:** A cryptographic attestation chain rooted in the machine's TPM hardware, with continuous verification that the machine is running the approved policy, not just at enrollment but right now. The relying party receives an attestation token it can verify independently, without trusting a human intermediary. Policy records are signed via Sigstore and backed by the Rekor transparency log, producing auditor-ready evidence.

**Relevant frameworks:** CJIS, FedRAMP (IL2–IL5), NIST 800-53 (SI-7, SC-28), DoD IL2–IL5, SOC 2 Type II

---

## IoT & Device Fleets

**The scenario:** Your product ships with an embedded TPM. You manage a fleet: maybe thousands of
devices in the field, maybe millions of endpoints. Firmware updates happen regularly. You need to
know that every device is running what you shipped, not a tampered or outdated version.

**The problem:** Traditional fleet management tells you what you pushed. It doesn't tell you what's
actually *running*. A supply chain compromise, a tampered update, or a persistent implant shows up
in the IMA log, but only if you're measuring it.

**What Ratatouille provides:** Fleet-scale attestation. Enroll devices once, and Ratatouille tracks state continuously across all of them. Policy updates happen via GitOps: sign a new runtime policy, push to Git, and it fans out to every enrolled device automatically. Any new unmeasured binary triggers an attestation failure within seconds. The same workflow and API scales from 10 devices to millions.

**Relevant use cases:** OTA update integrity, firmware tamper detection, supply chain verification,
IEC 62443 (industrial IoT), embedded product security

---

## Cloud & Unowned Infrastructure

**The scenario:** You're running workloads on AWS, GCP, Azure, or a hybrid mix. You don't own the
hardware. You can't physically inspect the host. The hypervisor is the cloud provider's.

**The problem:** Traditional integrity checking assumes you trust the platform it's running on.
If the hypervisor is compromised, any agent running in the guest VM is already owned.
TPM-based attestation provides a measurement layer that the guest can verify, independent of the host OS.

**What Ratatouille provides:** vTPM attestation for cloud VMs using the same Keylime workflow and IMA measurement chain as physical hardware. A single policy engine enforces consistent baselines across AWS, GCP, Azure, and on-prem. One signed policy applies everywhere, eliminating per-cloud fragmentation. If your golden AMI drifts from its approved state, you know within 10 seconds.

**Relevant frameworks:** PCI DSS, HIPAA, GDPR/CCPA (data-in-use protection), SOC 2

---

## Secrets & Credential Provisioning

**The scenario:** At startup, a workload needs secrets: database credentials, API keys, TLS private keys,
model weights. You want to ensure those secrets only land on machines that are in a verified state.

**The problem:** If a secrets vault releases credentials based on identity alone (mTLS cert, IAM role),
a compromised OS or container runtime can exfiltrate them via memory scraping or privileged injection.
RA gates the release on platform state, not just identity.

**What Ratatouille provides:** An attestation token issued only after full chain verification, from hardware through IMA log through policy through Sigstore. A relying party (vault, API gateway, HSM) consumes the token as a precondition for secret release. If platform state changes after issuance, the token can be invalidated, providing continuous revocation tied to live machine state.

---

## Confidential Compute Providers

**The scenario:** You operate a multi-tenant platform and your customers need assurance that their
workloads are running on uncompromised infrastructure, not just "in the cloud," but verifiably
isolated and running exactly the approved code.

**What Ratatouille provides:** Customer-verifiable attestation evidence. Tenants don't have to take the operator's word for it. Ratatouille supports TEE platforms (SGX, SEV-SNP, TrustZone) where remote attestation is the mechanism that enables trust, and abstracts across Intel, AMD, and ARM hardware with a single consistent policy model and no vendor lock-in.

---

## What Ratatouille is not

Ratatouille is not a silver bullet. It won't stop phishing, patch management failures, or application-layer vulnerabilities. It specifically addresses *deep platform compromise*: firmware, kernel, and runtime binary tampering that sits below your application security stack.

It is also not a replacement for existing controls. Ratatouille adds a hardware-rooted integrity layer on top of network security, IAM, and endpoint monitoring, not instead of them.

Finally, it is not periodic. The verifier runs every ~10 seconds, giving you a continuous signal rather than an annual attestation checkbox.
