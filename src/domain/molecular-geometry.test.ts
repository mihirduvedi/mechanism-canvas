import { describe, expect, it } from "vitest";
import { buildMolecularGeometry } from "./molecular-geometry";
import { protonTransferProblem } from "../problems/proton-transfer-01";
import { sn2Problem } from "../problems/sn2-01";

describe("VSEPR-aware molecular geometry", () => {
  it("expands methyl hydrogens into a tetrahedral carbon environment", () => {
    const model = buildMolecularGeometry(sn2Problem.states.sn2_reactants);
    const carbon = model.atomGeometry.find((entry) => entry.atomId === "c_electrophile");
    expect(model.atoms.filter((atom) => atom.virtual && atom.sourceAtomId === "c_electrophile")).toHaveLength(3);
    expect(carbon).toMatchObject({
      electronDomainCount: 4,
      electronGeometry: "tetrahedral",
      molecularGeometry: "tetrahedral",
      bondedAtomCount: 4,
    });
    expect(carbon?.meanBondAngle).toBeCloseTo(109.47, 1);
  });

  it("renders every authored lone pair as a three-dimensional electron domain", () => {
    const reactants = buildMolecularGeometry(sn2Problem.states.sn2_reactants);
    const products = buildMolecularGeometry(sn2Problem.states.sn2_products);
    expect(reactants.lonePairs).toHaveLength(6);
    expect(products.lonePairs).toHaveLength(6);
    expect(products.lonePairs.filter((pair) => pair.atomId === "br_leaving")).toHaveLength(4);
  });

  it("derives a bent oxygen center and directs bond polarity toward oxygen", () => {
    const model = buildMolecularGeometry(sn2Problem.states.sn2_products);
    const oxygen = model.atomGeometry.find((entry) => entry.atomId === "o_nucleophile");
    const carbonOxygen = model.bonds.find((bond) => bond.id === "bond_o_c");
    expect(oxygen).toMatchObject({
      electronDomainCount: 4,
      electronGeometry: "tetrahedral",
      molecularGeometry: "bent",
      lonePairCount: 2,
    });
    expect(oxygen?.meanBondAngle).toBeCloseTo(109.47, 1);
    expect(carbonOxygen?.negativeEndAtomId).toBe("o_nucleophile");
    expect(carbonOxygen?.electronegativityDelta).toBeCloseTo(0.89, 2);
  });

  it("keeps disconnected species separated and all coordinates finite", () => {
    const model = buildMolecularGeometry(sn2Problem.states.sn2_reactants);
    const oxygen = model.atoms.find((atom) => atom.id === "o_nucleophile")!;
    const carbon = model.atoms.find((atom) => atom.id === "c_electrophile")!;
    expect(Math.abs(carbon.position.x - oxygen.position.x)).toBeGreaterThan(3);
    for (const atom of model.atoms) {
      expect(Number.isFinite(atom.position.x)).toBe(true);
      expect(Number.isFinite(atom.position.y)).toBe(true);
      expect(Number.isFinite(atom.position.z)).toBe(true);
    }
  });

  it("changes ammonia and hydronium geometry into ammonium and water", () => {
    const reactants = buildMolecularGeometry(
      protonTransferProblem.states.proton_transfer_reactants,
    );
    const products = buildMolecularGeometry(
      protonTransferProblem.states.proton_transfer_products,
    );
    const reactantNitrogen = reactants.atomGeometry.find((entry) => entry.atomId === "n_base");
    const reactantOxygen = reactants.atomGeometry.find((entry) => entry.atomId === "o_acid");
    const productNitrogen = products.atomGeometry.find((entry) => entry.atomId === "n_base");
    const productOxygen = products.atomGeometry.find((entry) => entry.atomId === "o_acid");

    expect(reactantNitrogen).toMatchObject({
      electronDomainCount: 4,
      molecularGeometry: "trigonal pyramidal",
      lonePairCount: 1,
    });
    expect(reactantOxygen).toMatchObject({
      electronDomainCount: 4,
      molecularGeometry: "trigonal pyramidal",
      lonePairCount: 1,
    });
    expect(productNitrogen).toMatchObject({
      electronDomainCount: 4,
      molecularGeometry: "tetrahedral",
      lonePairCount: 0,
    });
    expect(productOxygen).toMatchObject({
      electronDomainCount: 4,
      molecularGeometry: "bent",
      lonePairCount: 2,
    });
    expect(reactants.atoms).toHaveLength(8);
    expect(products.atoms).toHaveLength(8);
    expect(products.atoms.every((atom) => Number.isFinite(atom.position.z))).toBe(true);
  });
});
