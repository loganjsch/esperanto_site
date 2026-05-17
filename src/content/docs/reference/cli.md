---
title: CLI Reference
description: Complete reference for the rat command-line tool — fleet management, enrollment, and attestation evidence.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

The `rat` CLI is the primary operator interface for Ratatouille. It handles fleet creation, agent enrollment, live status monitoring, and cryptographic evidence export.

**Install:**
```bash
pip install ratatouille
```

**Configuration:** `rat` stores its API endpoint in `~/.rat/config.json`. Set it once with `rat connect`.

---

## rat connect

```
rat connect <url>
```

Configure which Ratatouille Core instance to connect to. Tests the connection before saving.

```bash
rat connect https://your-core-instance
# or interactively:
rat connect
# API endpoint [http://localhost:8001]:
```

The configured URL is used by all subsequent commands. Stored at `~/.rat/config.json`.

---

## rat init

```
rat init [fleet-name] [--bootstrap]
```

Create a new fleet (policy group) and generate a baseline enrollment token.

| Flag | Description |
|---|---|
| `[fleet-name]` | Name for the new policy group. Prompted interactively if omitted. |
| `--bootstrap` | Immediately enroll the **current machine** as the baseline reference device after creating the group. |

**What it does:**
1. Creates the policy group on the Ratatouille Core
2. Generates a one-time baseline enrollment token (`esp_b_...`)
3. If `--bootstrap` is set, runs `rat enroll` locally to capture the baseline from the current machine
4. Otherwise prints enrollment commands you can run on a separate target machine

**Output (without `--bootstrap`) includes enrollment commands for:**

```bash
# rat CLI (run on the target machine)
rat enroll esp_b_<token> --server https://your-core-instance

# Ansible
- name: Enroll agent
  shell: pip install ratatouille && rat enroll esp_b_<token> --server https://your-core-instance

# cloud-init
runcmd:
  - pip install ratatouille && rat enroll esp_b_<token> --server https://your-core-instance
```

The first machine enrolled with a baseline token becomes the reference device — its IMA measurement log is used to generate the runtime policy for the group.

---

## rat enroll

```
rat enroll <token> [--server <url>]
```

Enroll **this machine** into a fleet. Run on the agent device, not the operator machine.

| Argument | Description |
|---|---|
| `<token>` | Enrollment token from `rat init` (`esp_b_...` for baseline, `esp_...` for standard) |
| `--server`, `-s` | Override the API URL for this enrollment (also saves to config) |

**What it does:**
1. Validates the token against the Ratatouille Core
2. Retrieves the Keylime registrar/verifier hostnames and policy group assignment
3. Runs the bundled install script (requires `sudo`)
4. The install script installs the Keylime Rust agent, configures it, and initiates the TPM credential activation ceremony

The agent operates in **push mode**: it makes outbound HTTPS connections to the registrar and verifier, and never opens an inbound port. This means no firewall changes, no NAT punching, and no inbound attack surface on the agent device — well-suited for edge and IoT deployments behind restrictive networks.

---

## rat status

```
rat status [--watch] [--group <group-id>]
```

Show the current attestation status of all enrolled agents.

| Flag | Description |
|---|---|
| `--watch`, `-w` | Refresh every 10 seconds |
| `--group`, `-g` | Filter output to a specific policy group |

**Status values:**

| Status | Meaning |
|---|---|
| `ACTIVE` | Agent is enrolled and attesting. Last quote verified against policy. |
| `PROVISIONING` | Agent enrolled, awaiting first successful attestation cycle. |
| `FAILED` | Attestation failed — IMA log entry not in policy or PCR mismatch. |
| `UNKNOWN` | Verifier cannot reach the agent or no recent quote. |

**Example output:**
```
  ━━ Fleet Status  https://demo.ratatouille.dev

   ●  prod-node-01.fleet.internal   prod-fleet   ACTIVE         12s ago
   ●  prod-node-02.fleet.internal   prod-fleet   ACTIVE         8s ago
   ✗  edge-device-07.iot.internal   edge-fleet   FAILED         26m ago
```

:::note
Status is updated by a ~30-second background poll on Ratatouille Core. A newly enrolled
agent may briefly appear as `PROVISIONING` before its first attestation has been polled.
:::

---

## rat evidence

```
rat evidence <hostname|uuid> [--export <path>]
```

Show the full cryptographic proof chain for a single agent, with the verification command for each link.

| Argument | Description |
|---|---|
| `<hostname\|uuid>` | Agent hostname or UUID |
| `--export`, `-e` | Write a JSON evidence report to the specified file path |

**The proof chain displayed:**

| Step | What it proves | How to verify independently |
|---|---|---|
| 1. TPM Hardware Identity | EK certificate is manufacturer-issued and signed by vendor CA | `openssl verify -CAfile <ek_ca.pem> <ek_cert.pem>` |
| 2. TPM Quote Signature | Fresh-nonce hardware quote signed by the Attestation Key | `tpm2_checkquote --public ak.pub --message quote.msg --signature quote.sig` |
| 3. PCR[7] Secure Boot | Secure Boot was enabled and DB/DBX/PK/KEK set is unchanged | `sudo tpm2_pcrread sha256:7` |
| 4. PCR[10] IMA Runtime | Every binary that executed since boot is in this log, anchored to hardware | `sudo cat /sys/kernel/security/ima/ascii_runtime_measurements` |
| 5. Runtime Policy | Policy is Sigstore-signed by an authorized identity | `cosign verify-blob --bundle artifact.sigstore.json runtime_policy.json` |
| 6. Rekor Transparency Log | Policy signing event is publicly logged, append-only, independently auditable | `rekor-cli get --log-index <id>` |

**JSON export** (`--export report.json`) produces a structured evidence package suitable for auditor submission. It includes all chain metadata and the verification commands for each step.
