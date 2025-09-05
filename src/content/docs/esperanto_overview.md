---
title: Esperanto Overview
description: A reference page in my new Starlight docs site.
---

**Esperanto** is a fast, secure, and highly scalable service for unified integration of Remote Attestation (RA) across your workflows.

Remote Attestation can serve as a crucial line of defense for critical applications and sensitive operations.  
To learn more about Remote Attestation itself, see [What is Remote Attestation?](/ra_overview).

---

## Why Esperanto?

Unfortunately, Remote Attestation is:

- Cryptographically complex
- Operationally hard to manage at scale
- Inconsistent across platforms and vendors

**Esperanto solves this problem.**  
With Esperanto, you simply:

1. **Enroll** a platform in its trusted state.
2. **Attest** the cryptographic state of that platform **just-in-time (JIT)** before any sensitive or secure operation.

Esperanto does not reinvent the wheel — it builds on the **RATS framework (Remote ATtestation Procedures)** published by IETF.  
👉 [Read more about the RATS framework](link-to-ref-3).

---

## When to Use Esperanto

### 1. Organizations Already Using RA at Scale

If you already use Confidential Computing or Trusted Execution Environments (TEEs), you know that RA is unavoidable.  
Technologies like **AWS Nitro Enclaves, Google Confidential Cloud, Azure Confidential Computing, OP-TEE, SGX, or TPM/Keylime** all require attestation.

Challenges without Esperanto:

- Each platform handles attestation differently.
- Vendor lock-in makes interoperability painful.
- Scaling policies and enforcement is a management nightmare.

**Esperanto benefit:**  
Esperanto unifies policies, orchestration, and attestation evaluation across heterogeneous environments — reducing overhead and minimizing misconfiguration risk.

---

### 2. New Workloads Requiring Low-Level Trust

Some environments demand proof of trustworthiness before running sensitive operations:

- Edge devices deployed in untrusted physical environments
- High-value compute workloads (AI/ML inference, cryptographic services, licensing enforcement)
- Forward-deployed or resource-constrained systems
- Platforms implementing a true zero trust model.

**Esperanto benefit:**  
Esperanto makes it easy to integrate RA without requiring deep cryptographic expertise. It provides a **usable, scalable trust layer** that works across diverse hardware and cloud environments.

---

## Key Takeaways

- **Unified Attestation**: Esperanto standardizes RA across enclaves, TPMs, and diverse TEEs.
- **Scalable Trust**: Operates seamlessly from the cloud to the edge.
- **Built on Standards**: Fully aligned with the RATS framework.
- **Practical Security**: Turns complex attestation into a manageable, enforceable part of your workflow.
