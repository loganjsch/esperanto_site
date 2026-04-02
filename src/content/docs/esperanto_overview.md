---
title: What is Ratatouille?
description: Ratatouille makes TPM/IMA attestation for Linux operationally accessible while producing evidence any third party can independently verify — without trusting Ratatouille.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

Ratatouille (Remote ATtestation made practical) is a continuous TPM-backed attestation system for **Linux machines with TPM 2.0**.

It lets you prove, cryptographically and in real time, that every machine in your Linux fleet is running exactly the software you approved and has not been tampered with since enrollment. The critical distinction here is that the evidence Ratatouille produces is independently verifiable by any third party using open tooling.

You can think of it as a notarized audit trail for machine state, except the notary is the TPM hardware itself, so the only people you are trusting are the guys who manufactured your device. (you are already doing this when you *use* that device)

---

## Why?

When an access-control system or an auditor asks "how do you know your machines are running what they're supposed to?" the current answer is usually a form, a vendor dashboard, or a periodic scan. None of those are independently verifiable. The relying party has to trust whoever filled out the form or the vendor who ran the scan. Ratatouille replaces that with a cryptographic chain rooted in hardware that any third party can independently replay and verify, without trusting you or any vendor.

Building it yourself is harder. The pieces for hardware-rooted attestation exist — TPMs, RATS, Signature verification — but assembling them into an operational system means building TPM registration workflows, IMA policy generation and management, a RATS aligned verifier, a GitOps fan-out pipeline with signature verification, then maintaining all of it across your fleet. Most teams that need this capability don't have months to spend on the infrastructure layer.

Ratatouille operationalizes the full stack so you don't have to build it.

---

## What it actually does

Ratatouille targets **Linux machines with TPM 2.0**: physical servers, cloud VMs with vTPMs (AWS NitroTPM, GCP Shielded VM, Azure Trusted Launch), and Linux IoT/edge devices.

<svg id="rtl-diagram" viewBox="0 0 1300 500" xmlns="http://www.w3.org/2000/svg" style="width:100%;margin:2rem 0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <style>
    #rtl-diagram .bg   { fill: #f8fafc; stroke: #e2e8f0; }
    #rtl-diagram .fig  { stroke: #64748b; fill: none; }
    #rtl-diagram .dot  { fill: #64748b; }
    #rtl-diagram .txt  { fill: #475569; }
    #rtl-diagram .core { fill: #eff6ff; stroke: #2563ff; }
    #rtl-diagram .ctxt { fill: #1d4ed8; }
    #rtl-diagram .csub { fill: #3b82f6; }
    #rtl-diagram .sig  { fill: #f5f3ff; stroke: #7c3aed; }
    #rtl-diagram .stxt { fill: #6d28d9; }
    #rtl-diagram .ssub { fill: #7c3aed; opacity: 0.7; }
    #rtl-diagram .git  { fill: #f0fdf4; stroke: #16a34a; }
    #rtl-diagram .gtxt { fill: #15803d; }
    #rtl-diagram .gsub { fill: #16a34a; opacity: 0.7; }
    #rtl-diagram .dev  { fill: #f1f5f9; stroke: #475569; }
    #rtl-diagram .dtxt { fill: #475569; }
    #rtl-diagram .dsub { fill: #94a3b8; }
    #rtl-diagram .tpm  { fill: #eff6ff; stroke: #2563ff; }
    #rtl-diagram .ttxt { fill: #1d4ed8; }
    :root[data-theme="dark"] #rtl-diagram .bg   { fill: #0b1220; stroke: #1e3050; }
    :root[data-theme="dark"] #rtl-diagram .fig  { stroke: #64748b; }
    :root[data-theme="dark"] #rtl-diagram .dot  { fill: #64748b; }
    :root[data-theme="dark"] #rtl-diagram .txt  { fill: #94a3b8; }
    :root[data-theme="dark"] #rtl-diagram .core { fill: #071433; stroke: #2563ff; }
    :root[data-theme="dark"] #rtl-diagram .ctxt { fill: #60a5fa; }
    :root[data-theme="dark"] #rtl-diagram .csub { fill: #3b82f6; }
    :root[data-theme="dark"] #rtl-diagram .sig  { fill: #120a2a; stroke: #7c3aed; }
    :root[data-theme="dark"] #rtl-diagram .stxt { fill: #a78bfa; }
    :root[data-theme="dark"] #rtl-diagram .ssub { fill: #a78bfa; opacity: 0.6; }
    :root[data-theme="dark"] #rtl-diagram .git  { fill: #0a1a0a; stroke: #16a34a; }
    :root[data-theme="dark"] #rtl-diagram .gtxt { fill: #4ade80; }
    :root[data-theme="dark"] #rtl-diagram .gsub { fill: #4ade80; opacity: 0.6; }
    :root[data-theme="dark"] #rtl-diagram .dev  { fill: #0f1c2e; stroke: #2a3a52; }
    :root[data-theme="dark"] #rtl-diagram .dtxt { fill: #94a3b8; }
    :root[data-theme="dark"] #rtl-diagram .dsub { fill: #475569; }
    :root[data-theme="dark"] #rtl-diagram .tpm  { fill: #071433; stroke: #2563ff; }
    :root[data-theme="dark"] #rtl-diagram .ttxt { fill: #60a5fa; }
  </style>
  <defs>
    <marker id="rtl-blue"   viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#2563ff"/></marker>
    <marker id="rtl-purple" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#7c3aed"/></marker>
    <marker id="rtl-green"  viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#16a34a"/></marker>
    <marker id="rtl-slate"  viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#94a3b8"/></marker>
  </defs>

  <rect width="1300" height="500" rx="16" class="bg" stroke-width="1.5"/>

  <!--
    Layout anchor: vertical center = y=230
    Core:           y=160–300  (center y=230)
    Policy Sigstore: y=110–210 (center y=160, symmetric 70px above core center)
    Policy Git Repo: y=250–350 (center y=300, symmetric 70px below core center)
    Figures (You, RP): cy=230  — same as core center
    Arrows You→boxes fan ±70px symmetrically
    Arrow Core→RP is perfectly horizontal
  -->

  <!-- YOU: head only, eyes shifted right -->
  <circle cx="112" cy="230" r="24" class="fig" stroke-width="2.5"/>
  <circle cx="108" cy="225" r="2.5" class="dot"/>
  <circle cx="124" cy="225" r="2.5" class="dot"/>
  <text x="112" y="272" text-anchor="middle" class="txt" font-size="18" font-weight="600">You</text>
  <text x="112" y="292" text-anchor="middle" class="txt" font-size="14">(Trusted Party)</text>

  <!-- Arrow You→Sigstore: tail x=156 y=230, tip x=296 y=160 (slopes up 70px) -->
  <line x1="156" y1="215" x2="296" y2="160" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" marker-end="url(#rtl-purple)"/>
  <!-- Arrow You→Git Repo: tail x=156 y=230, tip x=296 y=300 (slopes down 70px — mirror) -->
  <line x1="156" y1="245" x2="296" y2="300" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" marker-end="url(#rtl-green)"/>

  <!-- POLICY SIGSTORE / REKOR ENTRY: center y=160 -->
  <rect x="316" y="110" width="228" height="100" rx="10" class="sig" stroke-width="2"/>
  <text x="430" y="147" text-anchor="middle" class="stxt" font-size="17" font-weight="600">Policy Sigstore</text>
  <text x="430" y="170" text-anchor="middle" class="stxt" font-size="17" font-weight="600">Rekor Entry</text>
  <text x="430" y="191" text-anchor="middle" class="ssub" font-size="12">signed · immutable · auditable</text>

  <!-- POLICY GIT REPO: center y=300 (mirror of Sigstore above core center) -->
  <rect x="316" y="250" width="228" height="100" rx="10" class="git" stroke-width="2"/>
  <text x="430" y="293" text-anchor="middle" class="gtxt" font-size="17" font-weight="600">Policy Git Repo</text>
  <text x="430" y="315" text-anchor="middle" class="gsub" font-size="12">versioned · cosign-signed</text>

  <!-- Arrow Sigstore→Core: tail x=564 y=160, tip x=640 y=188 -->
  <line x1="564" y1="160" x2="640" y2="188" stroke="#2563ff" stroke-width="2.5" stroke-linecap="round" marker-end="url(#rtl-blue)"/>
  <!-- Arrow Git Repo→Core: tail x=564 y=300, tip x=640 y=272 (mirror) -->
  <line x1="564" y1="300" x2="640" y2="272" stroke="#2563ff" stroke-width="2.5" stroke-linecap="round" marker-end="url(#rtl-blue)"/>

  <!-- RATATOUILLE CORE: y=160–300, center y=230 -->
  <rect x="660" y="160" width="302" height="140" rx="14" class="core" stroke-width="2.5"/>
  <text x="811" y="224" text-anchor="middle" class="ctxt" font-size="22" font-weight="700" letter-spacing="0.3">Ratatouille Core</text>
  <text x="811" y="249" text-anchor="middle" class="csub" font-size="13">verifies · attests · issues tokens</text>

  <!-- Arrow Device→Core: tail y=380 (20px above card top 400), tip y=320 (20px below core bottom 300) -->
  <line x1="811" y1="380" x2="811" y2="320" stroke="#2563ff" stroke-width="2.5" stroke-linecap="round" marker-end="url(#rtl-blue)"/>

  <!-- DEVICE(S) STACK: front card y=400 -->
  <rect x="668" y="414" width="258" height="65" rx="10" class="dev" stroke-width="1.5" opacity="0.45"/>
  <rect x="675" y="407" width="258" height="65" rx="10" class="dev" stroke-width="1.5" opacity="0.7"/>
  <rect x="682" y="400" width="258" height="65" rx="10" class="dev" stroke-width="2"/>
  <rect x="696" y="415" width="48" height="25" rx="6" class="tpm" stroke-width="1.5"/>
  <text x="720" y="432" text-anchor="middle" class="ttxt" font-size="12" font-weight="700">TPM</text>
  <text x="820" y="432" text-anchor="middle" class="dtxt" font-size="17" font-weight="600">Device(s)</text>
  <text x="820" y="452" text-anchor="middle" class="dsub" font-size="12">Linux · TPM 2.0</text>

  <!-- Arrow Core→RP: horizontal at y=230, tail x=982, tip x=1104 -->
  <line x1="982" y1="230" x2="1104" y2="230" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" marker-end="url(#rtl-slate)"/>

  <!-- RELYING PARTY: head only, eyes shifted left, same cy=230 as You -->
  <circle cx="1148" cy="230" r="24" class="fig" stroke-width="2.5"/>
  <circle cx="1136" cy="225" r="2.5" class="dot"/>
  <circle cx="1152" cy="225" r="2.5" class="dot"/>
  <text x="1148" y="272" text-anchor="middle" class="txt" font-size="18" font-weight="600">Relying Party</text>
</svg>

---

The Ratatouille flow breakdown is as follows: You (the user) designates a Git repository to store runtime policies and their history. When you run `rat init-baseline`, Ratatouille captures the IMA log from your baseline machine and generates a Keylime allowlist. The Keylime allowlist is the set of file hashes permitted to appear in future IMA log entries. You sign that policy with Cosign and push it to the repository. The signature is recorded in the Rekor transparency log at the same time, creating a permanent, attributable record of who approved this policy and when.

Every push to the repository is ingested by Ratatouille's webhook, which verifies the Cosign signature and distributes the new policy to the Keylime verifier for every device enrolled in the associated policy group. From that point on, every TPM quote and IMA log segment is evaluated against the updated policy.

**What trust verdicts enable.** A `TRUSTED` result can gate audit evidence export, access control decisions, SPIFFE/SPIRE workload identity issuance, and secret provisioning. An `UNTRUSTED` result can execute revocation actions, shut down devices, or flag for investigation.


## Built on open standards

Ratatouille does not introduce a proprietary trust model. It operationalizes proven open-source components:

- **[Keylime](https://keylime.dev)** — TPM-based remote attestation and IMA log verification. CNCF Sandbox project, shipped in RHEL 9 and SLE Micro. Ratatouille is the operational layer; Keylime is the engine.
- **[Sigstore / Cosign](https://sigstore.dev)** — Keyless code signing and policy verification. Every policy approval is attributable to a specific authenticated identity and permanently auditable.
- **[IMA (Linux Integrity Measurement Architecture)](https://sourceforge.net/p/linux-ima/wiki/Home/)** — Kernel-level measurement of every executed binary. The OS cannot alter what IMA recorded.
- **[IETF RATS (RFC 9334)](https://datatracker.ietf.org/wg/rats/about/)** — The standards framework defining Attester, Verifier, and Relying Party roles. Ratatouille is aligned with the RATS background-check model, scoped to Linux with TPM 2.0.

You own the policies, the evidence, and the cryptographic chain. No lock-in. If Ratatouille disappears tomorrow, your evidence and policies remain valid and verifiable.

---

## What Ratatouille is not

**Not a general-purpose attestation platform.** Ratatouille covers Linux machines with TPM 2.0. It does not cover macOS, Windows, GPU firmware, NIC firmware, or BMC. If you need heterogeneous hardware attestation, that's a different product.

**Not a compliance dashboard.** Vanta tells you your policies are set correctly. Ratatouille tells you your machines are running what you think they're running. These are different layers — and increasingly, regulations require both.

**Not infinite-scale out of the box.** Every machine type with different software stacks needs its own IMA runtime policy. Every package update across every machine type requires policy regeneration. Policy lifecycle management is the current operational challenge.

---

**What the baseline actually covers.** The TPM quote covers PCR 7 (UEFI Secure Boot state), which proves whether Secure Boot was enabled at boot and whether the boot chain matched a known-good state. IMA picks up after the kernel loads and its measurement policy activates, extending a hash into PCR 10 for every executable, kernel module, and shared library that runs. The Keylime allowlist covers both: it validates PCR 7 against the expected Secure Boot state and checks every IMA log entry against the set of hashes captured at baseline time.

**The baseline limitation.** The allowlist is a snapshot of what ran on a specific machine between boot and the moment `rat init-baseline` was run. Any binary that had not yet executed at baseline time will cause an attestation failure the first time it runs — it appears in the IMA log but is absent from the allowlist.

In practice, baseline capture should happen after the machine has fully settled: all expected daemons started, maintenance scripts run, and any binaries that would run during normal operation exercised at least once. This makes Ratatouille well-suited for immutable or appliance-style deployments (IoT devices, fixed-image VMs, purpose-built servers) where the software set is stable and bounded. For general-purpose servers that receive regular package updates, the baseline must be regenerated and re-signed after each update.


## Next steps

The [Remote Attestation Primer](/ra_overview) covers the underlying concepts (TPMs, IMA, and the RATS framework) for readers who want to understand the mechanics. To get a machine enrolled, start with the [Quickstart Guide](/guides/quickstart). To see the full flow live, including a triggered attestation failure, go to the [Live Demo](/demo).
