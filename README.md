# dino

live link https://dino-iyig.onrender.com/

**DinoGems Wallet**

Simple wallet system built with Node.js + Supabase.
It supports add balance, spend, and stress testing.

---

## This project is mainly for:

- testing DB writes
- testing concurrency
- testing recovery using buffer + worker

## What this project does

Keeps wallet balance using ledger entries

Uses one user wallet and one treasury wallet

Handles concurrent writes safely

If DB fails, writes data to JSON files

A worker later processes those JSON files

Can stress test with 10,000+ operations

---

## Running it
```bash
npm run worker
npm run stress:system
```

Output:
```
Processed 10000/10000 | DB=7020 | BUFFER=2980
```

## Testing
```bash
npm test
```

---

## Docker (optional)
```bash
docker compose up --build
```

Runs:
- API
- Worker

Both auto-restart if they crash.

---

## Important notes

- Use `npm start`, not `npm run dev`, during stress tests
- Buffer files are temporary
- Ledger is append-only
- DB is the source of truth

---

**That's it**

This project is meant to:
- be simple
- show correctness
- survive heavy load

No over-engineering. Just works.