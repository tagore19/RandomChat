---
name: security-audit
description: Cloudflare Security Audit Skill. Guides defensive code review through a 6-phase structured workflow (Reconnaissance, Hunting, Validation, Findings Ledger, Schema Check, and Remediation).
---

# Cloudflare Security Audit Skill

A structured, evidence-based methodology for defensive vulnerability identification, attack surface mapping, and code remediation.

## The 6-Phase Lifecycle

### Phase 1: Reconnaissance & Trust Boundary Mapping
- Identify all untrusted entry points (WebSockets, HTTP routes, query params, headers, local storage).
- Trace data flow paths from external intake to memory storage and client rendering.
- Map state persistence (in-memory Maps/Sets, caches, databases) and lifecycle teardowns.

### Phase 2: Hunting Across Core Attack Classes
- **Web & Protocol**: CORS policies, origin validation, transport security, HTTP buffer limits.
- **Denial of Service (DoS) & Memory Leaks**: In-memory Map/Set unbounded growth, connection cycling, rate limiter bypass.
- **Client-Side & DOM Injection**: Stored/Reflected XSS, data-URI SVG injection in `<img>` tags, script execution.
- **Session & Concurrency**: Race conditions on rapid pairing/skipping, orphaned socket pointers.

### Phase 3: Candidate Validation & Counter-Hypothesis
- Challenge each candidate finding: Can the vulnerability actually be reached under real runtime constraints?
- Differentiate between genuine flaws and theoretical non-issues.

### Phase 4: Structured Findings Recording
Record verified issues with:
- Target file & line numbers
- Vulnerability description & impact
- Severity (Critical, High, Medium, Low)
- Remediation strategy

### Phase 5: Defensive Remediation & Patching
- Apply defensive code fixes (sanitization, rate-limit Map pruning, MIME type enforcement, strict CORS).

### Phase 6: Verification & Regression Testing
- Re-run test suites to verify that fixes eliminate the security risk while maintaining full product functionality.
