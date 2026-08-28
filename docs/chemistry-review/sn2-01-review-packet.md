# Chemistry Review Packet: `sn2_01`

## Review status

- Fixture status: `draft`
- Automated fixture integrity: passed on August 28, 2026
- Independent chemistry review: pending
- Production catalog: excluded until `review.status` becomes `verified`

## Scope under review

This fixture represents one authored SN2 elementary step:

```text
HO− + CH3Br → CH3OH + Br−
```

The exercise asks for two arrows in one atomic bundle:

```text
oxygen lone pair → methyl carbon
C–Br bond pair → bromine
```

The fixture does not model solvent, concentration, rate, transition-state geometry, or a reaction-energy surface. Stereochemical inversion is not claimed because bromomethane is achiral and the current domain type has no stereochemical descriptor.

## Authored states

### Reactants: `sn2_reactants`

| Atom ID | Display | Element | Formal charge | Lone pairs | Implicit H | Bond-order sum |
|---|---|---:|---:|---:|---:|---:|
| `h_hydroxide` | H1 | H | 0 | 0 | 0 | 1 |
| `o_nucleophile` | O1 | O | −1 | 3 | 0 | 1 |
| `c_electrophile` | C1 | C | 0 | 0 | 3 | 4 |
| `br_leaving` | Br1 | Br | 0 | 3 | 0 | 1 |

Net formal charge: −1.

Authored bonds: H1–O1 and C1–Br1, both order 1.

### Products: `sn2_products`

| Atom ID | Display | Element | Formal charge | Lone pairs | Implicit H | Bond-order sum |
|---|---|---:|---:|---:|---:|---:|
| `h_hydroxide` | H1 | H | 0 | 0 | 0 | 1 |
| `o_nucleophile` | O1 | O | 0 | 2 | 0 | 2 |
| `c_electrophile` | C1 | C | 0 | 0 | 3 | 4 |
| `br_leaving` | Br1 | Br | −1 | 4 | 0 | 0 |

Net formal charge: −1.

Authored bonds: H1–O1 and O1–C1, both order 1.

## Accepted transition

The accepted bundle consumes any displayed lone pair on `o_nucleophile` and the electron pair in `bond_c_br`. The deterministic transform creates O1–C1, removes C1–Br1, reduces oxygen from three lone pairs to two, and increases bromine from three lone pairs to four. The resulting canonical state signature must match `sn2_products` exactly.

## Scaffold ladder

1. **Start at electrons:** identify the species that can donate a pair.
2. **Find the electrophile:** connect an oxygen lone pair to the carbon bonded to bromine.
3. **Account for the octet:** return the C–Br bond pair to bromine in the same step.
4. **Show the complete bundle:** preview both arrows without editing the learner's draft.

## Negative cases

| Case | Draft | Expected classification | Primary reason |
|---|---|---|---|
| `sn2_attack_only` | O lone pair → C | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `sn2_reversed_departure` | O lone pair → C; C–Br bond → C | `not_accepted_path` | `WRONG_LEAVING_GROUP_DIRECTION` |
| `sn2_duplicate_source` | Same O lone pair used for two arrows | `invalid_invariant` | `DUPLICATE_ELECTRON_SOURCE` |
| `sn2_wrong_reaction_center` | O lone pair → Br; C–Br bond → Br | `not_accepted_path` | `NOT_IN_AUTHORED_PATH` |

## Sources

1. [IUPAC Gold Book: nucleophilic substitution](https://doi.org/10.1351/goldbook.08191). The entry defines the entering group, electrophilic substrate, and electron-pair retention by the leaving group. Its example is bromomethane plus hydroxide.
2. [OpenStax Organic Chemistry 11.2: The SN2 Reaction](https://openstax.org/books/organic-chemistry/pages/11-2-the-sn2-reaction). The section presents hydroxide plus bromomethane yielding methanol and bromide as a single concerted substitution.

## Reviewer decisions needed

- [ ] Confirm all formal charges, lone-pair counts, and atom mappings.
- [ ] Confirm the two accepted arrow origins and destinations.
- [ ] Confirm the prompt is narrow enough for the represented conditions.
- [ ] Confirm the four feedback paths are accurate and do not overgeneralize.
- [ ] Consider whether any additional arrow bundle should be accepted as equivalent.
- [ ] Approve, request changes, or reject the fixture for the production catalog.

Reviewer role: ____________________

Disposition and notes: ____________________
