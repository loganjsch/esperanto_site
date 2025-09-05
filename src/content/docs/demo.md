---
title: Demo Guide
description: A guide in my new Starlight docs site.
---

# Esperanto Remote Attestation Demo

This demo is designed to give context as to how to integrate remote attestation into your workflows using Esperanto.

- **Goal A:** Remote attestation actually verifies the integrity of a remote platform.
- **Goal B:** The Esperanto platform makes enrollment, attestation checks, and secure payload delivery simple and unified.
- **Goal C:** Multi-platform integration (e.g., **Nitro → Keylime**) illustrates real-world **composability**. TBH this part aint done. LOL~!

---

## Demo Script

```python
#!/usr/bin/env python3
"""
Esperanto Demo Script
----------------------
Shows how remote attestation works via the Core service.

Flow:
1. Platform is already enrolled separately via `python3 agent.py enroll`.
2. Demo script -> Core /authorize API to check trust.
   (Core internally waits for agent attestation callback.)
3. If trusted, deliver a payload.
4. If untrusted, deny delivery.
"""

import requests
import uuid
import sys

CORE_URL = "http://127.0.0.1:3000"

def run_demo():
    auth_request = {
        "auth_request_id": str(uuid.uuid4()),
        "principal": "demo-user",
        "action": "read",
        "resource": "nitro-test",
        "target_host": "http://ec2-18-117-139-208.us-east-2.compute.amazonaws.com:5000",
        "metadata": None,
        "evidence_mode": "Direct"
    }

    print("[*] Sending /authorize request to Core...")
    try:
        resp = requests.post(f"{CORE_URL}/authorize", json=auth_request, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[!] Error during /authorize request: {e}")
        sys.exit(1)

    body = resp.json()
    print("[+] Authorize response received:")
    print(body)

    # Interpret verdict if present
    verdict = body.get("verdict")
    if verdict == "Trusted":
        print("[✓] Platform attested successfully. Payload may be provisioned.")
        deliver_secrets()
    else:
        print("[X] Platform attestation failed or untrusted. Payload withheld.")

def deliver_secrets():
    print("Yay secrets going for a trip!")

if __name__ == "__main__":
    print("=== Esperanto Remote Attestation Demo ===")
    print("Please Ensure the agent is running and the platform is enrolled.")
    print("=========================================")
    run_demo()
```

## Walkthrough

This walkthrough shows Esperanto in action — from enrolling a platform, attesting its state, simulating tampering, and re-attesting to see the change.

---

### Step 1: Enroll

**Command:**

```bash
# Example command
python3 esperanto_agent.py enroll aws_enclave
```

**Screenshot**

**Description:**
Enrollment registers the enclave or platform with Esperanto Core in its expected trusted state. This “known-good” baseline is used for all future attestations. It creates a policy for you to manage:

```yaml
yaml policy
```

Measurements are not stored in the human readable policy, and are instead stored in a single local to act oas source of truth, and expected measurements such as pcr's are resolved from policies at teh time of evaluation.

### Step 2: Attest

```python
# Example command
python code for attestation
```

**Screenshot**

**Description:**
The attestation process cryptographically measures the platform against its enrolled baseline. A successful result confirms the enclave is uncompromised and eligible for sensitive operations (e.g., key provisioning, authorization).

At this point its up to your business logic to decide what to do - do_secret_stuff()

### Step 3: Tamper with Enclave

**Screenshot:**

**Description:**
Here we simulate a compromise by modifying the enclave state (e.g., changing a binary!!, altering the environment). This breaks the integrity guarantee captured during enrollment.

### Step 4: Attest Again

**Screenshot:**

**Description:**
When attestation is run again, Esperanto detects the mismatch against the trusted baseline. The enclave is flagged as untrusted, and sensitive operations (like secret release or authorization) are denied
