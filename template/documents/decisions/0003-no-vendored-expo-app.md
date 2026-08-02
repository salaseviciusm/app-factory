# ADR 0003 — The template does not vendor an Expo app

**Status:** accepted · Aug 2026

## Context

Expo ships breaking SDK releases fast. A full Expo app frozen in the template would
bit-rot within months, and every stamped app would start life needing an upgrade.

## Decision

`scripts/stamp-app.sh` runs `create-expo-app@latest` at stamp time and applies the
factory overlay (composition root, design system, observable lib) plus the factory
packages on top. The template owns the opinionated layer; Expo owns the shell scaffold.

## Consequences

- Stamping needs network access and can surface upstream template drift — the
  "template hardening" first task exists to absorb it.
- Apps record their template version in `factory.json`; template upgrades are
  scheduled tasks, not automatic.

**Do not** commit a full Expo app into `template/` to "make stamping offline."
**Do not** pin `create-expo-app` to an old version — drift surfaces early on purpose.
