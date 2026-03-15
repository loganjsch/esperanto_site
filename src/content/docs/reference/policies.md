---
title: Policies
description: A reference page in my new Starlight docs site.
---

# Policy Measurement Methods

In Esperanto, policies define the expected measurements and trust requirements for devices. These measurements are used to evaluate whether a device is **TRUSTED**, **UNTRUSTED**, or **UNKNOWN** before allowing workloads to run. The policy can include **initial Secure Boot state**, **TPM PCRs**, **event logs / IMA**, or that measurement and evaluation can be offloaded and defined through higher-level claims from frameworks like DHA or Keylime.

There are several ways to generate the expected measurements that populate a policy, each with different trust assumptions and operational trade-offs:

| Method                    | Measurements source  | Trust assumption               | Pros                     | Cons                       |
| ------------------------- | -------------------- | ------------------------------ | ------------------------ | -------------------------- |
| Staging device enrollment | Golden device        | Trust your staging environment | Highest assurance        | Requires matching hardware |
| Field enrollment          | Deployed device      | Trust vendor Secure Boot       | Quick, no staging needed | Supply chain risk          |
| Predictive / CI/CD        | Build pipeline / BOM | Trust build pipeline accuracy  | Scales to large fleets   | Hard to model exactly      |
| Vendor-provided baseline  | OEM measurements     | Trust vendor                   | No staging needed        | Limited vendor coverage    |
| Claims-based attester     | DHA / Keylime claims | Trust framework                | Heterogeneous devices    | Coarse granularity         |

## Notes on Usage

1. **Staging device enrollment** is typically the default for enterprises. It provides a controlled environment to capture **baseline measurements** for TPM and continuous integrity (e.g., IMA) before production deployment.

2. **Field enrollment** can be used when no staging device is available, but it requires trusting the vendor's **Secure Boot and firmware chain** to ensure first-boot integrity.

3. **Predictive / CI/CD policies** simulate TPM measurements from a known **bill of materials (BOM)** and generate expected PCR/event log values ahead of deployment. This scales well but requires precise modeling, so you might find this more commonly at the hyperscaler level.

4. **Vendor-provided baselines** leverage OEM reference measurements, useful for heterogeneous hardware fleets where staging devices are impractical.

5. **Claims-based attesters** abstract the measurements into higher-level assertions (e.g., Secure Boot enabled, BitLocker active). This works when raw TPM access is unavailable but provides less granular attestation.

Esperanto is designed to **normalize verdicts across all of these measurement sources**, allowing flexible policy enforcement while maintaining a consistent TRUSTED/UNTRUSTED/UNKNOWN evaluation model. To what level you extend trust (raw measurements, vendor verdicst, even Esperanto) is up to your threat model and how you configure Esperanto.
