---
title: API Reference
description: Ratatouille Core REST API — endpoints for agents, policies, tokens, and attestation evidence.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

The Ratatouille Core exposes a REST API used by the `rat` CLI, the install script, and the web UI. All endpoints return JSON. The default port is `8001`.

---

## Agents

### `GET /agents/`

List all enrolled agents.

**Response:**
```json
[
  {
    "id": "a1b2c3d4-...",
    "hostname": "prod-node-01.fleet.internal",
    "ip_address": "10.128.0.11",
    "status": "active",
    "policy_group_id": "prod-fleet",
    "last_checkin": "2025-11-10T14:32:00Z",
    "registered_at": "2025-11-01T09:00:00Z"
  }
]
```

---

### `GET /agents/{agent_id}/evidence`

Returns a structured evidence package for a single agent: identity, live attestation stats from the Keylime verifier, and active policy metadata.

**Response:**
```json
{
  "agent": {
    "id": "a1b2c3d4-...",
    "hostname": "prod-node-01.fleet.internal",
    "ip_address": "10.128.0.11",
    "status": "active",
    "registered_at": "2025-11-01T09:00:00Z",
    "last_checkin": "2025-11-10T14:32:00Z"
  },
  "attestation": {
    "count": 8640,
    "last_successful": "2025-11-10T14:32:00Z",
    "hash_alg": "sha256",
    "sign_alg": "rsassa",
    "active_pcrs": [7, 10]
  },
  "policy": {
    "name": "Baseline::prod-fleet",
    "version": "3",
    "commit_sha": "4f9a2b1c8d3e5f7a",
    "source_repo": "your-org/fleet-policies",
    "signed_by": "deploy@your-org.com",
    "rekor_log_id": "12345678",
    "created_at": "2025-11-05T08:00:00Z",
    "measurement_count": 312
  }
}
```

This is the same data the `rat evidence` command displays.

---

### `POST /agents/{agent_id}/sync-status`

Query the Keylime verifier for an agent's current attestation state and update the Ratatouille database. Called periodically by the system; also callable manually to force a status refresh.

**Response:**
```json
{
  "agent_id": "a1b2c3d4-...",
  "operational_state": 7,
  "status": "active",
  "attestation_count": 8640,
  "last_received_quote": "2025-11-10T14:32:00Z"
}
```

---

### `POST /agents/enroll`

Called by the install script on the agent device during standard (non-baseline) enrollment. Validates the token, creates the agent record, and returns the verifier address.

**Request:**
```json
{
  "token": "esp_...",
  "hostname": "prod-node-02.fleet.internal",
  "agent_uuid": "a1b2c3d4-..."
}
```

**Response:**
```json
{
  "status": "success",
  "verifier_ip": "10.128.0.4",
  "verifier_port": 8881
}
```

---

### `POST /agents/init-baseline`

Called by the install script on the **baseline device**. Validates a baseline token, creates the agent record, generates a runtime policy from the submitted IMA log, and sets it as the active policy for the group.

**Request:**
```json
{
  "token": "esp_b_...",
  "agent_uuid": "a1b2c3d4-...",
  "hostname": "baseline-host.fleet.internal",
  "ima_log": "<raw IMA ascii measurement log>"
}
```

**Response:**
```json
{
  "status": "baseline_established",
  "policy_id": "p-001"
}
```

---

## Policies

### `GET /policies/`

List all policies across all groups, ordered by creation date descending.

**Response:**
```json
[
  {
    "id": "p-001",
    "name": "Baseline::prod-fleet",
    "version": "3",
    "status": "active",
    "source_repo": "your-org/fleet-policies",
    "commit_sha": "4f9a2b1c8d3e5f7a",
    "signed_by": "deploy@your-org.com",
    "rekor_log_id": "12345678",
    "created_at": "2025-11-05T08:00:00Z"
  }
]
```

---

### `GET /policies/groups/{group_id}/active-policy`

Returns the currently active policy for a policy group, including the full policy content (the IMA allowlist JSON).

Used by the web UI to poll for baseline completion and to display the policy for review.

**Response:** Same schema as `GET /policies/` entries, with `content` field included.

---

## Tokens

### `POST /tokens/generate-baseline`

Generate a one-time baseline enrollment token. Creates the policy group if it does not exist.

**Request:**
```json
{
  "policy_group_id": "prod-fleet",
  "ttl_hours": 24
}
```

**Response:**
```json
{
  "token": "esp_b_...",
  "expires_at": "2025-11-11T14:00:00Z",
  "command": "rat enroll esp_b_... --server https://your-core-instance"
}
```

---

### `POST /tokens/generate`

Generate a standard (non-baseline) enrollment token for adding agents to an existing group.

**Request:**
```json
{
  "policy_group_id": "prod-fleet",
  "ttl_hours": 1
}
```

**Response:** Same schema as `generate-baseline`.

---

### `POST /tokens/resolve`

Validate a token and return the configuration the install script needs. Called by `rat enroll` before running the install script.

**Request:**
```json
{ "token": "esp_b_..." }
```

**Response:**
```json
{
  "registrar_ip": "10.128.0.4",
  "verifier_ip": "10.128.0.4",
  "core_url": "http://10.128.0.4:8001",
  "is_baseline": true,
  "group_id": "prod-fleet"
}
```

---

## Health

### `GET /healthz`

Returns `200 OK` if the Core is reachable. Used by `rat connect` to verify the endpoint before saving.
