---
title: Quickstart Guide
description: Enroll your first machine, generate a baseline policy, and see live attestation in under 15 minutes.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

This guide walks you through enrolling a machine, generating a baseline runtime policy,
connecting a GitHub repo for policy GitOps, and triggering a live attestation failure.

**Prerequisites:**
- A Linux machine with a TPM 2.0 (physical or vTPM)
- Access to a running Ratatouille Core instance (contact [loganjsch@gmail.com](mailto:loganjsch@gmail.com) for access)
- A GitHub account and repo for your runtime policy

---

## Step 1: Create a Policy Group

In the Ratatouille UI, create a new **Policy Group**. Give it a name that identifies your fleet or environment.

When you create the group, a **baseline enrollment token** is generated automatically.
Copy it — you'll need it in Step 2.

Tokens look like: `esp_b_xxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Enroll the Machine

SSH into the target machine and run the install script:

```bash
curl -fsSL https://your-core-instance/install.sh | sudo bash -s -- \
  --token "esp_b_xxxxxxxxxxxxxxxxxxxx" \
  --registrar "10.128.0.4" \
  --core-url "http://10.128.0.4:8001" \
  --baseline
```

The install script will:
1. Install the Keylime Rust agent via apt
2. Configure the agent with a unique UUID and registrar address via systemd environment
3. Start the agent — it performs the TPM2 **activate-credential** ceremony with the Ratatouille registrar
4. Capture the full IMA measurement log from the running machine
5. POST the baseline to Ratatouille Core, which generates and stores your runtime policy

:::note
The runtime policy is built from what the TPM **actually measured** (the IMA log), not re-hashed from disk.
This avoids TOCTOU races and captures everything that ran since boot.
:::

---

## Step 3: Connect Your GitHub Repo

1. In the Ratatouille UI, click **Connect GitHub** on your Policy Group
2. Install the Ratatouille GitHub App on your policy repository
3. Ratatouille will automatically detect the repo and link it to your group

Your repo should have this structure:

```
runtime/
  runtime_policy.json       ← the policy file
  artifact.sigstore.json    ← Sigstore bundle (signature + certificate)
```

---

## Step 4: Sign and Push a Policy

Generate a runtime policy (from an IMA log baseline) and sign it with cosign:

```bash
# Sign the policy file
cosign sign-blob runtime/runtime_policy.json \
  --bundle runtime/artifact.sigstore.json \
  --identity-token $(gcloud auth print-identity-token)

# Commit and push
git add runtime/
git commit -m "policy: update runtime_policy_v2"
git push
```

When the push lands on `main`, Ratatouille's GitHub webhook:
1. Verifies the HMAC-SHA256 webhook signature
2. Fetches the policy and Sigstore bundle from the commit SHA via GitHub API
3. Verifies the Sigstore bundle against the Rekor transparency log
4. Stores the verified policy in the database
5. Fans out `keylime_tenant -c add/update` to all enrolled agents in the group

:::caution
Ratatouille only accepts policies signed by authorized identities. If the Sigstore verification
fails or the signer doesn't match your configured policy, the push is rejected and no policy update occurs.
:::

---

## Step 5: Watch Live Attestation

In the Ratatouille UI, your agent should show **TRUSTED** status with a green indicator.

The Keylime verifier polls the agent every ~10 seconds. Each cycle it requests a fresh TPM quote signed by the AIK, checks PCR values against expected state, and verifies every IMA log entry against your runtime policy.

---

## Step 6: Trigger an Attestation Failure (optional demo)

Shell scripts don't trigger IMA measurements — you need a compiled ELF binary.
This is the cleanest way to demonstrate the system catching unauthorized execution:

```bash
# On the attested machine:
cat > /tmp/evil.c << 'EOF'
#include <stdio.h>
int main() { printf("unauthorized binary\n"); return 0; }
EOF

gcc /tmp/evil.c -o /tmp/evil_binary
/tmp/evil_binary
```

Within ~10 seconds, the Ratatouille verifier detects the new IMA entry (`/tmp/evil_binary`),
finds it absent from the runtime policy, and flips the agent status to **FAILED**.

:::tip
Alternatively: `cp /bin/ls /tmp/evil_ls && /tmp/evil_ls` — same effect without needing gcc.
:::

---

## Next steps

The [Use Cases](/usecases) page covers how different teams apply Ratatouille across government, IoT, and cloud environments. The [Runtime Policies reference](/reference/policies) documents policy structure and the full update workflow. The [RATS Framework overview](/reference/rats) explains the standards underpinning the system.
