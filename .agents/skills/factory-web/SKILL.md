---
name: factory-web
description: Bring the App Factory web console (orchestration UI on localhost:4620) and its tailscale serve exposure up or down on command, and check whether it is running. Use when asked to start, stop, restart, or check the factory web console, web UI, orchestration dashboard, or its tailnet/phone access.
---

# Factory web console up/down

The console serves the orchestration UI + API on `http://127.0.0.1:4620`
(founder-only; token persisted at `orchestration/web/.token`).

## Bring up

```bash
~/src/app-factory/orchestration/bin/factory-web-up
```

Idempotent: skips the server if port 4620 already answers, otherwise starts it
detached (survives the session; logs to `orchestration/web/server.log`), then
registers `tailscale serve --bg` for phone access over the tailnet. Prints one
status line; relay it to the founder.

If it reports tailnet "skipped — enable HTTPS certificates": that is a one-time
founder action at https://login.tailscale.com/admin/dns; `tailscale serve`
hangs forever without it, so the script deliberately does not attempt it.

## Bring down

```bash
~/src/app-factory/orchestration/bin/factory-web-down
```

Kills the server on port 4620 and runs `tailscale serve reset` (only when a
serve config exists).

## Check

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4620/   # 200 = up
tailscale serve status
```

## Notes

- Restart = down then up. Rebuild the frontend after UI changes with
  `~/src/app-factory/orchestration/bin/factory-web --rebuild` (stop first).
- Do not print the contents of `orchestration/web/.token` unless the founder
  asks for the token.
