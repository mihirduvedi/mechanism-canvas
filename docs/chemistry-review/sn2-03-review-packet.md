# Chemistry Review Packet: `sn2_03`

## Review status

- Fixture status: `draft`
- Automated fixture integrity: passing locally
- Independent chemistry review: pending
- Production catalog: excluded until `review.status` becomes `verified`

## Scope under review

This fixture represents one authored primary-substrate SN2 pathway:

```text
CH3O− + CH3CH2Br → CH3OCH2CH3 + Br−
```

Accepted arrow bundle:

```text
methoxide oxygen lone pair → carbon bearing bromine
C–Br bond pair → bromine
```

The exercise does not specify conditions or predict a substitution-versus-elimination product ratio. It exists to test whether the learner can find the electrophilic carbon in a larger primary substrate and account for the complete arrow bundle.

## Authored Lewis-structure inventory

| State | Atom ID | Species role | Formal charge | Lone pairs | Implicit H | Bond-order sum |
|---|---|---|---:|---:|---:|---:|
| Reactants | `c_methoxide` | Methoxide methyl carbon | 0 | 0 | 3 | 4 |
| Reactants | `o_nucleophile` | Methoxide oxygen | −1 | 3 | 0 | 1 |
| Reactants | `c_substituent` | Ethyl terminal carbon | 0 | 0 | 3 | 4 |
| Reactants | `c_electrophile` | Carbon bearing bromine | 0 | 0 | 2 | 4 |
| Reactants | `br_leaving` | Covalent bromine | 0 | 3 | 0 | 1 |
| Products | `c_methoxide` | Ether methyl carbon | 0 | 0 | 3 | 4 |
| Products | `o_nucleophile` | Ether oxygen | 0 | 2 | 0 | 2 |
| Products | `c_substituent` | Ethyl terminal carbon | 0 | 0 | 3 | 4 |
| Products | `c_electrophile` | Ether ethyl carbon | 0 | 0 | 2 | 4 |
| Products | `br_leaving` | Bromide | −1 | 4 | 0 | 0 |

Net formal charge is −1 in both states. The C–C bond and all atom identities remain unchanged.

## Negative-case contract

| Negative case | Draft defect | Expected classification | Primary reason |
|---|---|---|---|
| `sn2_methoxide_ethyl_attack_only` | C–O formation without C–Br cleavage | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `sn2_methoxide_ethyl_reversed_departure` | C–Br pair sent to carbon | `not_accepted_path` | `WRONG_LEAVING_GROUP_DIRECTION` |
| `sn2_methoxide_ethyl_duplicate_source` | Same oxygen pair used twice | `invalid_invariant` | `DUPLICATE_ELECTRON_SOURCE` |
| `sn2_methoxide_ethyl_wrong_reaction_center` | Oxygen pair aimed at bromine | `not_accepted_path` | `NOT_IN_AUTHORED_PATH` |

## Sources

1. [OpenStax Organic Chemistry 18.2](https://openstax.org/books/organic-chemistry/pages/18-2-preparing-ethers) describes Williamson ether synthesis as alkoxide SN2 attack on a primary alkyl halide or tosylate.
2. [OpenStax Organic Chemistry 11.3](https://openstax.org/books/organic-chemistry/pages/11-3-characteristics-of-the-sn2-reaction) identifies primary substrates such as bromoethane as accessible to SN2 attack and explains the steric and solvent boundaries.

## Reviewer decisions needed

- [ ] Confirm formal charges, lone-pair counts, implicit hydrogens, and atom mapping.
- [ ] Confirm the represented bundle is appropriate for the deliberately bounded pathway.
- [ ] Confirm the conditions/product-distribution disclaimer is sufficient.
- [ ] Confirm the scaffold and negative-case language do not imply SN2 exclusivity in every setting.
- [ ] Approve, request changes, or reject the fixture for the production catalog.

Reviewer role: ____________________

Disposition and notes: ____________________
