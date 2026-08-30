# Chemistry Review Packet: `sn2_02`

## Review status

- Fixture status: `draft`
- Automated fixture integrity: passing locally
- Independent chemistry review: pending
- Production catalog: excluded until `review.status` becomes `verified`

## Scope under review

This fixture represents one authored methyl SN2 elementary step:

```text
CH3O− + CH3Br → CH3OCH3 + Br−
```

Accepted arrow bundle:

```text
methoxide oxygen lone pair → methyl carbon
C–Br bond pair → bromine
```

The exercise does not model counterions, solvent, concentration, rate, transition-state geometry, or a reaction-energy surface.

## Authored Lewis-structure inventory

| State | Atom ID | Species role | Formal charge | Lone pairs | Implicit H | Bond-order sum |
|---|---|---|---:|---:|---:|---:|
| Reactants | `c_methoxide` | Methoxide methyl carbon | 0 | 0 | 3 | 4 |
| Reactants | `o_nucleophile` | Methoxide oxygen | −1 | 3 | 0 | 1 |
| Reactants | `c_electrophile` | Bromomethane carbon | 0 | 0 | 3 | 4 |
| Reactants | `br_leaving` | Covalent bromine | 0 | 3 | 0 | 1 |
| Products | `c_methoxide` | Ether methyl carbon | 0 | 0 | 3 | 4 |
| Products | `o_nucleophile` | Ether oxygen | 0 | 2 | 0 | 2 |
| Products | `c_electrophile` | Ether methyl carbon | 0 | 0 | 3 | 4 |
| Products | `br_leaving` | Bromide | −1 | 4 | 0 | 0 |

Net formal charge is −1 in both states. Atom identities are stable across the transition.

## Authored teaching contract

The scaffold progresses from locating methoxide's electron pair, to identifying the methyl carbon, to accounting for carbon's octet, to a non-mutating preview of both arrows. The deterministic validator accepts the bundle only when its transformed state and canonical arrows match the authored transition.

| Negative case | Draft defect | Expected classification | Primary reason |
|---|---|---|---|
| `sn2_methoxide_methyl_attack_only` | C–O formation without C–Br cleavage | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `sn2_methoxide_methyl_reversed_departure` | C–Br pair sent to carbon | `not_accepted_path` | `WRONG_LEAVING_GROUP_DIRECTION` |
| `sn2_methoxide_methyl_duplicate_source` | Same oxygen pair used twice | `invalid_invariant` | `DUPLICATE_ELECTRON_SOURCE` |
| `sn2_methoxide_methyl_wrong_reaction_center` | Oxygen pair aimed at bromine | `not_accepted_path` | `NOT_IN_AUTHORED_PATH` |

## Sources

1. [OpenStax Organic Chemistry 11.3](https://openstax.org/books/organic-chemistry/pages/11-3-characteristics-of-the-sn2-reaction) lists methoxide plus bromomethane yielding dimethyl ether and bromide in its SN2 nucleophile table.
2. [OpenStax Organic Chemistry 18.2](https://openstax.org/books/organic-chemistry/pages/18-2-preparing-ethers) describes Williamson ether synthesis as an alkoxide reacting with a primary alkyl halide or tosylate through SN2.

## Reviewer decisions needed

- [ ] Confirm formal charges, lone-pair counts, implicit hydrogens, and atom mapping.
- [ ] Confirm both accepted arrow origins and destinations.
- [ ] Confirm the scope note avoids overclaiming reaction conditions or kinetics.
- [ ] Confirm the scaffold and four feedback paths are accurate.
- [ ] Consider any equivalent arrow bundle or alternative that the fixture should represent.
- [ ] Approve, request changes, or reject the fixture for the production catalog.

Reviewer role: ____________________

Disposition and notes: ____________________
