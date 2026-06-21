# Task 4 Report: Integrate Permission System into App.tsx

## What I implemented
- Added imports for Bidang, Role, Permission, RolePermission types and permissionChecker
- Added state variables: bidangList, userBidangId, rolesList, permissionsList
- Extracted fetchAudits to component-level useCallback with bidang filtering via permissionChecker.getScope('audit.view')
- Added separate useEffect for fetchAudits + realtime subscription (depends on fetchAudits ref to handle closure)
- Modified target_entities fetch to filter by bidang_id based on entity.view scope
- Added permission checker setup in auth handler (sets user role_id + bidang_id in permissionChecker)
- Added RBAC data loading (bidang, roles, permissions, role_permissions) in auth handler
- Added bidang_id to sync upsert payload
- Added useRef import for ref-based approach

## Files changed
- `src/App.tsx` (+104, -52)

## Test results (lint output)
```
> react-example@0.0.0 lint
> tsc --noEmit
```
No errors.

## Self-review findings
- fetchAudits was originally defined inside the mount useEffect closure, which made it inaccessible from the auth effect. Moved to component-level useCallback with [userBidangId] dependency.
- The realtime subscription initially captured the old fetchAudits reference. Fixed by extracting subscription into a separate useEffect with [fetchAudits] dependency, so it re-subscribes with the latest callback when userBidangId changes.
- The initial getSession() block (lines ~373-393) does NOT include RBAC loading — this is acceptable since onAuthStateChange fires with INITIAL_SESSION on subscription, covering both initial and subsequent auth states.
- userBidangId is used as a dependency for fetchAudits useCallback, ensuring fresh re-fetch when the bidang scope changes (e.g., admin switching bidang).

## Concerns
- The initial audit fetch (before auth resolves) fetches all audits unfiltered. Once auth resolves and userBidangId is set, the fetchAudits effect re-fires with the correct filter.
- The getSession block in the auth effect also fetches profiles redundantly alongside onAuthStateChange — this is pre-existing behavior, not introduced here.
