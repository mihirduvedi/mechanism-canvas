# Chemistry Review Packet: `ammonia_alkylation_01`

## Review status

- Fixture status: `verified`
- Review completed: August 29, 2026
- Automated fixture integrity: passing
- Production catalog: included

## Scope under review

This capstone separates ammonia alkylation into two authored elementary steps:

```text
2 NH3 + CH3Br → [CH3NH3]+ Br− + NH3 → CH3NH2 + [NH4]+ Br−
```

Step 1 is an SN2 substitution:

```text
N1 lone pair → C1
C1–Br1 bond pair → Br1
```

Step 2 is deprotonation of the methylammonium intermediate by the second ammonia molecule:

```text
N2 lone pair → mapped H1
original N1–H1 bond pair → N1
```

The fixture teaches atom mapping, charge bookkeeping, and state-to-state mechanism history. It does not model solvent, equilibria, kinetics, reaction energetics, or competing alkylations. Direct alkylation of ammonia can continue beyond a primary amine; the exercise deliberately isolates only the first substitution and deprotonation.

## Authored states

### Reactants: `amine_reactants`

| Atom ID | Display | Element | Formal charge | Lone pairs | Implicit H | Explicit bond-order sum | Total bond-order sum |
|---|---|---:|---:|---:|---:|---:|---:|
| `n_attacker` | N1 | N | 0 | 1 | 2 | 1 | 3 |
| `h_transfer` | H1 | H | 0 | 0 | 0 | 1 | 1 |
| `c_methyl` | C1 | C | 0 | 0 | 3 | 1 | 4 |
| `br_leaving` | Br1 | Br | 0 | 3 | 0 | 1 | 1 |
| `n_base` | N2 | N | 0 | 1 | 3 | 0 | 3 |

Net formal charge: 0.

Authored explicit bonds: N1–H1 and C1–Br1, both order 1.

### Intermediate: `methylammonium_intermediate`

| Atom ID | Display | Element | Formal charge | Lone pairs | Implicit H | Explicit bond-order sum | Total bond-order sum |
|---|---|---:|---:|---:|---:|---:|---:|
| `n_attacker` | N1 | N | +1 | 0 | 2 | 2 | 4 |
| `h_transfer` | H1 | H | 0 | 0 | 0 | 1 | 1 |
| `c_methyl` | C1 | C | 0 | 0 | 3 | 1 | 4 |
| `br_leaving` | Br1 | Br | −1 | 4 | 0 | 0 | 0 |
| `n_base` | N2 | N | 0 | 1 | 3 | 0 | 3 |

Net formal charge: 0.

Authored explicit bonds: N1–H1 and C1–N1, both order 1.

### Products: `amine_products`

| Atom ID | Display | Element | Formal charge | Lone pairs | Implicit H | Explicit bond-order sum | Total bond-order sum |
|---|---|---:|---:|---:|---:|---:|---:|
| `n_attacker` | N1 | N | 0 | 1 | 2 | 1 | 3 |
| `h_transfer` | H1 | H | 0 | 0 | 0 | 1 | 1 |
| `c_methyl` | C1 | C | 0 | 0 | 3 | 1 | 4 |
| `br_leaving` | Br1 | Br | −1 | 4 | 0 | 0 | 0 |
| `n_base` | N2 | N | +1 | 0 | 3 | 1 | 4 |

Net formal charge: 0.

Authored explicit bonds: C1–N1 and N2–H1, both order 1.

## Accepted transitions

### Step 1: form methylammonium

The accepted bundle consumes `lp_n_attack_1` and the electron pair in `bond_c_br`. The deterministic transform creates C1–N1, removes C1–Br1, removes N1's lone pair, and adds a fourth lone pair to Br1. The resulting canonical state signature must match `methylammonium_intermediate` exactly.

### Step 2: release methylamine

The accepted bundle consumes `lp_n_base_1` and the electron pair in `bond_n_attack_h_transfer`. The transform creates N2–H1, removes N1–H1, removes N2's lone pair, and restores a lone pair to N1. The resulting canonical state signature must match `amine_products` exactly.

## Scaffold ladders

Step 1 progresses from identifying N1 as the nucleophile, to aiming at C1, accounting for the C–Br pair, and finally previewing the complete two-arrow bundle.

Step 2 progresses from reading the charged intermediate, to using N2 as the base, returning the old N1–H1 pair to N1, and finally previewing the complete two-arrow bundle.

## Negative cases

| Case | Draft | Expected classification | Primary reason |
|---|---|---|---|
| `amine_step1_attack_only` | N1 lone pair → C1 | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `amine_step1_departure_only` | C1–Br1 bond → Br1 | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `amine_step1_wrong_bond_direction` | N1 lone pair → C1; C1–Br1 bond → C1 | `not_accepted_path` | `WRONG_LEAVING_GROUP_DIRECTION` |
| `amine_step1_wrong_center` | N1 lone pair → Br1; C1–Br1 bond → Br1 | `not_accepted_path` | `NOT_IN_AUTHORED_PATH` |
| `amine_step2_accept_only` | N2 lone pair → H1 | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `amine_step2_cleave_only` | N1–H1 bond → N1 | `incomplete` | `INCOMPLETE_CONCERTED_STEP` |
| `amine_step2_wrong_bond_direction` | N2 lone pair → H1; N1–H1 bond → H1 | `not_accepted_path` | `WRONG_BOND_DIRECTION` |
| `amine_step2_bromide_base` | Br1 lone pair → H1; N1–H1 bond → N1 | `not_accepted_path` | `NOT_IN_AUTHORED_PATH` |

## Sources

1. [OpenStax Organic Chemistry 11.3: Characteristics of the SN2 Reaction](https://openstax.org/books/organic-chemistry/pages/11-3-characteristics-of-the-sn2-reaction). The comparison table lists ammonia reacting with bromomethane to produce methylammonium through SN2 substitution.
2. [OpenStax Organic Chemistry 24.6: Synthesis of Amines](https://openstax.org/books/organic-chemistry/pages/24-6-synthesis-of-amines). The section describes alkyl-halide SN2 reactions with ammonia, formation of primary amines, and the risk of further alkylation.
3. [University of Calgary Organic Chemistry: alkyl halide plus ammonia](https://www.chem.ucalgary.ca/courses/350/Carey5th/Ch22/ch22-2-1-1.html). The mechanism shows ammonia attack on an alkyl bromide followed by removal of a proton by excess ammonia.

## Reviewed decisions

- [x] Formal charges, lone-pair counts, implicit hydrogens, and atom mappings across all three states are accurate.
- [x] Both accepted arrow bundles and the explicit methylammonium intermediate are accurate.
- [x] The second authored ammonia molecule is appropriate for the bounded teaching scope.
- [x] The overalkylation caveat and other scope boundaries are accurate.
- [x] All eight negative cases and both scaffold ladders are accurate for teaching.
- [x] The represented pathway and accepted alternatives are appropriately bounded.

Disposition: chemistry and teaching content reviewed; approved for the production catalog.
