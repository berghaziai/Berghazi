# Berghazi Firestore Security Specification (Phase 0)

## Data Invariants
1. **Main Administrator Sovereignty**: Only `berghazi9@gmail.com` (with `email_verified == true`) is the Main Administrator. No user can elevate their own `role`, `permissions`, `subscriptionTier`, or clear `isSuspended`.
2. **PII Isolation**: Private user records (`/users/{uid}`) containing emails and school metadata can only be read by the account owner, Main Admin, or an Assistant Admin explicitly granted `manageUsers`. Public author information lives in `/public_profiles/{uid}` without PII.
3. **Official Lesson & Template Integrity**: Ordinary members, permanent members, page writers, and visitors can NEVER create, update, or delete `/lessons` or `/document_templates`. Only Main Admin or Assistant Admins with explicit `manageLessons` / `manageDocuments` permissions can write them.
4. **Research Moderation Gate**: Standard members and writers cannot publish pre-approved articles unless they hold `publishDirectly` or admin moderation permission; all standard submissions must enter with `status == 'pending'`.
5. **Atomicity & Anti-Forgery**: Likes and comments require verified auth (`email_verified == true`), match `request.auth.uid`, enforce strict `affectedKeys().hasOnly(...)` on updates, and require atomic batch synchronization (`existsAfter`) when incrementing `likesCount`.
6. **Immutable Audit Trail**: `/audit_logs` cannot be updated or deleted by anyone, including admins.

## Dirty Dozen Adversarial Payloads
1. **Self-Admin Escalation**: `POST /users/attacker` with `role: 'main_admin'` -> `PERMISSION_DENIED`.
2. **Permission Injection on Profile Update**: `PATCH /users/attacker` with `permissions: { manageLessons: true }` -> `PERMISSION_DENIED`.
3. **Unverified Email Spoofing**: Unverified token claiming `email: 'berghazi9@gmail.com'` with `email_verified: false` -> `PERMISSION_DENIED`.
4. **Cross-User PII Read**: `GET /users/victimUid` by an ordinary member -> `PERMISSION_DENIED`.
5. **Unauthorized Lesson Creation**: Ordinary member creating `/lessons/fake_lesson` -> `PERMISSION_DENIED`.
6. **Unauthorized Template Deletion**: Page writer deleting `/document_templates/tpl_1` -> `PERMISSION_DENIED`.
7. **Pre-Approved Research Bypass**: Permanent member creating `/research_articles/art_1` with `status: 'approved'` -> `PERMISSION_DENIED`.
8. **Shadow Field Injection on Update**: Author updating `/research_articles/art_1` with `{ title: 'New', likesCount: 9999 }` -> `PERMISSION_DENIED`.
9. **Resource Poisoning via Oversized ID**: `SET /lessons/<200-char-invalid-id>` -> `PERMISSION_DENIED`.
10. **Orphaned Like Without Article Sync**: Creating `/research_likes/art1_uid` without updating article `likesCount` -> `PERMISSION_DENIED`.
11. **Completed Transaction Spoofing**: User creating `/transactions/tx1` with `status: 'completed'` -> `PERMISSION_DENIED`.
12. **Audit Log Tampering**: Attempting `DELETE /audit_logs/log_1` -> `PERMISSION_DENIED`.
