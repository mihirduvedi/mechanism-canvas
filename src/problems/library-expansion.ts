import type {
  ChemistryReview,
  MoleculeState,
  ProblemDefinition,
  ProblemStepDefinition,
} from "../domain/types";

interface Sn2StepConfig {
  prefix: string;
  title: string;
  fromStateId: string;
  toStateId: string;
  lonePairId: string;
  nucleophileAtomId: string;
  electrophileAtomId: string;
  leavingAtomId: string;
  leavingBondId: string;
  nucleophileName: string;
  leavingGroupName: string;
}

interface ProtonTransferStepConfig {
  prefix: string;
  title: string;
  fromStateId: string;
  toStateId: string;
  lonePairId: string;
  baseAtomId: string;
  transferHydrogenId: string;
  acidAtomId: string;
  acidBondId: string;
  baseName: string;
  acidName: string;
}

function draftReview(
  sources: ChemistryReview["sources"],
): ChemistryReview {
  return {
    status: "draft",
    sources,
    checklist: {
      atomInventory: true,
      bondOrders: true,
      lonePairs: true,
      formalCharges: true,
      netCharge: true,
      arrowOrigins: true,
      arrowDestinations: true,
      concertedStep: true,
      conditionsAndScope: true,
      feedbackLanguage: true,
      alternativesConsidered: false,
    },
  };
}

function sn2Step(config: Sn2StepConfig): ProblemStepDefinition {
  const attack = {
    source: { kind: "lone_pair" as const, entityId: config.lonePairId },
    target: { kind: "atom" as const, entityId: config.electrophileAtomId },
  };
  const departure = {
    source: { kind: "bond" as const, entityId: config.leavingBondId },
    target: { kind: "atom" as const, entityId: config.leavingAtomId },
  };

  return {
    id: `${config.prefix}_substitution`,
    title: config.title,
    fromStateId: config.fromStateId,
    toStateId: config.toStateId,
    acceptedBundles: [[attack, departure]],
    scaffold: [
      {
        level: 1,
        title: "Start at electrons",
        message: `Find the available electron pair on ${config.nucleophileName}. Every curved arrow must begin at a represented lone pair or bond.`,
        focusEntityIds: [config.nucleophileAtomId, config.lonePairId],
        revealsAcceptedBundle: false,
      },
      {
        level: 2,
        title: "Find the electrophile",
        message: `Use ${config.nucleophileName}'s lone pair to attack the carbon bonded to ${config.leavingGroupName}.`,
        focusEntityIds: [config.lonePairId, config.electrophileAtomId],
        revealsAcceptedBundle: false,
      },
      {
        level: 3,
        title: "Keep carbon's octet",
        message: `In the same elementary step, move the carbon–${config.leavingGroupName} bond pair onto ${config.leavingGroupName}.`,
        focusEntityIds: [
          config.electrophileAtomId,
          config.leavingBondId,
          config.leavingAtomId,
        ],
        revealsAcceptedBundle: false,
      },
      {
        level: 4,
        title: "Show the complete bundle",
        message: `Preview: ${config.nucleophileName} lone pair → carbon, and carbon–${config.leavingGroupName} bond → ${config.leavingGroupName}. Reproduce both arrows before checking.`,
        focusEntityIds: [
          config.lonePairId,
          config.electrophileAtomId,
          config.leavingBondId,
          config.leavingAtomId,
        ],
        revealsAcceptedBundle: true,
      },
    ],
    feedback: {
      incomplete: {
        summary: "The nucleophilic attack is on the authored path, but the concerted step is incomplete.",
        message: `Carbon cannot keep the incoming bond and its bond to ${config.leavingGroupName}. Move that bond pair onto ${config.leavingGroupName} in the same bundle.`,
        focusEntityIds: [
          config.electrophileAtomId,
          config.leavingBondId,
          config.leavingAtomId,
        ],
      },
      bondDirection: [
        {
          sourceBondId: config.leavingBondId,
          incorrectTargetAtomId: config.electrophileAtomId,
          code: "WRONG_LEAVING_GROUP_DIRECTION",
          summary: "The leaving-group bond arrow points in the wrong direction.",
          message: `End the carbon–${config.leavingGroupName} bond arrow on ${config.leavingGroupName}, which receives the departing electron pair.`,
          focusEntityIds: [config.leavingBondId, config.leavingAtomId],
        },
      ],
      accepted: {
        summary: "Accepted: both electron movements form one authored SN2 elementary step.",
        message: `${config.nucleophileName} forms the new bond as the leaving-group bond pair moves onto ${config.leavingGroupName}; atom inventory, charge, and supported valence are conserved.`,
        focusEntityIds: [
          config.nucleophileAtomId,
          config.electrophileAtomId,
          config.leavingBondId,
          config.leavingAtomId,
        ],
      },
      notAccepted: {
        summary: "The arrows are processable but do not match this exercise's authored SN2 pathway.",
        message: `Attack the carbon bonded to ${config.leavingGroupName}, then send that bond pair onto ${config.leavingGroupName}.`,
        focusEntityIds: [
          config.nucleophileAtomId,
          config.electrophileAtomId,
          config.leavingBondId,
          config.leavingAtomId,
        ],
      },
      committedSummary: "The accepted SN2 step is now part of the mechanism history.",
      commitActivitySummary: "Committed the accepted SN2 step.",
    },
    negativeCases: [
      {
        id: `${config.prefix}_attack_only`,
        title: "Attack without departure",
        arrows: [attack],
        expectedClassification: "incomplete",
        expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
      },
      {
        id: `${config.prefix}_reversed_departure`,
        title: "Leaving-group bond pair sent back to carbon",
        arrows: [
          attack,
          {
            source: { kind: "bond", entityId: config.leavingBondId },
            target: { kind: "atom", entityId: config.electrophileAtomId },
          },
        ],
        expectedClassification: "not_accepted_path",
        expectedReasonCode: "WRONG_LEAVING_GROUP_DIRECTION",
      },
      {
        id: `${config.prefix}_duplicate_source`,
        title: "One lone pair used twice",
        arrows: [
          attack,
          {
            source: { kind: "lone_pair", entityId: config.lonePairId },
            target: { kind: "atom", entityId: config.leavingAtomId },
          },
        ],
        expectedClassification: "invalid_invariant",
        expectedReasonCode: "DUPLICATE_ELECTRON_SOURCE",
      },
      {
        id: `${config.prefix}_wrong_reaction_center`,
        title: "Nucleophile attacks the leaving group",
        arrows: [
          {
            source: { kind: "lone_pair", entityId: config.lonePairId },
            target: { kind: "atom", entityId: config.leavingAtomId },
          },
          departure,
        ],
        expectedClassification: "not_accepted_path",
        expectedReasonCode: "NOT_IN_AUTHORED_PATH",
      },
    ],
  };
}

function protonTransferStep(
  config: ProtonTransferStepConfig,
): ProblemStepDefinition {
  const protonation = {
    source: { kind: "lone_pair" as const, entityId: config.lonePairId },
    target: { kind: "atom" as const, entityId: config.transferHydrogenId },
  };
  const deprotonation = {
    source: { kind: "bond" as const, entityId: config.acidBondId },
    target: { kind: "atom" as const, entityId: config.acidAtomId },
  };

  return {
    id: `${config.prefix}_proton_transfer`,
    title: config.title,
    fromStateId: config.fromStateId,
    toStateId: config.toStateId,
    acceptedBundles: [[protonation, deprotonation]],
    scaffold: [
      {
        level: 1,
        title: "Identify acid and base",
        message: `Find the available lone pair on ${config.baseName} and the proton attached to ${config.acidName}.`,
        focusEntityIds: [
          config.baseAtomId,
          config.lonePairId,
          config.transferHydrogenId,
          config.acidAtomId,
        ],
        revealsAcceptedBundle: false,
      },
      {
        level: 2,
        title: "Form the new bond",
        message: `Begin at ${config.baseName}'s lone pair and end at the labeled hydrogen on ${config.acidName}.`,
        focusEntityIds: [config.lonePairId, config.transferHydrogenId],
        revealsAcceptedBundle: false,
      },
      {
        level: 3,
        title: "Return the old bond pair",
        message: `In the same step, move the original ${config.acidName}–H bond pair back onto ${config.acidName}.`,
        focusEntityIds: [config.acidBondId, config.acidAtomId, config.transferHydrogenId],
        revealsAcceptedBundle: false,
      },
      {
        level: 4,
        title: "Show the complete transfer",
        message: `Preview: ${config.baseName} lone pair → hydrogen, and ${config.acidName}–H bond → ${config.acidName}. Reproduce both arrows before checking.`,
        focusEntityIds: [
          config.lonePairId,
          config.transferHydrogenId,
          config.acidBondId,
          config.acidAtomId,
        ],
        revealsAcceptedBundle: true,
      },
    ],
    feedback: {
      incomplete: {
        summary: "This draft begins the authored proton transfer, but the elementary step is incomplete.",
        message: `Form the new bond to hydrogen while returning the original ${config.acidName}–H bond pair to ${config.acidName} in the same bundle.`,
        focusEntityIds: [
          config.baseAtomId,
          config.transferHydrogenId,
          config.acidBondId,
          config.acidAtomId,
        ],
      },
      bondDirection: [
        {
          sourceBondId: config.acidBondId,
          incorrectTargetAtomId: config.transferHydrogenId,
          code: "WRONG_BOND_DIRECTION",
          summary: `The ${config.acidName}–H bond electrons are moving to the wrong atom.`,
          message: `End the bond-source arrow on ${config.acidName}, not hydrogen.`,
          focusEntityIds: [config.acidBondId, config.acidAtomId, config.transferHydrogenId],
        },
      ],
      accepted: {
        summary: "Accepted: both arrows account for one authored proton-transfer step.",
        message: `${config.baseName}'s lone pair forms the new bond to hydrogen while the original bond pair returns to ${config.acidName}; atom inventory, charge, and supported valence are conserved.`,
        focusEntityIds: [
          config.baseAtomId,
          config.transferHydrogenId,
          config.acidBondId,
          config.acidAtomId,
        ],
      },
      notAccepted: {
        summary: "The arrows are processable but do not match this exercise's authored proton transfer.",
        message: `Use ${config.baseName}'s lone pair to accept the labeled hydrogen, then return the original bond pair to ${config.acidName}.`,
        focusEntityIds: [
          config.lonePairId,
          config.transferHydrogenId,
          config.acidBondId,
          config.acidAtomId,
        ],
      },
      committedSummary: "The accepted proton transfer is now part of the mechanism history.",
      commitActivitySummary: "Committed the accepted proton-transfer step.",
    },
    negativeCases: [
      {
        id: `${config.prefix}_protonation_only`,
        title: "New bond without cleavage",
        arrows: [protonation],
        expectedClassification: "incomplete",
        expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
      },
      {
        id: `${config.prefix}_cleavage_only`,
        title: "Cleavage without proton acceptance",
        arrows: [deprotonation],
        expectedClassification: "incomplete",
        expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
      },
      {
        id: `${config.prefix}_wrong_bond_direction`,
        title: "Bond pair sent to hydrogen",
        arrows: [
          protonation,
          {
            source: { kind: "bond", entityId: config.acidBondId },
            target: { kind: "atom", entityId: config.transferHydrogenId },
          },
        ],
        expectedClassification: "not_accepted_path",
        expectedReasonCode: "WRONG_BOND_DIRECTION",
      },
      {
        id: `${config.prefix}_wrong_acceptor`,
        title: "Base lone pair aimed at the acid atom",
        arrows: [
          {
            source: { kind: "lone_pair", entityId: config.lonePairId },
            target: { kind: "atom", entityId: config.acidAtomId },
          },
          deprotonation,
        ],
        expectedClassification: "not_accepted_path",
        expectedReasonCode: "NOT_IN_AUTHORED_PATH",
      },
    ],
  };
}

const methoxideDimethylReactants: MoleculeState = {
  id: "sn2_methoxide_methyl_reactants",
  label: "Methoxide plus bromomethane",
  atoms: [
    { id: "c_methoxide", label: "C1", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 68, y: 190 } },
    { id: "o_nucleophile", label: "O1", element: "O", formalCharge: -1, lonePairCount: 3, implicitHydrogenCount: 0, position: { x: 188, y: 190 } },
    { id: "c_electrophile", label: "C2", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 480, y: 190 } },
    { id: "br_leaving", label: "Br1", element: "Br", formalCharge: 0, lonePairCount: 3, implicitHydrogenCount: 0, position: { x: 640, y: 190 } },
  ],
  bonds: [
    { id: "bond_c_methoxide_o", atomIds: ["c_methoxide", "o_nucleophile"], order: 1 },
    { id: "bond_c_br", atomIds: ["c_electrophile", "br_leaving"], order: 1 },
  ],
  lonePairSites: [
    { id: "lp_o_1", atomId: "o_nucleophile", angle: -90 },
    { id: "lp_o_2", atomId: "o_nucleophile", angle: 30 },
    { id: "lp_o_3", atomId: "o_nucleophile", angle: 150 },
    { id: "lp_br_1", atomId: "br_leaving", angle: -90 },
    { id: "lp_br_2", atomId: "br_leaving", angle: 30 },
    { id: "lp_br_3", atomId: "br_leaving", angle: 150 },
  ],
  separators: [{ x: 328, y: 200 }],
};

const methoxideDimethylProducts: MoleculeState = {
  id: "sn2_methoxide_methyl_products",
  label: "Dimethyl ether plus bromide",
  atoms: [
    { id: "c_methoxide", label: "C1", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 130, y: 190 } },
    { id: "o_nucleophile", label: "O1", element: "O", formalCharge: 0, lonePairCount: 2, implicitHydrogenCount: 0, position: { x: 270, y: 190 } },
    { id: "c_electrophile", label: "C2", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 410, y: 190 } },
    { id: "br_leaving", label: "Br1", element: "Br", formalCharge: -1, lonePairCount: 4, implicitHydrogenCount: 0, position: { x: 640, y: 190 } },
  ],
  bonds: [
    { id: "bond_c_methoxide_o", atomIds: ["c_methoxide", "o_nucleophile"], order: 1 },
    { id: "bond_c_electrophile__o_nucleophile", atomIds: ["o_nucleophile", "c_electrophile"], order: 1 },
  ],
  lonePairSites: [
    { id: "lp_o_1", atomId: "o_nucleophile", angle: -90 },
    { id: "lp_o_2", atomId: "o_nucleophile", angle: 90 },
    { id: "lp_br_1", atomId: "br_leaving", angle: -90 },
    { id: "lp_br_2", atomId: "br_leaving", angle: 0 },
    { id: "lp_br_3", atomId: "br_leaving", angle: 90 },
    { id: "lp_br_4", atomId: "br_leaving", angle: 180 },
  ],
  separators: [{ x: 530, y: 200 }],
};

export const methoxideMethylSn2Problem: ProblemDefinition = {
  id: "sn2_02",
  title: "Methoxide forms dimethyl ether",
  reactionFamily: "SN2",
  difficulty: 2,
  stepCount: 1,
  prompt: "Show methoxide displacing bromide from bromomethane in one concerted arrow bundle.",
  objective: "Carry an oxygen lone pair into the new C–O bond while returning the C–Br bond pair to bromine.",
  contextNote: "This authored exercise isolates electron bookkeeping for a methyl SN2 substitution. It does not model solvent, counterions, reaction rate, or transition-state geometry.",
  currentStateId: methoxideDimethylReactants.id,
  completedStateId: methoxideDimethylProducts.id,
  states: {
    [methoxideDimethylReactants.id]: methoxideDimethylReactants,
    [methoxideDimethylProducts.id]: methoxideDimethylProducts,
  },
  steps: [
    sn2Step({
      prefix: "sn2_methoxide_methyl",
      title: "Form dimethyl ether",
      fromStateId: methoxideDimethylReactants.id,
      toStateId: methoxideDimethylProducts.id,
      lonePairId: "lp_o_1",
      nucleophileAtomId: "o_nucleophile",
      electrophileAtomId: "c_electrophile",
      leavingAtomId: "br_leaving",
      leavingBondId: "bond_c_br",
      nucleophileName: "methoxide",
      leavingGroupName: "bromine",
    }),
  ],
  review: draftReview([
    {
      title: "OpenStax Organic Chemistry 11.3: Characteristics of the SN2 Reaction",
      urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/11-3-characteristics-of-the-sn2-reaction",
      note: "Lists methoxide reacting with bromomethane to form dimethyl ether and bromide in its SN2 nucleophile table.",
    },
    {
      title: "OpenStax Organic Chemistry 18.2: Preparing Ethers",
      urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/18-2-preparing-ethers",
      note: "Describes Williamson ether synthesis as an alkoxide reacting with a primary alkyl halide or tosylate through SN2.",
    },
  ]),
};

const methoxideEthylReactants: MoleculeState = {
  id: "sn2_methoxide_ethyl_reactants",
  label: "Methoxide plus bromoethane",
  atoms: [
    { id: "c_methoxide", label: "C1", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 54, y: 190 } },
    { id: "o_nucleophile", label: "O1", element: "O", formalCharge: -1, lonePairCount: 3, implicitHydrogenCount: 0, position: { x: 164, y: 190 } },
    { id: "c_substituent", label: "C2", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 382, y: 190 } },
    { id: "c_electrophile", label: "C3", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 2, position: { x: 492, y: 190 } },
    { id: "br_leaving", label: "Br1", element: "Br", formalCharge: 0, lonePairCount: 3, implicitHydrogenCount: 0, position: { x: 650, y: 190 } },
  ],
  bonds: [
    { id: "bond_c_methoxide_o", atomIds: ["c_methoxide", "o_nucleophile"], order: 1 },
    { id: "bond_c_substituent_c_electrophile", atomIds: ["c_substituent", "c_electrophile"], order: 1 },
    { id: "bond_c_br", atomIds: ["c_electrophile", "br_leaving"], order: 1 },
  ],
  lonePairSites: [
    { id: "lp_o_1", atomId: "o_nucleophile", angle: -90 },
    { id: "lp_o_2", atomId: "o_nucleophile", angle: 30 },
    { id: "lp_o_3", atomId: "o_nucleophile", angle: 150 },
    { id: "lp_br_1", atomId: "br_leaving", angle: -90 },
    { id: "lp_br_2", atomId: "br_leaving", angle: 30 },
    { id: "lp_br_3", atomId: "br_leaving", angle: 150 },
  ],
  separators: [{ x: 276, y: 200 }],
};

const methoxideEthylProducts: MoleculeState = {
  id: "sn2_methoxide_ethyl_products",
  label: "Ethyl methyl ether plus bromide",
  atoms: [
    { id: "c_methoxide", label: "C1", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 72, y: 190 } },
    { id: "o_nucleophile", label: "O1", element: "O", formalCharge: 0, lonePairCount: 2, implicitHydrogenCount: 0, position: { x: 190, y: 190 } },
    { id: "c_electrophile", label: "C3", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 2, position: { x: 318, y: 190 } },
    { id: "c_substituent", label: "C2", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 440, y: 190 } },
    { id: "br_leaving", label: "Br1", element: "Br", formalCharge: -1, lonePairCount: 4, implicitHydrogenCount: 0, position: { x: 650, y: 190 } },
  ],
  bonds: [
    { id: "bond_c_methoxide_o", atomIds: ["c_methoxide", "o_nucleophile"], order: 1 },
    { id: "bond_c_electrophile__o_nucleophile", atomIds: ["o_nucleophile", "c_electrophile"], order: 1 },
    { id: "bond_c_substituent_c_electrophile", atomIds: ["c_substituent", "c_electrophile"], order: 1 },
  ],
  lonePairSites: [
    { id: "lp_o_1", atomId: "o_nucleophile", angle: -90 },
    { id: "lp_o_2", atomId: "o_nucleophile", angle: 90 },
    { id: "lp_br_1", atomId: "br_leaving", angle: -90 },
    { id: "lp_br_2", atomId: "br_leaving", angle: 0 },
    { id: "lp_br_3", atomId: "br_leaving", angle: 90 },
    { id: "lp_br_4", atomId: "br_leaving", angle: 180 },
  ],
  separators: [{ x: 548, y: 200 }],
};

export const methoxideEthylSn2Problem: ProblemDefinition = {
  id: "sn2_03",
  title: "Methoxide attacks bromoethane",
  reactionFamily: "SN2",
  difficulty: 2,
  stepCount: 1,
  prompt: "Show methoxide attacking the primary carbon in bromoethane while bromide leaves in the same step.",
  objective: "Identify the carbon bearing bromine in a larger substrate and account for both simultaneous electron movements.",
  contextNote: "This fixture isolates one authored primary-substrate SN2 pathway. It does not compare substitution with elimination or claim a product distribution under unspecified conditions.",
  currentStateId: methoxideEthylReactants.id,
  completedStateId: methoxideEthylProducts.id,
  states: {
    [methoxideEthylReactants.id]: methoxideEthylReactants,
    [methoxideEthylProducts.id]: methoxideEthylProducts,
  },
  steps: [
    sn2Step({
      prefix: "sn2_methoxide_ethyl",
      title: "Substitute at the primary carbon",
      fromStateId: methoxideEthylReactants.id,
      toStateId: methoxideEthylProducts.id,
      lonePairId: "lp_o_1",
      nucleophileAtomId: "o_nucleophile",
      electrophileAtomId: "c_electrophile",
      leavingAtomId: "br_leaving",
      leavingBondId: "bond_c_br",
      nucleophileName: "methoxide",
      leavingGroupName: "bromine",
    }),
  ],
  review: draftReview([
    {
      title: "OpenStax Organic Chemistry 18.2: Preparing Ethers",
      urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/18-2-preparing-ethers",
      note: "Defines Williamson ether synthesis as SN2 attack by an alkoxide on a primary alkyl halide or tosylate.",
    },
    {
      title: "OpenStax Organic Chemistry 11.3: Characteristics of the SN2 Reaction",
      urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/11-3-characteristics-of-the-sn2-reaction",
      note: "Identifies primary substrates such as bromoethane as accessible SN2 substrates while explaining solvent and steric boundaries.",
    },
  ]),
};

const methoxideMethylammoniumReactants: MoleculeState = {
  id: "proton_transfer_methoxide_reactants",
  label: "Methoxide plus methylammonium",
  atoms: [
    { id: "c_methoxide", label: "C1", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 64, y: 190 } },
    { id: "o_base", label: "O1", element: "O", formalCharge: -1, lonePairCount: 3, implicitHydrogenCount: 0, position: { x: 176, y: 190 } },
    { id: "h_transfer", label: "H1", element: "H", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 0, position: { x: 382, y: 190 } },
    { id: "n_acid", label: "N1", element: "N", formalCharge: 1, lonePairCount: 0, implicitHydrogenCount: 2, position: { x: 490, y: 190 } },
    { id: "c_ammonium", label: "C2", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 610, y: 190 } },
  ],
  bonds: [
    { id: "bond_c_methoxide_o", atomIds: ["c_methoxide", "o_base"], order: 1 },
    { id: "bond_n_h_transfer", atomIds: ["n_acid", "h_transfer"], order: 1 },
    { id: "bond_n_c_ammonium", atomIds: ["n_acid", "c_ammonium"], order: 1 },
  ],
  lonePairSites: [
    { id: "lp_o_1", atomId: "o_base", angle: -90 },
    { id: "lp_o_2", atomId: "o_base", angle: 30 },
    { id: "lp_o_3", atomId: "o_base", angle: 150 },
  ],
  separators: [{ x: 286, y: 200 }],
};

const methoxideMethylammoniumProducts: MoleculeState = {
  id: "proton_transfer_methoxide_products",
  label: "Methanol plus methylamine",
  atoms: [
    { id: "c_methoxide", label: "C1", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 70, y: 190 } },
    { id: "o_base", label: "O1", element: "O", formalCharge: 0, lonePairCount: 2, implicitHydrogenCount: 0, position: { x: 188, y: 190 } },
    { id: "h_transfer", label: "H1", element: "H", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 0, position: { x: 304, y: 190 } },
    { id: "n_acid", label: "N1", element: "N", formalCharge: 0, lonePairCount: 1, implicitHydrogenCount: 2, position: { x: 502, y: 190 } },
    { id: "c_ammonium", label: "C2", element: "C", formalCharge: 0, lonePairCount: 0, implicitHydrogenCount: 3, position: { x: 620, y: 190 } },
  ],
  bonds: [
    { id: "bond_c_methoxide_o", atomIds: ["c_methoxide", "o_base"], order: 1 },
    { id: "bond_h_transfer__o_base", atomIds: ["o_base", "h_transfer"], order: 1 },
    { id: "bond_n_c_ammonium", atomIds: ["n_acid", "c_ammonium"], order: 1 },
  ],
  lonePairSites: [
    { id: "lp_o_1", atomId: "o_base", angle: -90 },
    { id: "lp_o_2", atomId: "o_base", angle: 90 },
    { id: "lp_n_1", atomId: "n_acid", angle: 180 },
  ],
  separators: [{ x: 410, y: 200 }],
};

export const methoxideMethylammoniumProblem: ProblemDefinition = {
  id: "proton_transfer_02",
  title: "Methoxide deprotonates methylammonium",
  reactionFamily: "proton_transfer",
  difficulty: 2,
  stepCount: 1,
  prompt: "Show methoxide accepting the labeled proton from methylammonium. Add both arrows before checking.",
  objective: "Form methanol and methylamine while tracking the original N–H electron pair back to nitrogen.",
  contextNote: "This authored exercise represents one proton-transfer event and its Lewis-structure bookkeeping. It does not model solvent rearrangement, counterions, kinetics, or equilibrium populations.",
  currentStateId: methoxideMethylammoniumReactants.id,
  completedStateId: methoxideMethylammoniumProducts.id,
  states: {
    [methoxideMethylammoniumReactants.id]: methoxideMethylammoniumReactants,
    [methoxideMethylammoniumProducts.id]: methoxideMethylammoniumProducts,
  },
  steps: [
    protonTransferStep({
      prefix: "methoxide_methylammonium",
      title: "Transfer the ammonium proton",
      fromStateId: methoxideMethylammoniumReactants.id,
      toStateId: methoxideMethylammoniumProducts.id,
      lonePairId: "lp_o_1",
      baseAtomId: "o_base",
      transferHydrogenId: "h_transfer",
      acidAtomId: "n_acid",
      acidBondId: "bond_n_h_transfer",
      baseName: "oxygen",
      acidName: "nitrogen",
    }),
  ],
  review: draftReview([
    {
      title: "IUPAC Gold Book: proton transfer reaction",
      urlOrDoi: "https://doi.org/10.1351/goldbook.P04915",
      note: "Defines transfer of a proton from one binding site to another and distinguishes the represented transfer event from the full solution process.",
    },
    {
      title: "OpenStax Organic Chemistry 2.10: Organic Acids and Organic Bases",
      urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/2-10-organic-acids-and-organic-bases",
      note: "Describes alkoxides as oxygen-centered bases and methylamine as an organic base, supporting the conjugate-pair representation.",
    },
    {
      title: "OpenStax Organic Chemistry 24.5: Biological Amines and the Henderson–Hasselbalch Equation",
      urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/24-5-biological-amines-and-the-henderson-hasselbalch-equation",
      note: "Reports methylammonium as the conjugate acid of methylamine and gives its aqueous pKa context.",
    },
  ]),
};
