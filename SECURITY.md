# Security Policy

## Supported versions

This project is early-stage. Security fixes target the default branch.

## Reporting a vulnerability

Please do not file public issues for vulnerabilities that could expose users, camera privacy, authentication state, or stored session data.

If GitHub Security Advisories are enabled for the repository, use a private advisory. Otherwise, contact the maintainers privately and include:

- Affected version or commit
- Steps to reproduce
- Expected impact
- Any suggested fix

## Sensitive data

Do not commit local credentials or deployment metadata. In particular, keep `.env.local`, `.mcp.json`, Firebase service account files, private keys, and extension signing keys out of Git.
