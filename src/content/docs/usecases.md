---
title: Use Cases
description: How Ratatouille provides Linux runtime integrity for government compliance, cloud workloads, secrets delivery, and IoT device fleets.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

Ratatouille is designed for teams that need **verifiable proof of what's running** on their Linux machines —
not just a policy document or a vendor-attested dashboard, but a cryptographic chain from TPM hardware to runtime
that any third party can independently verify.

---

## Government & Regulated Access (CJIS, FedRAMP, DoD)

**The scenario:** A company selling software to U.S. federal or law enforcement customers needs to prove that the machines accessing those systems are running approved, unmodified software. Current process: fill out a form or produce a vendor-attested compliance report. The relying party trusts the form or the vendor's portal. A human signed it.

**The problem:** That's not a verifiable claim. Three converging FY2027 deadlines are making this unacceptable:
- The **DoD Zero Trust Strategy** requires Target Level compliance by September 30, 2027. The NSA Device Pillar guidance explicitly names TPM Platform Certificates and Reference Integrity Manifests as required capabilities.
- **CJIS Security Policy v6.0** phases in firmware integrity verification (NIST SP 800-53 SI-7) by October 2027.
- **FedRAMP High** baseline requires SI-7(15) — cryptographic code authentication prior to installation — which TPM-based attestation directly satisfies.

**What Ratatouille provides:** A cryptographic attestation chain rooted in the machine's TPM hardware, with continuous verification that the machine is running the approved policy — not just at enrollment but right now. The relying party receives an attestation token it can verify independently, without trusting a human intermediary or a vendor's portal. Policy records are signed via Sigstore and backed by the Rekor transparency log, producing auditor-ready evidence a third party can replay with open-source tools.

**Relevant frameworks:** CJIS, FedRAMP (IL2–IL5), NIST 800-53 (SI-7, SC-28), DoD ZT Device Pillar, DoD IL2–IL5

---

## Secrets & Credential Provisioning

**The scenario:** At startup, a workload needs secrets: database credentials, API keys, TLS private keys, model weights. You want to ensure those secrets only land on machines that are in a verified state.

**The problem:** If a secrets vault releases credentials based on identity alone (mTLS cert, IAM role), a compromised OS or container runtime can exfiltrate them via memory scraping or privileged injection. Identity alone doesn't prove the machine is running what it should.

**What Ratatouille provides:** An attestation token issued only after full chain verification — from hardware through IMA log through policy through Sigstore. A relying party (HashiCorp Vault, API gateway, HSM) consumes the token as a precondition for secret release. If platform state changes after issuance, the token can be invalidated, providing continuous revocation tied to live machine state.

The demo: "Only machines that pass attestation get secrets." Machines that fail attestation are denied credentials at the vault layer — without any application-layer changes.

---

## Cloud & Unowned Infrastructure

**The scenario:** You're running workloads on AWS, GCP, Azure, or a hybrid mix. You don't own the hardware. You can't physically inspect the host.

**The problem:** Traditional integrity checking assumes you trust the platform it's running on. If the hypervisor is compromised, any agent running in the guest VM is already owned. vTPM attestation provides a measurement layer that the guest can verify, independent of the host OS — but AWS NitroTPM, GCP Shielded VM vTPM, and Azure Trusted Launch vTPM differ in how PCR banks are provisioned, how EK certificates are issued, and how Attestation Keys are created.

**What Ratatouille provides:** vTPM attestation for cloud VMs using the same Keylime workflow and IMA measurement chain as physical hardware, normalized across AWS, GCP, and Azure. A single policy engine enforces consistent baselines across clouds. If your golden AMI drifts from its approved state, you know within 10 seconds.

**Relevant frameworks:** PCI DSS, HIPAA, GDPR/CCPA (data-in-use protection), SOC 2

---

## IoT & Device Fleets

**The scenario:** Your product ships with an embedded TPM on Linux. You manage a fleet in the field. Firmware updates happen regularly. You need to know that every device is running what you shipped.

**The problem:** Traditional fleet management tells you what you pushed. It doesn't tell you what's actually *running*. A supply chain compromise, a tampered update, or a persistent implant shows up in the IMA log — but only if you're measuring it. The other operational challenge: IMA runtime policy management. Every device type with different software stacks needs its own policy. Every package update requires policy regeneration. This is the current limiting factor for large heterogeneous fleets.

**What Ratatouille provides:** Fleet-scale attestation for Linux devices with TPM 2.0. Enroll devices once and Ratatouille tracks state continuously. Policy updates happen via GitOps: sign a new runtime policy, push to Git, and it fans out to enrolled devices automatically. Any unmeasured binary triggers an attestation failure within seconds.

**Relevant use cases:** OTA update integrity, firmware tamper detection, supply chain verification, IEC 62443 (industrial IoT), embedded product security

---

## Confidential Compute Providers

**The scenario:** You operate a multi-tenant platform and your customers need assurance that their workloads are running on uncompromised infrastructure — not just "in the cloud," but verifiably isolated and running exactly the approved code.

**What Ratatouille provides:** Customer-verifiable attestation evidence. Tenants don't have to take the operator's word for it — the evidence package is in open formats, verifiable with open tools. Ratatouille supports TEE platforms (SGX, SEV-SNP, TrustZone) where remote attestation is the mechanism that enables trust.

---

## What Ratatouille is not

Ratatouille is not a silver bullet. It won't stop phishing, patch management failures, or application-layer vulnerabilities. It specifically addresses *deep platform compromise*: firmware, kernel, and runtime binary tampering that sits below your application security stack.

It is also not a replacement for existing controls. Ratatouille adds a hardware-rooted integrity layer on top of network security, IAM, and endpoint monitoring — not instead of them.

It is not a compliance dashboard. Vanta tells you your configuration settings are correct. Ratatouille tells you your machines are running what you think they're running. These are different layers.

Finally, it is scoped to **Linux machines with TPM 2.0**. It does not cover macOS, Windows, GPU firmware, NIC firmware, or BMC. It is not a general-purpose heterogeneous fleet attestation platform.
