# Changelog

## 1.0.0

- Implemented Sprint 1 backend from the LeanStock blueprint.
- Auth response includes both `accessToken` and `refreshToken`. The original OpenAPI `AuthTokens` schema only displayed `accessToken`; refresh token is required by the milestone and is documented in the served OpenAPI file.
- Product list uses cursor-based pagination (`cursor`, `limit`) to satisfy the sprint requirement, while keeping `page` compatibility from the blueprint.
