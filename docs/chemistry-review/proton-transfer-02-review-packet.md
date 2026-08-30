# Chemistry Review Packet: `proton_transfer_02`

## Review status

- Fixture status: `draft`
- Automated fixture integrity: passing locally
- Independent chemistry review: pending
- Production catalog: excluded until `review.status` becomes `verified`

## Scope under review

This fixture represents one authored proton-transfer event:

```text
CH3O− + CH3NH3+ → CH3OH + CH3NH2
```

Accepted arrow bundle:

```text
methoxide oxygen lone pair → mapped ammonium hydrogen
original N–H bond pair → nitrogen
```

The fixture represents Lewis-structure electron bookkeeping for the mapped transfer. It does not model counterions, solvent rearrangement, kinetics, or equilibrium populations.

## Authored Lewis-structure inventory

| State | Atom ID | Species role | Formal charge | Lone pairs | Implicit H | Bond-order sum |
|---|---|---|---:|---:|---:|---:|
| Reactants | `c_methoxide` | Methoxide methyl carbon | 0 | 0 | 3 | 4 |
| Reactants | `o_base` | Methoxide oxygen | −1 | 3 | 0 | 1 |
| Reactants | `h_transfer` | Mapped N–H proton | 0 | 0 | 0 | 1 |
| Reactants | `n_acid` | Methylammonium nitrogen | +1 | 0 | 2 | 4 |
| Reactants | `c_ammonium` | Methylammonium carbon | 0 | 0 | 3 | 4 |
| Products | `c_methoxide` | Methanol methyl carbon | 0 | 0 | 3 | 4 |
| Products | `o_base` | Methanol oxygen | 0 | 2 | 0 | 2 |
| Products | `h_transfer` | Mapped O–H proton | 0 | 0 | 0 | 1 |
| Products | `n_acid` | Methylamine nitrogen | 0 | 1 | 2 | 3 |
| Products | `c_ammonium` | Methylamine carbon | 0 | 0 | 3 | 4 |

Net formal charge is 0 in both states. The mapped hydrogen moves from nitrogen to oxygen; no atom is created or removed.

## Negative-case contract

| Negative case | Draft defect | Expected classification | Primary reason |
|---|---|---|---|
| `methoxide_methylammonium_protonation_only` | O–H formation without N–H cleavage | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `methoxide_methylammonium_cleavage_only` | N–H cleavage without proton acceptance | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `methoxide_methylammonium_wrong_bond_direction` | N–H pair sent to hydrogen | `not_accepted_path` | `WRONG_BOND_DIRECTION` |
| `methoxide_methylammonium_wrong_acceptor` | Oxygen pair aimed at nitrogen | `not_accepted_path` | `NOT_IN_AUTHORED_PATH` |

## Sources

1. [IUPAC Gold Book: proton transfer reaction](https://doi.org/10.1351/goldbook.P04915) defines transfer of a proton from one binding site to another and distinguishes the transfer event from the complete solution process.
2. [OpenStax Organic Chemistry 2.10](https://openstax.org/books/organic-chemistry/pages/2-10-organic-acids-and-organic-bases) describes alkoxide oxygen as a base site and methylamine as an organic base.
3. [OpenStax Organic Chemistry 24.5](https://openstax.org/books/organic-chemistry/pages/24-5-biological-amines-and-the-henderson-hasselbalch-equation) identifies methylammonium as methylamine's conjugate acid and provides aqueous pKa context.

## Reviewer decisions needed

- [ ] Confirm formal charges, lone-pair counts, implicit hydrogens, and stable atom mapping.
- [ ] Confirm both accepted arrow origins and destinations.
- [ ] Confirm the chosen reactant/product direction and scope language are suitable for the teaching context.
- [ ] Confirm the scaffold and four negative-case messages are accurate.
- [ ] Approve, request changes, or reject the fixture for the production catalog.

Reviewer role: ____________________

Disposition and notes: ____________________
