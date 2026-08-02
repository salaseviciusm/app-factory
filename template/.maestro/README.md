# Maestro E2E flows

Flows live per app (stamped apps get `.maestro/` with onboarding, purchase-sandbox,
and core-journey flows written alongside features — definition of done includes them).

This folder holds the shared flow conventions:

- One YAML flow per user journey, named `<journey>.flow.yaml`.
- Flows assert on user-visible outcomes (text, testID), never implementation details.
- The purchase flow runs against the store sandbox; never against production products.
- CI runs flows on the preview build profile.

Install: `brew install maestro` (or `curl -Ls https://get.maestro.mobile.dev | bash`).
