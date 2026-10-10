# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for a security vulnerability.

Use GitHub's private reporting: the repository's **Security** tab → **Report a vulnerability**
(<https://github.com/roosveltkn/cover-studio/security/advisories/new>).

If you can, include a description of the problem, steps to reproduce it, the affected version or
commit, and the estimated impact.

You will get a reply within 7 days. Once the vulnerability is fixed, we disclose it publicly and
credit the reporter if they wish.

## Scope

Cover Studio is a static site that processes images in the browser. Relevant topics include, for
example, XSS, unsafe handling of imported files, and vulnerable dependencies.

The optional URL capture service (`capture/`, see [docs/CAPTURE.md](./docs/CAPTURE.md)) loads
visitor-supplied addresses in a headless Chrome: any way around its address filter (SSRF to a
private or local network, DNS rebinding, redirects) is in scope.

## Supported versions

Only the latest version released on the `main` branch is supported.
