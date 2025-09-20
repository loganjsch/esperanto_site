---
title: Esperanto Use Cases
description: How Esperanto helps you operationalize trust across products, platforms, and workloads.
---

Esperanto is designed as a **plug and play attestation engine**, whether you’re a large SaaS provider assuring millions of customers that their workloads run on uncompromised platforms, or a niche team running a compliance-heavy sensitive workflow that demands cryptographic proof of trust at every step.

### Use Cases

#### 1. SaaS & Enterprise Platforms

If you’re delivering a SaaS or enterprise solution — whether in data analytics, AI, or security — Esperanto lets you prove to customers that their data is both **secure against threats** and **private from platform operators**.

Esperanto gives your customers an additional layer of assurance: their workloads aren’t just “running in the cloud,” they’re running in cryptographically attested, trusted environments.

---

#### 2. Simplifying TEEs & Breaking Vendor Lock

TEEs (Trusted Execution Environments) are powerful, but managing them across Intel, AMD, and ARM can be complex and create **vendor lock-in**.

Esperanto abstracts this fragmentation, unifying attestation policies across providers. You get the benefits of TEEs without being tied to one vendor’s ecosystem.

---

#### 3. Edge Devices with Sensitive Workloads

When devices at the edge are part of your sensitive data workflow, you must have assurance that those platforms are uncompromised.

For example:

- Attesting a device before sending it an API key or database connection string from a secrets vault.
- Protecting remote data collection endpoints from tampering.

Esperanto ensures your edge platforms can **cryptographically prove their trustworthiness** before becoming part of your workflow.

---

#### 4. Compliance & Audit Evidence

Esperanto provides portable, cryptographic attestation evidence that can be shown to auditors or regulators in regulated indsutries, making frameworks easier to satisfy.

- **FedRAMP / DoD IL2–IL5:** Workloads must run in **trusted, controlled environments**. RA provides cryptographic proof that VMs, containers, or hardware are uncompromised.
- **PCI DSS / HIPAA:** Sensitive data must be processed in **secure, validated environments**. RA shows that environments handling cardholder or PHI data are isolated and trustworthy.
- **GDPR / CCPA:** Organizations must implement **appropriate technical measures** to protect personal data. RA in TEEs demonstrates **data-in-use confidentiality**, aiding compliance with integrity and privacy obligations.
- **NIST 800-53 / Critical Infrastructure:** Controls like SI-7 and SC-28 require workloads to run in **verifiable, uncompromised states**. RA produces cryptographic evidence to satisfy these controls.

> RA does not replaceautomatically satisfy compliance obligations, but it offers a practical, verifiable mechanism to show that workloads are running in trusted, uncompromised environments. This may simplify your audits for cloud, edge, or hybrid deployments.

---

#### 5. Multi-Cloud & Hybrid Workloads Confidnetial Compute

Workloads often span AWS, Azure, GCP, on-prem, and edge environments. Each has its own attestation system, which creates complexity.  
Esperanto acts as a **single fabric for attestation**, letting you enforce one consistent trust policy across all providers and avoid cloud lock-in.

---

#### 6. Data Collaboration & Clean Rooms

In modern analytics and research, multiple organizations want to compute over sensitive shared data without exposing it.  
Esperanto enables privacy-preserving collaboration by proving that workloads run only in trusted environments.  
Examples:

---

### The Bigger Picture

Esperanto is the connective layer of **platform trust**.

Whether it’s:

- **A SaaS startup** proving customer workloads are private from cloud providers,
- **A financial institution** generating compliance-ready trust evidence,
- **A healthcare system** protecting sensitive patient data,
- **A multi-cloud deployment** enforcing consistent attestation policies,
- **A data collaboration platform** ensuring privacy in shared computations,
- Or **a DevOps team** attesting containers running on AWS Nitro Enclaves,

Esperanto operationalizes remote attestation as a standard, verifiable part of your platform.
