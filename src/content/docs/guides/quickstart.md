---
title: Quickstart Guide
description: Enroll your first machine, generate a baseline policy, and see live attestation in under 15 minutes.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

This guide walks you through enrolling a machine, generating a baseline runtime policy,
connecting a GitHub repo for policy GitOps, and triggering a live attestation failure.

**Prerequisites:**
- A Linux machine with a TPM 2.0 (physical or vTPM)
- The Ratatouille CLI installed:
  - **Debian/Ubuntu:** `curl -1sLf 'https://dl.cloudsmith.io/public/ratatouille/ratatouille/setup.deb.sh' | sudo bash && sudo apt install rat`
  - **RHEL/Fedora:** `curl -1sLf 'https://dl.cloudsmith.io/public/ratatouille/ratatouille/setup.rpm.sh' | sudo bash && sudo dnf install rat`
  - **pip:** `pip install ratatouille`
- A GitHub account and repo for your runtime policy

---

:::note
The CLI can be run from any machine — enrolled or not. However, the machine you intend to attest
must have the Ratatouille CLI and agent installed on it. This guide assumes you are operating
directly from the machine you want to enroll as the baseline. Parts of this flow (GitHub connection
and Sigstore signing) require a browser, so if you are on a headless machine you may want to run
those steps from a separate machine.
:::

## Step 1: Create a Policy Group

Create a new **Policy Group** and enroll the current machine as the baseline in one step:

```bash
rat init [fleet-name] --bootstrap
```

Give the group a name that identifies your fleet or environment. The `--bootstrap` flag tells
Ratatouille to treat the current machine as the baseline and automatically enroll it after
the group is created.

If you are operating from a separate operator machine and want to enroll a remote device
as the baseline instead, omit `--bootstrap` and run the generated enroll command on the
target device via SSH or Ansible:

```bash
rat enroll <token> --server https://demo.ratatouille.dev
```

---

## Step 2: Enroll the Baseline Machine

When `rat init --bootstrap` runs (or when you run `rat enroll` manually), the CLI:

1. Validates the enrollment token against Ratatouille Core
2. Installs the Keylime Rust agent
3. Configures the agent with a unique UUID and server addresses
4. Starts the agent, which performs the TPM 2.0 **activate-credential** ceremony with the Keylime registrar
5. Captures the full IMA measurement log from the running machine
6. POSTs the baseline to Ratatouille Core, which generates your runtime policy draft

:::note
The runtime policy is built from what the TPM **actually measured** (the IMA log), not re-hashed from disk.
This avoids TOCTOU races and captures everything that ran since boot.
:::

---

## Step 3: Connect Your GitHub Repo

After enrollment, the CLI will prompt you to connect a GitHub repository to your Policy Group.

1. Enter your repository URL when prompted
2. Install the Ratatouille GitHub App on that repository
3. Ratatouille will automatically link the repo to your group

Your repo should have this structure:

```
runtime/
  runtime_policy.json       ← the policy file
  artifact.sigstore.json    ← Sigstore bundle (signature + certificate)
```

---

## Step 4: Sign and Push a Policy

The CLI saves the generated policy draft to a file. Review it before signing — see the
[policy reference](/reference/policies) for details on what the fields control and how
to tune the policy for your environment.

Sign the policy with `rat sign`:

```bash
rat sign runtime/runtime_policy.json
```

This opens a browser for Sigstore keyless signing and writes the bundle to
`runtime/artifact.sigstore.json` alongside the policy file.

Then commit and push:

```bash
git add runtime/
git commit -m "policy: initial baseline"
git push
```

When the push lands on `main`, Ratatouille's GitHub webhook:
1. Verifies the HMAC-SHA256 webhook signature
2. Fetches the policy and Sigstore bundle from the commit SHA via the GitHub API
3. Verifies the Sigstore bundle against the Rekor transparency log
4. Stores the verified policy in the database
5. Fans out `keylime_tenant -c update` to all enrolled agents in the group

:::caution
Ratatouille only accepts policies signed by authorized identities. If Sigstore verification
fails or the signer does not match your configured policy, the push is rejected and no policy update occurs.
:::

---

## Step 5: Watch Live Attestation

```bash
rat status
```

This should show **ACTIVE** for your fleet (currently just this machine).

Every ~10 seconds the agent constructs a fresh TPM quote signed by its Attestation Key (AK)
and pushes it — along with the new IMA log entries since the last cycle — to the Keylime
verifier. The agent never opens an inbound port; all attestation traffic is outbound from
the agent. The verifier checks the quote signature, the PCR values, and every IMA log entry
against your runtime policy, then stores the verdict.

:::note
`rat status` is updated by a 30-second background poll on the Ratatouille Core. A freshly
enrolled agent may briefly show `PROVISIONING` before the first poll cycle reflects the
verified attestation — give it ~30 seconds.
:::

---

## What to do next

:::caution
The Ratatouille core you are connected to is a shared demo system. Do not use it for production
deployments. Run `rat upgrade` when you are ready for a dedicated instance.
:::

### Trigger an Attestation Failure (optional demo)

The simplest way to demonstrate the system catching unauthorized execution — no compiler needed:

```bash
cp /bin/ls /tmp/evil_ls
/tmp/evil_ls
```

Within ~10 seconds, the Ratatouille verifier detects the new IMA entry (`/tmp/evil_ls`),
finds it absent from the runtime policy, and flips the agent status to **FAILED**.

---

### Enroll more devices

```bash
rat enroll <token>
```

---

### Generate cryptographic evidence

```bash
rat evidence <hostname>
```

---

### Get a dedicated Ratatouille deployment

```bash
rat upgrade
```
