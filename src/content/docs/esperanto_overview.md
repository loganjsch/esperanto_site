---
title: Ratatouille Overview
description: A reference page in my new Starlight docs site.
---

## What is Ratatouille

The Ratatouille Specification defines a secure implementation of the RATS framework by standardizing how systems produce measurements, sign policies, verify evidence, and perform continuous trust evaluation. It prescribes how to compose proven open-source components—IMA for runtime measurements, Sigstore/Cosign for policy signing, and Keylime for verification—together with best-practice processes such as policy-as-code and CI/CD integration.

Ratatouille (the service) provides production-grade implementation of this specification. It lets you define, distribute, and continuously enforce trusted execution policies across your infrastructure without having to integrate or manage the underlying attestation components or logic yourself.

---

## What Ratatouille does

Ratatouille makes it practical to deploy RATS-based trust across your infrastructure.
It gathers hardware-rooted evidence from each machine—secure boot measurements, firmware state, kernel integrity, runtime file measurements—and continuously proves whether the system is running what you intended.
It provides:

- Verified secure boot state
- Verified firmware + platform integrity
- Verified OS/kernel integrity
- Verified runtime file and process integrity (IMA)
- A continuous, actionable trust signal you can use for policy decisions

Instead of stitching together TPMs, IMA logs, Sigstore signing, policy pipelines, and a verifier like Keylime, Ratatouille operationalizes the entire model end-to-end.

---

## Why Ratatouille?

Remote Attestation (RA) enables you to verify the integrity of your systems and enforce trust across cloud, edge, and on-premise deployments — protecting your applications and data by proving that your deivce booted in a secure sate, and that the OS/kernel and software execution have been uncompromised since then.
To learn more about Remote Attestation itself, see [What is Remote Attestation?](/ra_overview).

Proprietary implementations exist for each stack, and open source frameworks such as Keylime offer a solution to interact with low level trust elements. However, turning these offerings into a unified, CI/CD integrated, operational pipeline can be a daunting task. Keylime stops short at policy management/creation, SPIFFE/SPIRE doesn't ingest these hardware rooted trust signals for.

## How Ratatouille?

Link here to System Design.
