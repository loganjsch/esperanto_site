---
title: Demo Guide
description: A guide in my new Starlight docs site.
---

Editors note: I talk about how Ratatouille makes things easy and not complex, then immediately start diving into policies, fingerprints, etc.. I think this demo page should show users perspective rather than the steps to take to get it operational - when it's all said and done, how would a user interact with Ratatouille? e.g. IMA policy fixed, runtime policy and new hashes created/added to policy via client tool, etc..

# Demo Flow

This flow will demonstrate how to enable the Ratatouille system to operationalize CI/CD controlled policy changes into a deployed production RATs framework using Keylime.

First we need an IMA policy - I tried twice to make custom versions, but it’s very easy to break the boot sequence and disk.

So, use the standard one —

```yaml
# PROC_SUPER_MAGIC
dont_measure fsmagic=0x9fa0
# SYSFS_MAGIC
dont_measure fsmagic=0x62656572
# DEBUGFS_MAGIC
dont_measure fsmagic=0x64626720
# TMPFS_MAGIC
dont_measure fsmagic=0x01021994
# RAMFS_MAGIC
dont_measure fsmagic=0x858458f6
# SECURITYFS_MAGIC
dont_measure fsmagic=0x73636673
# MEASUREMENTS
measure func=BPRM_CHECK
measure func=FILE_MMAP mask=MAY_EXEC
measure func=MODULE_CHECK uid=0
```

It’s also important that IMA measures all executions because if we were to pick and choose, that would defeat the security of the entire thing.

<aside>
⚠️

_If this is not on a fresh system, we need to restart the system to clear the TPM PCRs and the IMA log._

</aside>

We also need a Keylime runtime policy. This is much more flexible than our IMA-policy (mistake doesn’t break the machine, just fails attestation), but it’s still a little tricky and brittle. We need to include everything that will execute on the machine, including agent executable, RUST executables, kernel objects, etc… as well as our ‘custom code’ —> job schedulers, servers. In our demo case, this is the ‘demo script’.

The easiest way to do this is to use the ‘create policy tool’ that Keylime offers on a fresh restart of the machine in question. The goal is to exclude as much as possible, while still maintaining everything we expect to be loaded or execute - with even a moderately complex service, this can be tricky because dependencies can spiral very quickly.

[Demo Allow List (1)](https://www.notion.so/Demo-Allow-List-1-2bde169462a180b9be2ad83b8e3dc1c1?pvs=21)

```yaml
sudo ./create_runtime_policy.sh -a sha256sum -o ../demo_runtime_policy.json

(-o demo_runtime_logs.txt) if running without dependencies.
```

<aside>
⚠️

If this is just the script (no keylime src code), then this will output a list of hashes and paths from the IMA log. We have to convert that .txt into the json runtime policy using the tools at keylime/keylime/cmd. The script notes that there’s only 3 dependencies, so it’s probably not the end of the world if that Keylime src code is stored and this conversion is done on device.

</aside>

```yaml
# Convert to runtime policy
mkdir -p $OUTPUT_DIR
announce "Converting created allowlist ($ALLOWLIST_DIR/${OUTPUT}) to Keylime runtime policy ($OUTPUT_DIR/${OUTPUT}) ..."
CONVERT_CMD_OPTS="--allowlist $ALLOWLIST_DIR/${OUTPUT} --output_file $OUTPUT_DIR/${OUTPUT}"
[ -f $EXCLUDE_LIST ] && CONVERT_CMD_OPTS="$CONVERT_CMD_OPTS --excludelist "$(readlink -f -- "${EXCLUDE_LIST}")""

pushd $KCRP_BASE_DIR  > /dev/null 2>&1
export PYTHONPATH=$KCRP_BASE_DIR:$PYTHONPATH
# only 3 dependencies required: pip3 install cryptography lark packaging
python3 ./keylime/cmd/convert_runtime_policy.py $CONVERT_CMD_OPTS; echo " "
if [[ $? -eq 0 ]]
then
    announce "Done, new runtime policy file present at ${OUTPUT_DIR}/$OUTPUT. It can be used on the tenant keylime host with \"keylime_tenant -c add --runtime-policy ${OUTPUT_DIR}/$OUTPUT <other options>"
fi
popd  > /dev/null 2>&1
```

If we don’t want to have to have all of this on the agent machine, which I think we don’t, we need to run the following on a verifier which has been given the output.txt from the previous command.

```yaml
python keylime/cmd/convert_runtime_policy.py --allowlist demo_runtime_logs.txt --output_file demo_runtime_policy.json
```

I also had to manually sha256 these and add these entries to the end of the policy.

```yaml
        .....
        ],
        "/home/loganschwarz/.cargo/bin/rustup": [
            "20a06e644b0d9bd2fbdbfd52d42540bdde820ea7df86e92e533c073da0cdd43c"
        ],
        "/home/loganschwarz/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/cargo": [
            "e60b4010303c19a131c058e3f054b4b3311433c4b2ee94ba8e09e165ff2a3b3b"
        ],
        "/home/loganschwarz/rust-keylime/target/debug/keylime_agent": [
            "292c98c3e31da2623a6659bd7b2d1ef10a069515998f8b489fd8eedfc18790dc"
        ]
```

Keylime recommends that you do this in an airgapped ‘secure’ staging environment. For full confidence in security, this is your best shot, but it’s not required should your threat model allow a more flexible policy creation method.

Next, for the demos sake, we manually update the verifier with this new policy/agent entry to demonstrate that attestation works:

(In production, you would push this policy to the policy repo.)

```yaml
sudo keylime_tenant -c update -t 10.128.0.6 -tp 9002 -v 10.128.0.4 -vp 8881 -u d432fbb3-d2f1-4a97-9ef7-75bd81c00000 --runtime-policy demo_runtime_policy.json
```

With Keylime running, the verifier should be polling the agent. Ensure that the agent was init with a runtime policy that includes the initial demo script:

```yaml
....
 DEBUG keylime_agent::quotes_handler        > Calling Integrity Quote with nonce: 3Rgkfv2FvXGKBPkp0BJ9, mask: 0x400
 INFO  keylime_agent::quotes_handler        > GET integrity quote returning 200 response
 INFO  keylime_agent                        > GET invoked from "10.128.0.4" with uri /v2.2/quotes/integrity?nonce=OanBCiOkqNBEVpSlHpts&mask=0x400&partial=1&ima_ml_entry=369
 DEBUG keylime_agent::quotes_handler        > Calling Integrity Quote with nonce: OanBCiOkqNBEVpSlHpts, mask: 0x400
 INFO  keylime_agent::quotes_handler        > GET integrity quote returning 200 response
 INFO  keylime_agent                        > GET invoked from "10.128.0.4" with uri /v2.2/quotes/integrity?nonce=mgC8tubHxSSBYNUuoeuQ&mask=0x400&partial=1&ima_ml_entry=369
 DEBUG keylime_agent::quotes_handler        > Calling Integrity Quote with nonce: mgC8tubHxSSBYNUuoeuQ, mask: 0x400
 INFO  keylime_agent::quotes_handler        > GET integrity quote returning 200 response
 INFO  keylime_agent                        > GET invoked from "10.128.0.4" with uri /v2.2/quotes/integrity?nonce=ZjWooM6nA6fm87ROLLiz&mask=0x400&partial=1&ima_ml_entry=369
 ....
```

Run the following to execute the script and view IMA record of its execution:

```yaml
[loganschwarz@agent-vm]:/etc/demo$ sudo grep esperanto_demo.sh /sys/kernel/security/ima/ascii_runtime_measurements
	- we see here that this script has not been recorded

[loganschwarz@agent-vm]:/etc/demo $ sudo ./esperanto_demo.sh
Hello, I am trusted :)

loganschwarz@agent-vm:/etc/demo$ sudo grep esperanto_demo.sh /sys/kernel/security/ima/ascii_runtime_measurements
10 e8a4f4cf8a29eb1abddb34520763d7aaf8a18200 ima-ng sha256:af0dd6b6e00ab18d613a4c51220e33295b9e929375eea134901a149d27385062 /etc/demo/esperanto_demo.sh
```

You can also note here that the ima_ml_entry sent in the uri has increased by one, indicated that we are sending the verifier the incremental log that just executed.

Now we modify the script, and execute again:

```yaml
loganschwarz@agent-vm:/etc/demo$ vim esperanto_demo.sh
loganschwarz@agent-vm:/etc/demo$ ./esperanto_demo.sh
Hello, I am NOT trusted :)
loganschwarz@agent-vm:/etc/demo$ sudo grep esperanto_demo.sh /sys/kernel/security/ima/ascii_runtime_measurements
10 e8a4f4cf8a29eb1abddb34520763d7aaf8a18200 ima-ng sha256:af0dd6b6e00ab18d613a4c51220e33295b9e929375eea134901a149d27385062 /etc/demo/esperanto_demo.sh
10 73e87408a8dc0c1e9ab48e92fee70013028aecac ima-ng sha256:196f60a809bdc3ab61293820d62ba20e73351787633da9eb02f4752e68a2349b /etc/demo/esperanto_demo.sh
loganschwarz@agent-vm:/etc/demo$
```

We see that the device failed to attest (and revocation cert sent, although not configured)

```yaml
2025-11-19 05:15:39.849 - keylime.tpm - INFO - Checking IMA measurement list on agent: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
2025-11-19 05:15:39.849 - keylime.ima - WARNING - Hashes for file /etc/demo/esperanto_demo.sh don't match 196f60a809bdc3ab61293820d62ba20e73351787633da9eb02f4752e68a2349b not in ['af0dd6b6e00ab18d613a4c51220e33295b9e929375eea134901a149d27385062']
2025-11-19 05:15:39.850 - keylime.ima - ERROR - IMA ERRORS: Some entries couldn't be validated. Number of failures in modes: ImaNg 1.
2025-11-19 05:15:39.928 - keylime.verifier - WARNING - Agent d432fbb3-d2f1-4a97-9ef7-75bd81c00000 failed, stopping polling
```

Now we need to change the policy to allow for our new script.

Options:

Option A: Grab a fingerprint from the expected file:

```yaml
loganschwarz@agent-vm:/etc/demo$ sha256sum esperanto_demo.sh
196f60a809bdc3ab61293820d62ba20e73351787633da9eb02f4752e68a2349b  esperanto_demo.sh
```

Then add it to the correct entry in the existing policy.

NOTE: The previous measurement will stay in IMA measurements, so you either need to keep that hash in the allowlist or restart the device to wipe the measurements. In theory, in production, a failure would cause some revocation procedure which likely means restarting/wiping the machine and not just enabling the new malicious software, so this is more of a demo gotcha.

```yaml
"292c98c3e31da2623a6659bd7b2d1ef10a069515998f8b489fd8eedfc18790dc"
        ],
        "/etc/demo/esperanto_demo.sh": [
            "af0dd6b6e00ab18d613a4c51220e33295b9e929375eea134901a149d27385062",
            "196f60a809bdc3ab61293820d62ba20e73351787633da9eb02f4752e68a2349b"
        ]
    },
    "excludes": [],
    "keyrings": {},
    "ima": {
        "ignored_keyrings": [],
```

Option B: Recreate runtime policy based on the new script

```yaml
sudo ./create_runtime_policy.sh -o ~/keylime/demo_runtime_policy2.json  -z /etc/demo -x none
```

Sign the new policy changes, then push the new policy and the signature artifact to policy git repo. The Esperanto Client provides the automation for these steps.

```yaml
loganschwarz@W-PF1CQHPB runtime % cosign sign-blob runtime_policy_keylime.json --bundle artifact.sigstore.json

        The sigstore service, hosted by sigstore a Series of LF Projects, LLC, is provided pursuant to the Hosted Project Tools Terms of Use, available at https://lfprojects.org/policies/hosted-project-tools-terms-of-use/.
        Note that if your submission includes personal data associated with this signed artifact, it will be part of an immutable record.
        This may include the email address associated with the account with which you authenticate your contractual Agreement.
        This information will be used for signing this artifact and will be stored in public transparency logs and cannot be removed later, and is subject to the Immutable Record notice at https://lfprojects.org/policies/hosted-project-tools-immutable-records/.

By typing 'y', you attest that (1) you are not submitting the personal data of any other person; and (2) you understand and agree to the statement and the Agreement terms at the URLs listed above.
Are you sure you would like to continue? [y/N] y
Your browser will now be opened to:
https://oauth2.sigstore.dev/auth/auth?access_type=online&client_id=sigstore&code_challenge=z-hBvy1-dqYphMSDjTmCYWto9eBCINFBNbDUG9uqtDc&code_challenge_method=S256&nonce=36HAMCYOIZBcapHTy0ZzLNI7p2H&redirect_uri=http%3A%2F%2Flocalhost%3A59877%2Fauth%2Fcallback&response_type=code&scope=openid+email&state=36HAMAhy1AeR7X9XnShig3zbQqJ
Using payload from: runtime_policy_keylime.json
Wrote bundle to file artifact.sigstore.json
loganschwarz@W-PF1CQHPB runtime % git add artifact.sigstore.json runtime_policy_keylime.json
loganschwarz@W-PF1CQHPB runtime % git commit -m "yay"
loganschwarz@W-PF1CQHPB runtime % git push
```

The Github app recognizes this, pushes new policy to verifier, updates agent with new policy.

This attempts to restart polling with an attestation check, which should now pass and polling should continue like normal.

```yaml
2025-12-02 05:25:05.237 - keylime.verifier - INFO - DELETE returning 200 response for agent id: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
2025-12-02 05:25:10.004 - keylime.verifier - WARNING - Connecting to agent without mTLS: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
2025-12-02 05:25:10.005 - keylime.verifier - INFO - POST returning 200 response for adding agent id: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
2025-12-02 05:25:10.782 - keylime.tpm - INFO - Checking IMA measurement list on agent: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
2025-12-02 05:25:21.748 - keylime.tpm - INFO - Checking IMA measurement list on agent: d432fbb3-d2f1-4a97-9ef7-75bd81c00000
```

# UI Demo

Now that we have a working attestation pipeline, we are going to take a look at how Esperanto makes managing and configuring this attestation pipeline easy.

… TODO
