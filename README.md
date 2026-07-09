# BitFinite Mempool

A [mempool.space](https://mempool.space)-style explorer for the **BitFinite
(BFX)** network — real-time blocks, a mempool visualizer, transaction-flow
(bowtie) diagrams, fee rates, mining-pool attribution, and a full REST/WebSocket
API.

**Live:** https://mempool.bitfinitechain.org

## Lineage & license

BitFinite Mempool is a fork of Melroy van den Berg's
[**bitcoin-cash-explorer**](https://github.com/BitcoinCash1/bitcoin-cash-explorer)
(the Bitcoin Cash adaptation of mempool.space), re-chained and re-branded for
BitFinite. It is licensed under the **GNU AGPL-3.0** — see [LICENSE](LICENSE) /
[COPYING.md](COPYING.md). Because the AGPL's network clause applies, the source
of this running instance is this repository. Full credit to Melroy van den Berg
and the mempool.space authors.

## Architecture

| Component | Stack | Notes |
|---|---|---|
| Frontend | Angular + SCSS | `frontend/` — two themes (dark = `styles.scss`, light = `theme-light.scss`) |
| Backend | Node/TypeScript (Express) + small Rust `gbt` | `backend/` |
| Database | MariaDB 10.5+ | |
| Chain data | `bitfinited` JSON-RPC + Electrum (electrs/Fulcrum) | |

Key BitFinite-specific change: the **CashAddr codec uses the BFX custom charset**
(`q`↔`f` swap, `bfx:` prefix) across the frontend address/tx utils and the
backend address regex — stock cashaddr libraries do not work unmodified.

## Configuration

Backend config lives in `backend/explorer-config.json`:

- `CORE_RPC` → `bitfinited` (host `127.0.0.1`, port `19769`)
- `ELECTRUM` → electrs (`127.0.0.1:50001`), `BACKEND: "electrum"`
- `DATABASE` → MariaDB
- `POOLS_JSON_URL` → the served `pools-v2.json` (mining-pool coinbase tags)

The node must run with `txindex=1`. See [`backend/`](./backend/) and
[`frontend/`](./frontend/) for developer setup, and [`docker/`](./docker/) for a
Docker deployment.

## Build & deploy

```bash
# frontend production build (single locale)
cd frontend
pnpm install
pnpm run generate-config
npx ng build --configuration=production --localize=false
pnpm run sync-assets
```

Production deploys to the live host use [`scripts/deploy-frontend.sh`](./scripts/deploy-frontend.sh),
which builds and rsyncs the bundle (the nginx vhost is locale-aware and serves
assets from the `en-US/` copy — the script handles this).

The backend (`bitfinite-mempool-api`) is a Node service run under pm2; build the
Rust `gbt` first (`cd rust/gbt && npm run build-release && npm run to-backend`),
then the TypeScript backend, then start it.

## Attribution

Built on [mempool.space](https://github.com/mempool/mempool) →
[bitcoin-cash-explorer](https://github.com/BitcoinCash1/bitcoin-cash-explorer)
(Melroy van den Berg). Licensed under AGPL-3.0.
