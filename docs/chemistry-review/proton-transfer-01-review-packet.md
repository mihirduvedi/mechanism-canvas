# Chemistry Review Packet: `proton_transfer_01`

## Review status

- Fixture status: `verified`
- Review completed: August 29, 2026
- Automated fixture integrity: passing
- Production catalog: included

## Scope under review

This fixture represents one authored Brønsted acid–base elementary step:

```text
NH3 + H3O+ → NH4+ + H2O
```

The labeled hydrogen `h_transfer` remains the same atom before and after transfer. The accepted arrow bundle is:

```text
nitrogen lone pair → transferred hydrogen
original O–H bond pair → oxygen
```

The exercise isolates Lewis structures and electron bookkeeping. It does not model explicit solvent organization, equilibrium populations, proton-transfer kinetics, or a reaction-energy surface.

## Authored states

### Reactants: `proton_transfer_reactants`

| Atom ID | Display | Element | Formal charge | Lone pairs | Implicit H | Explicit bond-order sum | Total bond-order sum |
|---|---|---:|---:|---:|---:|---:|---:|
| `n_base` | N1 | N | 0 | 1 | 3 | 0 | 3 |
| `h_transfer` | H1 | H | 0 | 0 | 0 | 1 | 1 |
| `o_acid` | O1 | O | +1 | 1 | 2 | 1 | 3 |

Net formal charge: +1.

Authored explicit bond: O1–H1, order 1. The remaining ammonia and hydronium hydrogens are fixture-authored implicit bonds.

### Products: `proton_transfer_products`

| Atom ID | Display | Element | Formal charge | Lone pairs | Implicit H | Explicit bond-order sum | Total bond-order sum |
|---|---|---:|---:|---:|---:|---:|---:|
| `n_base` | N1 | N | +1 | 0 | 3 | 1 | 4 |
| `h_transfer` | H1 | H | 0 | 0 | 0 | 1 | 1 |
| `o_acid` | O1 | O | 0 | 2 | 2 | 0 | 2 |

Net formal charge: +1.

Authored explicit bond: N1–H1, order 1. The oxygen retains two implicit hydrogens and becomes water.

## Accepted transition

The accepted bundle consumes `lp_n_1` and the electron pair in `bond_o_h_transfer`. The deterministic transform creates N1–H1, removes O1–H1, removes nitrogen's lone pair, adds a second lone pair to oxygen, and recalculates the +1 formal charge on nitrogen. The resulting canonical state signature must match `proton_transfer_products` exactly.

## Scaffold ladder

1. **Identify acid and base:** locate the available nitrogen lone pair and the transferable hydrogen on hydronium.
2. **Form the new bond:** draw nitrogen lone pair → hydrogen.
3. **Return the old bond pair:** draw O–H bond → oxygen in the same step.
4. **Show the complete transfer:** preview both arrows without editing the learner's draft.

## Negative cases

| Case | Draft | Expected classification | Primary reason |
|---|---|---|---|
| `proton_transfer_attack_only` | N lone pair → H | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `proton_transfer_cleavage_only` | O–H bond → O | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `proton_transfer_wrong_bond_direction` | N lone pair → H; O–H bond → H | `not_accepted_path` | `WRONG_BOND_DIRECTION` |
| `proton_transfer_wrong_acceptor` | N lone pair → O; O–H bond → O | `not_accepted_path` | `NOT_IN_AUTHORED_PATH` |

## Sources

1. [IUPAC Gold Book: Brønsted acid](https://goldbook.iupac.org/terms/view/B00744). The entry defines a Brønsted acid as a molecular entity capable of donating a proton to a base.
2. [OpenStax Organic Chemistry 2.7: Acids and Bases](https://openstax.org/books/organic-chemistry/pages/2-7-acids-and-bases-the-bronsted-lowry-definition). The section explains proton donation and acceptance, conjugate acid–base pairs, and ammonia accepting a proton to form ammonium.
3. [OpenStax Organic Chemistry 6.5: Using Curved Arrows](https://openstax.org/books/organic-chemistry/pages/6-5-using-curved-arrows-in-polar-reaction-mechanisms). The section explains that curved arrows begin at electron sources and show where the pair moves.

## Reviewed decisions

- [x] The explicit/implicit hydrogen representation is appropriate for this teaching prompt.
- [x] Formal charges, lone-pair counts, and stable atom mappings are accurate.
- [x] Both accepted arrow origins and destinations are accurate.
- [x] The directed equation is accurate within the stated scope boundary.
- [x] The four feedback paths and scaffold language are accurate for teaching.
- [x] The represented bundle and accepted alternatives are appropriately bounded.

Disposition: chemistry and teaching content reviewed; approved for the production catalog.
