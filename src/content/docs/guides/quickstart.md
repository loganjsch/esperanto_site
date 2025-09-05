---
title: Quickstart Guide
description: A guide in my new Starlight docs site.
---

This page gives an example of how the Esperanto platform will be used to run demos on existing enclaves or platforms.

⚠️ **Note:** At this stage, these are future-facing examples. Demo code and binaries are not yet being delivered for external use.

---

## Esperanto Components

- **Core Service**: Cloud-hosted (with potential on-prem deployment) service that evaluates attestation and authorizes actions.
- **Agents**: Installed on devices or enclaves that need to prove their trustworthiness.
  - Inside TEEs: open-source, vetted binaries or source code.
  - Parent platforms: Esperanto Agent handles communication with the Core.

---

## Steps to Integrate

### 1. Download the Agent

Integrate the **Esperanto Agent** with your enclave or platform.

- Vetted open-source code/binaries will be available for download.
- Use the enclave-specific version for TEEs, and the platform agent for parent OS interaction.

**Download link (coming soon):** `downloads/`

---

### 2. Access the Core

You’ll need credentials and endpoint information for the Esperanto Core.

**Core access (coming soon):** `link/`  
This will include:

- API endpoints
- Authentication setup
- Billing / access control (planned for future versions)

---

### 3. Enroll Your Platform

Run the agent to enroll your enclave or platform with the Core:

```bash
python3 esperanto_agent.py enroll aws_enclave
```

### 4. Attest your platform

(Possible SDK coming soon)

Within your code, use the API to get trustiworthniness of platforms :

Reference the demo script on how to do this.

```python

```
