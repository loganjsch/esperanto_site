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

The first step is to download the CLI
link here --

You can run the cli on a seperate operator machine, or the machine you plan to enroll as a baseline, but in either case, you will need to install 

## Step 1: Create a Policy Group

On your operator machine (again, this may be the machine you plan to create the baseline off of or plan to test) create a new **Policy Group** wit `rat init --groupname`. Give it a name that identifies your fleet or environment.

When you create the group, a command including the **baseline enrollment token** is generated automatically.
Copy it; you'll need it in Step 2.

Command look like: `rat enroll esp_b_xxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Enroll the Machine

Either via SSH, ansible, or manunally, run the enroll command 

```bash
curl -fsSL https://your-core-instance/install.sh | sudo bash -s -- \
  --token "esp_b_xxxxxxxxxxxxxxxxxxxx" \
  --registrar "10.128.0.4" \
  --core-url "http://10.128.0.4:8001" \
  --baseline
```

`rat init --endpoint`
Note: Since this is the trial mode, you will not have an associated ratatouille core endpoint associated with your deployment yet.

This will:
1. Install the Keylime Rust agent via apt
2. Configure the agent with a unique UUID and registrar address
3. Start the agent, which performs the TPM2 **activate-credential** ceremony with the Keylime registrar
4. Capture the full IMA measurement log from the running machine
5. POST the baseline to Ratatouille Core, which generates and stores returns your runtime policy

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

Take a pause here. Policy creation is important, and misconfiguring it can mean anything fromletting all executions occur or none.
We recommend you read 'policies.md' for a more full understanding of what thesse policeis determine and how they work, but in short...

You should configure your policy based on the context of the machine you are enrolling. For exmaple, if this is an attestation check for a fleet of IoT devices you are going to deploy to the field, you can build a more strict IMA policy becuase you know the bounds of what shoudl execute on device. 

A long running server subject to constant updates and new taks is probably a better target to link Measured Boot and keep the Runtime IMA checks to a minimum, as predicting all runtime executionsn is near impossible. This way, you can still prove to a relying party that secure boot occured, the modules loaded during it are what you expect, and this modules have't changed since then.

While not always possible, the golden pipelien would be to run `rat init` in a CI/CD controlled system, where your code changes get deployed to the device, and the craetion of a new policy is the final sttep in the CI/CD pipeline. 

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

Shell scripts don't trigger IMA measurements. You need a compiled ELF binary.
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
Alternatively: `cp /bin/ls /tmp/evil_ls && /tmp/evil_ls` (same effect without needing gcc).
:::

---

## Next steps

The [Use Cases](/usecases) page covers how different teams apply Ratatouille across government, IoT, and cloud environments. The [Runtime Policies reference](/reference/policies) documents policy structure and the full update workflow. The [RATS Framework overview](/reference/rats) explains the standards underpinning the system.
