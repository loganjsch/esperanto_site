---
title: CJIS Compliance with Ratatouille
description: How state and local law enforcement agencies use Ratatouille to satisfy CJIS Security Policy SI-7 platform integrity requirements.
---

Every agency that touches FBI Criminal Justice Information — from a state message switch down to a two-person sheriff's office — must comply with the **CJIS Security Policy (CJISSECPOL)**. Version 6.0, released December 2024, made platform and firmware integrity a Priority 1 sanctionable control. This document explains exactly what is required, what evidence satisfies an audit, and how Ratatouille produces that evidence continuously and automatically.

---

## Background: The CJIS Compliance Chain

The FBI CJIS Division sets the policy. Enforcement flows downward through a layered hierarchy:

**FBI CJIS Division** owns the policy and audits state agencies through its CJIS Audit Unit (CAU). Audits are triennial — every three years — with six months' advance notice. The FBI can also conduct unannounced inspections and retains authority to suspend or revoke CJI access for non-compliant agencies.

**CJIS Systems Agencies (CSAs)** are the state-level hubs — typically the State Police or Bureau of Investigation. Each CSA has a designated CJIS Systems Officer (CSO) who manages CJIS compliance across the entire state. The CSA audits local agencies within its jurisdiction on behalf of the FBI.

**Local Criminal Justice Agencies (CJAs)** — sheriff's offices, police departments, prosecutors — designate two key roles: a Terminal Agency Coordinator (TAC) who manages CJI access, and a Local Agency Security Officer (LASO) who oversees hardware, software, and firmware in the CJI environment. The LASO is the person most likely interacting with Ratatouille day-to-day.

**Contractors and vendors** who access CJI must sign the CJIS Security Addendum, a legally binding agreement. Under CJISSECPOL v6.0, vendors must also be subject to formal Supply Chain Risk Management assessment.

Delegation does not transfer accountability. An agency that outsources its IT remains fully accountable for any compliance failure by the contractor.

---

## The Relevant Control: SI-7

**Policy Area 5.15 — System and Information Integrity** was added to CJISSECPOL in v5.9.2 (December 2022). The central control is SI-7: Software, Firmware, and Information Integrity.

SI-7 became a Priority 1 (P1) sanctionable control as of **October 1, 2024**, meaning non-compliance can now result in formal findings, corrective action requirements, and ultimately loss of CJI access. The compliance deadline for firmware integrity and hardware supply chain security under v6.0 is **October 1, 2027**.

The core SI-7 requirement:

> Employ integrity verification tools to detect unauthorized changes to software, firmware, and information. Take defined actions when unauthorized changes are detected.

The sub-controls directly relevant to platform integrity:

| Control | Requirement |
|---|---|
| SI-7(1) | Integrity checks at startup, transitional states, or defined frequencies |
| SI-7(6) | Cryptographic mechanisms to detect unauthorized changes |
| SI-7(7) | Integration of integrity violations with incident response |
| SI-7(8) | Audit records and alerting for potential violations |
| SI-7(9) | Verify integrity of the boot process of defined system components |
| SI-7(10) | Protection mechanisms for boot firmware |

CJISSECPOL inherits its technical definitions from NIST 800-53 Rev. 5, which explicitly names UEFI and BIOS as firmware interfaces within scope:

> "Firmware interfaces include Unified Extensible Firmware Interface (UEFI) and Basic Input/Output System (BIOS)."

Related standards that fill in the implementation detail: **NIST SP 800-193** (Platform Firmware Resiliency) specifies a Root of Trust as the standard mechanism for firmware attestation. **NIST SP 800-155** (BIOS Integrity Measurement) specifies that BIOS measurements must be taken by a Root of Trust, stored in TPM PCRs, and reported via cryptographic attestation to a verifier.

---

## What Qualifies as Evidence

CJISSECPOL does not specify a particular technology. It specifies what the evidence must demonstrate. Under NIST 800-53A (the assessment procedures companion), auditors may use three methods: examine artifacts, interview personnel, and test controls. All three are used for SI-7.

Evidence that satisfies SI-7 must demonstrate:

1. That integrity checking occurs at defined intervals or at startup (SI-7(1))
2. That cryptographic mechanisms are used — not just checksums or manual review (SI-7(6))
3. That unauthorized changes trigger documented alerts and incident response (SI-7(7), SI-7(8))
4. That boot integrity is verified for in-scope systems (SI-7(9))
5. That the integrity measurement cannot be retroactively altered by software (the entire point of a hardware root of trust)

NIST SP 800-193 states explicitly:

> "On traditional servers, assurance to NIST SP 800-193 is provable through attestation from a root of trust (RoT), using the Trusted Computing Group (TCG) Trusted Platform Module (TPM) chip and attestation formats."

TPM-based attestation — a signed quote over PCR values that extend with every IMA measurement since boot — is not merely acceptable evidence. It is the strongest form of evidence the framework contemplates, because it is hardware-enforced and tamper-evident in a way that no software log can match.

---

## Scope: Which Systems Need to Be Enrolled

Not every device on the network needs attestation. The scope is systems that store, process, or transmit Criminal Justice Information, or that provide security controls for those systems.

Typical in-scope systems for a state hub or county agency:

- CAD servers (Computer-Aided Dispatch)
- Law enforcement message switch nodes
- Authentication and logging infrastructure
- Workstations with direct CJI terminal access
- Network security appliances (Palo Alto, Cisco) — firmware integrity specifically
- Any Linux or Windows server in the CJI data path

Small agencies — sheriff's offices with one or two IT staff — typically have a handful of Windows desktops, one or two servers, and off-the-shelf network equipment. All of it is in scope if it touches CJI.

---

## How Ratatouille Satisfies SI-7: Step by Step

### Step 1: Enroll in a Known-Good State

The LASO installs the Ratatouille agent on each in-scope system while it is in a verified clean state — typically immediately after provisioning or following a known-good configuration review. Enrollment is a single command generated by the Ratatouille console.

This is the most important step. The baseline you capture is what all future attestations are measured against. Establish it when you are confident the system is clean.

### Step 2: Baseline Capture

After enrollment, the Ratatouille agent requests a TPM quote. The TPM cryptographically signs the current PCR values — including PCR 7 (Secure Boot state) and PCR 10 (IMA measurement log) — using the device's Attestation Identity Key (AIK), which is derived from the manufacturer-burned Endorsement Key (EK). No software can forge this signature.

Simultaneously, the IMA (Integrity Measurement Architecture) kernel subsystem provides a log of every module and executable that has loaded since boot. Ratatouille uses this log, anchored to the PCR 10 value in the TPM quote, to build the baseline runtime policy: a signed manifest of approved binaries and kernel modules for this device group.

This satisfies SI-7(9) (boot process integrity), SI-7(6) (cryptographic mechanisms), and the first half of SI-7(1) (startup integrity check).

### Step 3: Policy Signing and GitOps Push

The generated runtime policy is signed using Sigstore, which produces a verifiable signature bundle logged to the Rekor public transparency ledger. The LASO (or a CI/CD pipeline) pushes the signed policy to a Git repository.

This creates an immutable, auditable record: who signed this policy, when, and what the exact policy content was. The Rekor log entry cannot be deleted or retroactively altered.

Ratatouille reads from the repository (it never writes to your repo), verifies the signature, and fans the policy out to enrolled devices.

### Step 4: Continuous Verification

On the configured polling schedule — every ~10 seconds by default, adjustable by the LASO — every enrolled device produces a fresh TPM quote. Ratatouille's verifier compares the current IMA log against the approved policy and verifies the TPM signature.

If everything matches: the device receives TRUSTED status and the event is logged with a timestamp, device identity, policy version, and TPM quote.

If anything deviates: the device receives FAILED status, an alert fires, and the exact deviation — which binary, which hash, which PCR value — is recorded in the audit log.

This continuous record satisfies SI-7(1) (defined-frequency integrity checks), SI-7(7) (integration with incident response), and SI-7(8) (audit records for potential violations).

---

## What the Audit Looks Like

### Triennial FBI Audit (for CSAs)

The FBI CAU contacts the CSO roughly six months before the scheduled audit. The on-site visit involves interviews with the CSO and key personnel, a walk through the physical facility, and a documentation review.

For SI-7, the auditor will ask: how do you verify that your systems have not been tampered with? What is your integrity verification mechanism? How frequently does it run? What happens when it detects a change?

The LASO's answer, backed by Ratatouille:

- Every in-scope system runs an IMA-backed TPM attestation on a defined schedule.
- Each attestation is cryptographically signed by the TPM Attestation Identity Key.
- Results are logged with timestamps. The audit trail covers every check since enrollment.
- Any deviation triggers an automated alert and is captured in the incident log.
- The policy itself is signed, version-controlled, and publicly logged in Rekor.

### The Evidence Package

For a formal audit or an incident-triggered documentation request, the LASO can produce:

- The enrollment timestamp and baseline policy version for each device.
- A time-series log of every attestation result (TRUSTED/FAILED) with device identity, timestamp, and policy version checked against.
- The TPM quote records for any specific date range — cryptographically verifiable, tamper-evident.
- The Sigstore signature and Rekor transparency log entry for the active policy version.
- An incident record for any FAILED events, including exactly which binary or module caused the failure.

Auditors may also ask for a live demonstration — Ratatouille's console provides real-time fleet status per policy group, and a single device's current attestation state can be verified on demand.

### Incident Response Documentation

CJISSECPOL requires that when a security control fails, agencies document the incident, its scope, and its remediation. The most painful version of this is when an auditor asks: "You had a compromise. How do you know it was contained to this system? How do you know when it started?"

With continuous attestation logs, the LASO can identify the precise check cycle when a FAILED status first appeared — and confirm that all other enrolled systems were TRUSTED throughout. This is the difference between a bounded, documented incident and an open-ended investigation.

---

## Certification and Procurement Questions

### Does Ratatouille need to be FIPS-certified?

Not as a product. CJISSECPOL requires that cryptographic modules used for encryption of CJI be FIPS 140-2 or 140-3 validated. This requirement applies to the cryptographic library, not the application. Ratatouille's underlying cryptographic operations use FIPS-validated libraries. Ratatouille itself does not store or transmit CJI — it stores attestation results.

### Is there an Approved Products List?

No. The FBI does not maintain an APL for software tools under CJISSECPOL. There is no CJIS product certification process. What is required: the tool must be inventoried under CM-8, risk-assessed under the v6.0 Supply Chain Risk Management provisions, and any vendor must be willing to sign the CJIS Security Addendum.

### Is open-source software allowed?

CJISSECPOL does not prohibit open-source software. It must be inventoried, allowlisted under the agency's application control policy, kept patched (critical vulnerabilities within 15 days under SI-2), and assessed for supply chain risk. Ratatouille's open core model satisfies all of these — the source is auditable, patches are transparent, and the agency can review every dependency.

---

## The Practical Reality for Small Agencies

The compliance professional quoted at the start of this page described the real problem: a sheriff's office staffed by the sheriff, his deputy, and a dispatcher cannot realistically hire a security engineer to manually verify firmware integrity on their infrastructure. And until recently, the question "is your UEFI intact?" had no affordable answer.

Ratatouille is designed for exactly this environment. Enrollment is a single command. The agent runs silently. The verification schedule is set once. When the state CSA auditor asks for integrity evidence, the LASO opens the console and exports the log. When an incident triggers a documentation requirement, the same log answers the question.

The compliance burden shifts from a manual, periodic, checkbox exercise to a continuous, cryptographic, automated one — with evidence that satisfies SI-7(1), SI-7(6), SI-7(7), SI-7(8), SI-7(9), and SI-7(10) simultaneously.
