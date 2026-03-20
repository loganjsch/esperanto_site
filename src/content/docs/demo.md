---
title: Live Demo Walkthrough
description: Step-by-step walkthrough of a complete Ratatouille attestation demo — enrollment, live verification, and a triggered attestation failure.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

This walkthrough shows the complete Ratatouille flow from a user's perspective:
enroll a machine, push a signed policy, watch continuous attestation, then trigger a
failure and recover by pushing an updated policy.

No deep Keylime knowledge required. That's the point.

---

## The Setup

The demo uses two machines. The **Core server** (`34.68.204.198`) runs the Ratatouille backend, Keylime verifier, and Keylime registrar. The **Agent machine** (`34.66.179.242`) is the machine being attested and runs the Keylime Rust agent. The Ratatouille UI is at `http://34.68.204.198:5173`.

---

## Phase 1: Enroll a Machine and Generate a Baseline

### 1. Create a Policy Group in the UI

Navigate to the Ratatouille dashboard → **New Group** → give it a name.

A baseline enrollment token is generated: `esp_b_...`

### 2. Run the install script on the agent machine

```bash
sudo ./install.sh \
  --token "esp_b_..." \
  --registrar "10.128.0.4" \
  --core-url "http://10.128.0.4:8001" \
  --baseline
```

The script installs the Keylime Rust agent, configures it via systemd environment variables,
and starts it. The agent performs the TPM2 **activate-credential** ceremony:

1. Agent generates an AIK (Attestation Identity Key) and presents its EK certificate
2. The registrar issues an encrypted challenge that only the TPM can decrypt
3. Agent decrypts it using the TPM, confirming hardware identity

The agent then sends its full IMA measurement log to Ratatouille Core.

### 3. Ratatouille generates the baseline policy

Core calls Keylime's `create_policy.py` against the IMA log, building a runtime policy
from TPM-measured values (not re-hashed from disk). The policy is stored as `Baseline::<group_name>`.

**The agent now appears in the UI with status: `provisioning`.** It has an identity and a baseline,
but no active signed policy has been pushed yet.

---

## Phase 2: Connect GitHub and Push a Signed Policy

### 4. Connect a GitHub repo

Click **Connect GitHub** → install the Ratatouille GitHub App → it links your repo to the Policy Group.

Your repo structure:
```
runtime/
  runtime_policy.json
  artifact.sigstore.json
```

### 5. Sign the policy with cosign

```bash
cosign sign-blob runtime/runtime_policy.json \
  --bundle runtime/artifact.sigstore.json \
  --identity-token $(gcloud auth print-identity-token)
```

Cosign opens a browser to complete OIDC authentication. The bundle written to
`artifact.sigstore.json` contains the signature, certificate chain, and Rekor log entry.

### 6. Push to main

```bash
git add runtime/
git commit -m "policy: baseline v1"
git push
```

Ratatouille's GitHub webhook fires:
- HMAC-SHA256 signature verified on the raw payload body
- Policy and bundle fetched from the commit SHA via GitHub API
- Sigstore bundle verified (invalid signature or untrusted signer → rejected)
- Policy stored in DB, `active_policy_id` updated on the group
- `keylime_tenant -c add` runs for every enrolled agent

**The agent flips to `active` in the UI.**

---

## Phase 3: Watch Continuous Attestation

The Keylime verifier polls the agent every ~10 seconds:

```
INFO  keylime.tpm   Checking IMA measurement list on agent: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
INFO  keylime.tpm   Checking IMA measurement list on agent: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
INFO  keylime.tpm   Checking IMA measurement list on agent: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
```

Each cycle:
1. Verifier requests a fresh TPM quote (nonce-based, replay-resistant)
2. Agent returns signed PCR values + incremental IMA log entries
3. Verifier checks PCR[10] extends with each new IMA entry
4. Every new IMA entry is looked up against the runtime policy hash set
5. All entries match → attestation passes

---

## Phase 4: Trigger an Attestation Failure

:::note[Important]
Shell scripts alone won't trigger this. The interpreter (`bash`) is measured, not the script content.
You need a compiled ELF binary, one that IMA has never seen before.
:::

**On the attested machine:**

```bash
# Option A: compile a new binary
gcc /tmp/evil.c -o /tmp/evil && /tmp/evil

# Option B: copy an existing binary to a new path (new IMA entry, different path)
cp /bin/ls /tmp/evil_ls && /tmp/evil_ls
```

Within ~10 seconds:

```
WARNING keylime.ima    Hashes for file /tmp/evil_ls don't match
                       b94d27b9...  not in policy
ERROR   keylime.ima    IMA ERRORS: Some entries couldn't be validated. ImaNg failures: 1
WARNING keylime.verifier  Agent d432fbb3... failed, stopping polling
```

**The agent flips to `failed` in the UI.**

---

## Phase 5: Recover by Updating the Policy

If the execution was intentional (a legitimate software update), the recovery path is:
approve the new binary via policy GitOps.

```bash
# Get the hash of the new binary from the IMA log
sudo grep /tmp/evil_ls /sys/kernel/security/ima/ascii_runtime_measurements
# → sha256:b94d27b9934d3e08...

# Add it to runtime_policy.json under the "/tmp/evil_ls" key
# Sign the updated policy
cosign sign-blob runtime/runtime_policy.json \
  --bundle runtime/artifact.sigstore.json \
  --identity-token $(...)

git add runtime/ && git commit -m "policy: allow /tmp/evil_ls" && git push
```

Ratatouille detects the push, re-runs the Sigstore verification, and pushes the updated policy
to the verifier. Attestation resumes with the new policy. Agent flips back to `active`.

:::tip[The GitOps security model]
The policy update had to be **signed by an authorized identity** and pass Sigstore verification.
An attacker who compromises the machine cannot update the policy. Only an authorized principal
with access to the signing identity can approve new binaries.
:::

---

## What you just saw

Enrollment established TPM hardware identity via the activate-credential ceremony. Baseline generation measured every binary running at that moment via IMA and captured the result as the approved policy. The policy push verified the Sigstore signature, checked the Rekor log, and fanned the policy out to the agent. During continuous polling, the verifier checked the TPM quote and IMA log every 10 seconds against that policy. When a new ELF binary appeared, attestation failed within one poll cycle. Recovery was a signed Git push, and the updated policy was verified and enforced automatically.

This is the full cryptographic chain, from TPM hardware through to the relying party,
operating in real time.
