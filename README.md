# Carbon Credit Platform

**An educational prototype for tracing project-linked carbon-credit issuance and retirement on an EVM-compatible chain.**

This project explores how a registry record, token issuance, and retirement certificate can be linked by on-chain state and events. It is a research and portfolio prototype—not a certified carbon registry, a market, or an audited financial product.

> **Status:** local Hardhat demo. No public deployment is currently maintained. Demo project data and collateral values are illustrative only.

## What the prototype demonstrates

- ERC-721 project records and a reviewer application/approval flow.
- ERC-20 issuance linked to an approved project and its recorded reduction cap.
- Retirement (burn) records with a unique on-chain certificate ID and a basic verification view.
- A manually appraised NFT-collateral loan flow, with partial repayment and liquidation after a fixed term.
- Separate multisig and timelock contracts, tested as governance primitives.
- A bilingual React interface for the local demo and an optional MetaMask connection.

## Research framing

The implementation is a starting point for studying **data provenance and lifecycle traceability**: which project record authorizes issuance, how much has been issued or retired against that record, and what evidence a retirement event exposes to a verifier.

The prototype does not establish that a project is genuinely additional, that its reported reductions are accurate, or that an issuer is authorized by an external standard. Those are off-chain questions requiring trusted verification, evidence governance, and clearly defined institutional processes. The current project metadata is stored in contract state; evidence URIs are references, not proof that the referenced documents are authentic or permanently available.

## Architecture

```text
React + Vite UI
      │ ethers.js
      ▼
Hardhat local EVM ── CarbonCredit (ERC-20)
                  ├─ CarbonCreditNFT (ERC-721 project registry)
                  ├─ CarbonCreditVault (manual appraisal / collateral loan)
                  ├─ CarbonCreditTreasury
                  ├─ CarbonMultiSig (separate governance primitive)
                  └─ CarbonTimeLock (separate governance primitive)
```

Key code lives in `hardhat-project/contracts`, `hardhat-project/test`, and `fronted/src`. The deployment script writes the local contract addresses to `fronted/src/contracts/deployment.json`.

## Run locally

Requirements: Node.js 20 (or a compatible current LTS) and npm.

Install dependencies once:

```bash
cd hardhat-project && npm ci
cd ../fronted && npm ci
```

Start the local chain, deploy demo contracts, and run the UI in **three terminals**:

```bash
# Terminal 1
cd hardhat-project && npm run node

# Terminal 2
cd hardhat-project && npm run deploy:local

# Terminal 3
cd fronted && npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:8080`) and choose **Local Demo**. The demo uses Hardhat's first development account and local chain only. Never use Hardhat's published development keys on a public network. Restarting the local chain resets its state; redeploy after each restart.

To run checks:

```bash
cd hardhat-project && npm test
cd ../fronted && npm run build
```

GitHub Actions runs the contract test suite and frontend production build on pushes and pull requests.

## Known limitations and security scope

- **No audit:** contracts have not received an independent security audit and must not hold real assets.
- **Not integrated governance:** multisig and timelock are separately deployed/tested primitives; the demo deploy script does not transfer application-contract ownership to them or route privileged calls through them. Do not describe the demo as having multisig-protected administration.
- **Manual collateral appraisal:** the vault's value is set by its owner; there is no price oracle or independent appraisal process. Liquidation is based on a fixed loan duration, not a live collateral ratio.
- **Registry trust is out of scope:** reviewers and issuers are administrator-managed roles. On-chain approval does not validate real-world claims or replace VCS, Gold Standard, CCER, or other program rules.
- **Evidence availability:** storing a URI/hash does not guarantee the underlying evidence is retrievable, authentic, or immutable.
- **Local demo data only:** sample names, verifier labels, quantities, and evidence URIs are fictional fixtures for demonstration.

Never commit `.env` files, wallet private keys, API keys, or funded-wallet credentials. The checked-in `.env.example` files contain placeholders only. Sepolia scripts are optional experiments and are not part of the supported demo workflow.

## Next research steps

1. Specify a threat model and trust assumptions for project review, issuer roles, and evidence storage.
2. Add invariants and adversarial/property-based tests for issuance caps, role transitions, retirement accounting, vault solvency, and governance handoff.
3. Integrate governance deliberately (or remove unused governance primitives) and test the actual deployed ownership graph.
4. Evaluate evidence commitments and verifier workflows against a clearly chosen carbon-credit standard; avoid implying that tokenization itself validates environmental claims.
5. Run an independent security review before any public deployment.
