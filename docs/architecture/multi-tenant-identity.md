# Multi-tenant identity and permission contract

Phase 2 replaces the temporary public owner with authenticated identities. A user may belong to many workspaces, but every request resolves an active workspace only from that user's memberships. Object queries and mutations then bind that workspace ID in SQL. A client-supplied workspace ID is never trusted as authorization.

## Identity and sessions

- Passwords use PBKDF2-SHA-256 with a random salt and 210,000 iterations.
- Session cookies are HTTP-only, Secure, SameSite=Lax and backed by hashed, expiring, revocable database tokens.
- Account recovery uses a one-time recovery code. Recovery rotates that code and revokes every existing session.
- Users can inspect and revoke their active sessions through the sessions API.

## Permission domains

Workspace staff roles and permissions are server-enforced through `requirePermission`. Owners, administrators, website editors, store managers, POS managers, POS staff and support viewers receive explicitly seeded permissions. Owners cannot be demoted or removed through staff-management APIs.

Platform ownership is a separate membership domain and uses `requirePlatformPermission`; it is never inferred from a workspace role. Plugin scopes are also separate. A future plugin grant may request scopes such as `catalog:read`, but those scopes do not make the plugin a staff member and cannot be passed to staff authorization.

## Isolation rule

Tenant-owned reads include `workspace_id = ?`. Mutations that address an object include both its object ID and active workspace ID and return `404` when no scoped row changes. This deliberately does not reveal whether an object exists in another workspace. Membership selection is likewise constrained by both user ID and workspace ID.

The public site resolver and public enquiry endpoint are intentional exceptions: they resolve a workspace from a published public slug and never accept a privileged workspace context. Every merchant mutation authenticates a user and checks a server-side permission.

## Audit rule

Workspace creation and updates, page/content changes, staff invitations and role changes, member removal, submission state changes and POS PIN changes append audit events with actor, workspace, action and target. Audit reads are workspace-scoped and require `audit.read`.

## Future POS PIN boundary

Staff PINs are optional secondary credentials for a signed-in staff identity. PIN verification requires `pos.sell`, and PIN management requires `pos.manage`. A PIN is not a replacement for the main user session and cannot select a different workspace.
