# Public portfolio deployment

## Current deployment

The 2026-11-01 visual release was built and promoted as `dpl_AtUVjHRaVuCoTsLJB7f5574wVdMX`. Anonymous public browser checks passed for the guided simulation, receipt queries and errors, reset, bilingual responsive layouts, architecture and motion preferences. Source and publication notes are synchronized to GitHub.

Public URL: [https://carbon-credit-seven.vercel.app/](https://carbon-credit-seven.vercel.app/).

The `carbon-credit` project is deployed independently under the owner's `david-office` Vercel space. The existing `app` project was not modified. Anonymous HTTPS access, the architecture image, simulated lifecycle, bilingual/mobile layout, and disabled Sepolia interaction were checked after publication.

This release has no configured Sepolia contracts. On 2026-11-01 the frontend audit reports zero findings; the Hardhat 2 development toolchain reports 8 low and 4 moderate findings, with no high or critical findings. The earlier zero-moderate audit was a dated snapshot; current advisories include legacy glob/minimatch paths. See [release validation](RELEASE-VALIDATION.md). Do not use this research demo with real assets. CLI publication does not establish automatic GitHub redeployment; a Git integration must be linked separately if desired.

Configuration reference: [Vercel project configuration](https://vercel.com/docs/project-configuration) and [deployment file exclusions](https://vercel.com/docs/deployments/vercel-ignore).

## What visitors can use

The public build starts with a bilingual cream-and-forest project overview, dated validation evidence, an architecture explorer, and a wallet-free simulation. The simulation uses a guided four-step workspace, a persistent project summary and session-only receipt cards. See [the interface redesign](UI-REDESIGN.md). The simulation is deliberately labelled: it uses fictional browser-session data, makes no RPC calls, and generates `SIM-ONLY-*` IDs, not blockchain certificates. Reset/reload clears it.

The separate blockchain interface uses the existing contract UI. It remains disabled when the Sepolia address manifest is empty. Configured addresses are not proof of an audited deployment or environmental certification.

Local development still defaults to the existing Hardhat interface. Visit `http://127.0.0.1:8080/?showcase=1` to preview the portfolio locally.

## Vercel: deploy the frontend only

1. Connect Vercel to the private `yehouwang-dev/carbon-credit` repository using your own account; grant only necessary repository access.
2. Import the project and **leave Root Directory as the repository root**, not `fronted`.
3. The root `vercel.json` configures:
   - Framework preset: Other (the Vite package lives in the nested `fronted` folder)
   - Install: `npm --prefix fronted ci`
   - Build: `npm --prefix fronted run build:sepolia`
   - Output: `fronted/dist`
4. No wallet private key or deployment secret belongs in Vercel. Optional `VITE_PUBLIC_RPC_URL` is a browser-visible endpoint, not a place for secret credentials.
5. Deploy, open the public URL while logged out, and verify overview, architecture image, simulation review/issue/retire/query, reset, mobile layout, and the disabled blockchain interface if contracts are not deployed.

Vercel deployment protection settings can require authentication. Check anonymous access before sharing the URL with reviewers; a successful build alone does not prove the site is publicly accessible. The GitHub repository can remain private independently of the deployed website.

CLI alternative from the repository root, after account login:

```bash
vercel login
vercel deploy --prod
```

If account login, project scope, or paid-plan changes require a choice, resolve those explicitly. Do not paste login tokens into chat. This repository does not silently create paid infrastructure.

## Enable optional real Sepolia interaction

Frontend publication does not deploy contracts. To enable test transactions:

1. Prepare a dedicated Sepolia-only wallet with test ETH and configure `hardhat-project/.env` locally using its example. Never use a real-asset wallet or publish its private key.
2. Deploy with `npm --prefix hardhat-project run deploy:sepolia`. Only enable fictional fixture seeding intentionally with `SEED_SEPOLIA_DEMO=true`.
3. Confirm chain ID 11155111, contract code, recorded addresses, and a real test transaction. Optionally verify source code.
4. Commit only the public Sepolia manifest, not `.env`. Redeploy the frontend.
5. Ordinary visitors do not receive issuer/reviewer privileges. Reading or connecting a wallet is different from being authorized to issue/review credits.

No public Hardhat node, cloud backend, real funds, or real-world certified credits are part of this deployment.

## Checks

```bash
npm --prefix fronted test
npm --prefix fronted run build:sepolia
npm --prefix hardhat-project test
```

The simulation model intentionally simplifies contract behavior. It illustrates a single approved project and cumulative cap; it is not a substitute for Solidity tests.
