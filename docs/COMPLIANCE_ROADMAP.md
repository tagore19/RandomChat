# StrangerConnect Compliance & Legal Reference Roadmap

> Reference inspired by OpenTalk / BuddyTalk compliance model. To be finalized and implemented in a later phase.

---

## 1. StrangerConnect Privacy Architecture vs Traditional Chat Apps

| Attribute | OpenTalk / Traditional Chat Apps | StrangerConnect Model |
| :--- | :--- | :--- |
| **Personal Identity** | Collects names, emails, contacts, Facebook profiles | **Zero identity collection (No accounts, 100% anonymous)** |
| **Device & Hardware ID** | Collects device IDs, location, contacts | **Zero persistent identifiers (Ephemeral Socket ID only)** |
| **Chat & Message Storage**| Stored in databases / server logs | **0 bytes stored (In-memory relay, destroyed upon delivery)** |
| **Media & Photos** | Uploaded to cloud buckets (S3 / Cloudinary) | **Client-side WebP compression (<60KB), blurred by default, ephemeral memory relay** |
| **Data Deletion** | Requires manual account deletion request | **Instant & automatic (Everything vanishes the moment a chat ends)** |

---

## 2. Target Policies to Deploy (Future Phase)

### A. Privacy Policy
- **No Personal Data Collected**: Clarify that no names, emails, phone numbers, or passwords are asked or stored.
- **No IP/Chat Logging**: Messages and media are routed peer-to-peer or via volatile RAM; no chat history exists once disconnected.
- **Anonymous Performance Metrics**: PostHog telemetry without PII or screen recordings.
- **Children's Online Privacy Protection Act (COPPA)**: 18+ service (or 13+ with parental consent), no child data knowingly collected.

### B. User-Generated Content (UGC) & Safety Guidelines
- Zero tolerance for illegal, abusive, harassing, or non-consensual sexual content.
- Safe raster validation (SVG/script execution blocked at network boundaries).
- User warning disclaimer on meeting strangers online.

### C. Future Feature Inspirations from OpenTalk
1. **User Reporting & Flagging System**:
   - In-chat "Report Stranger" button with categories: Spam, Harassment, Inappropriate Media.
   - Client-side or IP hash throttling (temporary cooldown for repeatedly reported sessions).
2. **Conversation Topic / Language Filters**:
   - Matching based on interests (e.g. English practice, tech, casual chit-chat).
3. **Gender / Tag Filter Disclaimers**:
   - Disclaimer regarding self-reported tags with auto-remediation reporting.
