---
title: Maintaining Security
description: A reference page in my new Starlight docs site.
---

The content shared on this site is early stage - the demo doesn't even use HTTPS (omg). This site specifies the proof of concept and usage and not something that remotely resembles production ready.

### Navigating the Trust Chain

The reality of modern security is that trust is never absolute; it’s always inherited through a chain of custody. Just as the web depends on the integrity of Certificate Authorities (CAs), Remote Attestation (RA) depends on the integrity of upstream providers — most critically the hardware manufacturer, and often the cloud platform hosting the workload.

Unlike CAs, which form a single global trust fabric, RA chains are vendor- and platform-specific. A flaw in Intel’s chain, for example, does not invalidate AMD or ARM attestations. But in all cases, trust still flows from a root of trust controlled by someone else.

While this may break the altruistic pursuit of complete personal 'security', it's the real-world foundation of what we consider digital security. By acknowledging this, we can focus on what truly matters: **operationalizing trust** to provide a deeper, more verifiable level of security for your platform.

### A New Layer of Verifiable Trust

While your trust is anchored in vendor-provided mechanisms for attesting your environment, that doesn’t mean exposing your data or workloads to them. Trusted Execution Environments (TEEs) allow you to keep sensitive data confidential while still proving system integrity, and technologies like TPM- or edge-based attestation add further protection against malicious third parties targeting your platform. This product is designed to make it easier for you to implement RA wherever your security model deems it appropriate.
