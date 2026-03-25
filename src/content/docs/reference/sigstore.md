---
title: Sigstore / Cosign
description: How Ratatouille uses Sigstore and Cosign for keyless, auditable runtime policy signing.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

**Sigstore** is an open source project that makes cryptographic signing of software artifacts simple and auditable. **Cosign** is Sigstore's signing tool. Ratatouille uses Cosign to sign runtime policies before they are pushed to Git and deployed to devices — creating a verifiable, attributable, and publicly auditable record of every policy approval.

[Sigstore documentation](https://docs.sigstore.dev) — [Cosign GitHub](https://github.com/sigstore/cosign)

---

## The problem Sigstore solves

Traditional code signing requires managing long-lived private keys — securely generating them, storing them, rotating them, and revoking them if compromised. For runtime policy signing, a leaked signing key means an attacker can approve any policy they want.

Sigstore's **keyless signing** flow eliminates long-lived keys entirely. Instead, signing is tied to a short-lived certificate issued against an authenticated identity (GitHub Actions OIDC, Google, GitHub, email) at the moment of signing. The certificate, signature, and artifact hash are all recorded in **Rekor** — Sigstore's public, append-only transparency log — where they can be independently verified by anyone.

---

## How Ratatouille uses it

When you sign a runtime policy with Cosign:

```bash
cosign sign-blob runtime_policy.json \
  --bundle artifact.sigstore.json
```

Cosign produces a bundle (`artifact.sigstore.json`) containing the signature, the short-lived signing certificate, and the Rekor log entry. Ratatouille's GitHub webhook handler:

1. Fetches `artifact.sigstore.json` from the repository
2. Verifies the signature against the policy file
3. Verifies the Rekor transparency log entry (log ID, inclusion proof)
4. Records the signing identity (email, GitHub Actions workflow, etc.) and Rekor log index
5. Distributes the verified policy to the Keylime verifier for each enrolled device

The Rekor log index is stored with the policy record and surfaced in the Evidence tab — so you can independently verify who approved any policy, at what time, without trusting Ratatouille.

---

## What this means for your policy audit trail

Every policy change in Ratatouille is:

- **Attributable** — tied to an authenticated identity, not an anonymous key
- **Timestamped** — Rekor records a signed timestamp from a trusted log
- **Publicly auditable** — anyone can verify the Rekor entry with `rekor-cli get --log-index <id>`
- **Non-repudiable** — once in Rekor, the entry cannot be deleted or modified

---

## Further reading

[Keylime](/reference/keylime) — how signed policies are deployed to devices.
[RATS Framework](/reference/rats) — the attestation architecture policies feed into.
[Rekor](https://search.sigstore.dev) — search the public transparency log.
