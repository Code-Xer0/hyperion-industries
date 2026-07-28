# Forge Build Candidates Contract

`forge-build-candidates/1` is a deterministic, browser-safe public guidance
projection. It describes component classes and capacities, never exact parts,
inventory, compatibility, a quote, or an order.

Use `deriveForgeBuildCandidatesProjection()` from
`shared/intake/forge-build-candidates.js` in both browser and Worker code. The
function accepts a guide bundle hash and a hashed `forge-requirements/1`
projection. It returns zero or three ordered concepts (`lean`, `balanced`,
`headroom`), with a hard maximum of three.

`projection_hash` covers this semantic document:

```text
schema_version
guide_bundle_hash
requirements_projection_hash
preferred_candidate_id
candidates
```

`generated_at` and `projection_hash` are outside the hashed document. Changing
only `generated_at` therefore cannot change `projection_hash`. Candidate IDs
are derived from the requirements projection hash and remain stable for the
same requirements.

The Worker must rederive the projection and reject a mismatched requirements
hash, candidate field, preferred candidate, or projection hash before writing
the immutable held-review submission.
