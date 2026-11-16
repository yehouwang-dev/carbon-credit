# Sepolia deployment — 12 November 2026

Status: 11 Sepolia transactions confirmed and independently checked. Six contract creation payloads match the compiled artifacts and constructor arguments. Contract ownership, reviewer/issuer permissions, registry/vault/treasury links, and retirement data match the dedicated test account.

Wallet signing remained inside MetaMask. No private keys were exported. Fictional metadata uses TEST ONLY / DEMO-NOT-CERTIFIED.

| Contract | Address |
| --- | --- |
| CarbonCredit | `0x55907e1E7aE17d1cb1CEAd26d91C741e5Cf3f6c0` |
| CarbonCreditNFT | `0x67D19a0Ac21445b5c673386Dd75a522f465dc5F7` |
| CarbonMultiSig | `0x994F65d40D78bf05ce99a57B476Ad5a9c6A54232` |
| CarbonTimeLock | `0x109964D76Af032ea5CC923C1611a38a20975ABb5` |
| CarbonCreditVault | `0x6e500Ca0702a57B4C02bE090C21891ded4Bf17Ac` |
| CarbonCreditTreasury | `0x69Fe45DB0A35E1566c5E08B39410B466c2Fc0BB7` |

- Test account: `0x8B14306459e4b022798fF44551cfE86faA3d7Bd4`.
- Actual total test fee: 0.0125133469659684 Sepolia ETH, below the 0.02 cumulative limit. The first transaction used a 1 gwei priority fee; following transactions use explicit network fee quotes. Do not reuse the earlier fallback blindly on a low-fee testnet.
- Issued: 100 CC. Retired: 10 CC. Balance: 90 CC. Remaining project issuance capacity: 0.
- Certificate ID: `0x25b2089edd6088d6b998f0f55eb0e203ffffb0dc6b7e780d90c3cf6b1b1323a0`.
- [Retirement transaction](https://sepolia.etherscan.io/tx/0x08f34d3daf33c6516f7b4907b161ef8dbbb24353708ac6d472e4f32615bde1ec).
- [Public verification snapshot](/sepolia-chain-verification.json).

The browser simulation remains separate from real testnet interaction. Downloaded HTML is not authoritative; check contract state. No environmental certification, independent security audit, or production-asset readiness is claimed. Multisig and timelock remain separate primitives.

Frontend integration: the verified manifest and bilingual deployment/evidence links are updated. Public website publication is recorded separately after deployment verification.

## Website publication

Published to https://carbon-credit-seven.vercel.app/ as `dpl_2PyaAggNAK2kPJ7ydgTGFt8e4nKv`. Anonymous index, compiled address configuration and public verification snapshot pass. Local bilingual checks pass. GitHub source sync and explorer source verification were not performed in this task.
