import type { ProblemDefinition } from "../domain/types";

export const sn2Problem: ProblemDefinition = {
  id: "sn2_01",
  title: "A concerted substitution",
  reactionFamily: "SN2",
  difficulty: 1,
  stepCount: 1,
  prompt:
    "Show the curved-arrow step for hydroxide reacting with bromomethane. Add every arrow that moves in the same elementary step, then check the bundle.",
  objective:
    "Track the nucleophile's electron pair while preserving carbon's octet and accounting for the leaving group.",
  contextNote:
    "This fixture isolates the single concerted substitution step. Solvent, concentration, rate, and the transition state are outside the represented graph.",
  currentStateId: "sn2_reactants",
  completedStateId: "sn2_products",
  states: {
    sn2_reactants: {
      id: "sn2_reactants",
      label: "Hydroxide plus bromomethane",
      atoms: [
        {
          id: "h_hydroxide",
          label: "H1",
          element: "H",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 0,
          position: { x: 82, y: 190 },
        },
        {
          id: "o_nucleophile",
          label: "O1",
          element: "O",
          formalCharge: -1,
          lonePairCount: 3,
          implicitHydrogenCount: 0,
          position: { x: 180, y: 190 },
        },
        {
          id: "c_electrophile",
          label: "C1",
          element: "C",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 3,
          position: { x: 490, y: 190 },
        },
        {
          id: "br_leaving",
          label: "Br1",
          element: "Br",
          formalCharge: 0,
          lonePairCount: 3,
          implicitHydrogenCount: 0,
          position: { x: 650, y: 190 },
        },
      ],
      bonds: [
        { id: "bond_h_o", atomIds: ["h_hydroxide", "o_nucleophile"], order: 1 },
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
    },
    sn2_products: {
      id: "sn2_products",
      label: "Methanol plus bromide",
      atoms: [
        {
          id: "h_hydroxide",
          label: "H1",
          element: "H",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 0,
          position: { x: 175, y: 190 },
        },
        {
          id: "o_nucleophile",
          label: "O1",
          element: "O",
          formalCharge: 0,
          lonePairCount: 2,
          implicitHydrogenCount: 0,
          position: { x: 275, y: 190 },
        },
        {
          id: "c_electrophile",
          label: "C1",
          element: "C",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 3,
          position: { x: 430, y: 190 },
        },
        {
          id: "br_leaving",
          label: "Br1",
          element: "Br",
          formalCharge: -1,
          lonePairCount: 4,
          implicitHydrogenCount: 0,
          position: { x: 650, y: 190 },
        },
      ],
      bonds: [
        { id: "bond_h_o", atomIds: ["h_hydroxide", "o_nucleophile"], order: 1 },
        { id: "bond_o_c", atomIds: ["o_nucleophile", "c_electrophile"], order: 1 },
      ],
      lonePairSites: [
        { id: "lp_o_1", atomId: "o_nucleophile", angle: -90 },
        { id: "lp_o_2", atomId: "o_nucleophile", angle: 90 },
        { id: "lp_br_1", atomId: "br_leaving", angle: -90 },
        { id: "lp_br_2", atomId: "br_leaving", angle: 0 },
        { id: "lp_br_3", atomId: "br_leaving", angle: 90 },
        { id: "lp_br_4", atomId: "br_leaving", angle: 180 },
      ],
    },
  },
  acceptedBundles: [
    [
      {
        source: { kind: "lone_pair", entityId: "lp_o_1" },
        target: { kind: "atom", entityId: "c_electrophile" },
      },
      {
        source: { kind: "bond", entityId: "bond_c_br" },
        target: { kind: "atom", entityId: "br_leaving" },
      },
    ],
  ],
  scaffold: [
    {
      level: 1,
      title: "Start at electrons",
      message:
        "Every curved arrow begins at an electron source: either a lone pair or a bond. Which species can donate a pair here?",
      focusEntityIds: ["o_nucleophile", "lp_o_1", "lp_o_2", "lp_o_3"],
      revealsAcceptedBundle: false,
    },
    {
      level: 2,
      title: "Find the electrophile",
      message:
        "Hydroxide can donate a lone pair to the carbon bonded to bromine. Begin one arrow at an oxygen lone pair and end it at that carbon.",
      focusEntityIds: ["lp_o_1", "lp_o_2", "lp_o_3", "c_electrophile"],
      revealsAcceptedBundle: false,
    },
    {
      level: 3,
      title: "Account for the octet",
      message:
        "Carbon cannot keep five bonds. In this same step, move the C–Br bond pair onto bromine.",
      focusEntityIds: ["c_electrophile", "bond_c_br", "br_leaving"],
      revealsAcceptedBundle: false,
    },
    {
      level: 4,
      title: "Show the complete bundle",
      message:
        "Preview: oxygen lone pair → carbon, and C–Br bond → bromine. The preview does not edit your draft; reproduce both arrows yourself.",
      focusEntityIds: ["lp_o_1", "c_electrophile", "bond_c_br", "br_leaving"],
      revealsAcceptedBundle: true,
    },
  ],
  feedback: {
    incomplete: {
      summary: "The nucleophilic attack is on the accepted path, but the concerted step is incomplete.",
      message:
        "Carbon would exceed its octet unless the C–Br bond electrons move to bromine in the same step.",
      focusEntityIds: ["c_electrophile", "bond_c_br", "br_leaving"],
    },
    bondDirection: [
      {
        sourceBondId: "bond_c_br",
        incorrectTargetAtomId: "c_electrophile",
        code: "WRONG_LEAVING_GROUP_DIRECTION",
        summary: "The leaving-group bond arrow points in the wrong direction.",
        message:
          "A bond-source arrow carries that bond's electron pair. End the C–Br arrow on bromine, not carbon.",
        focusEntityIds: ["bond_c_br", "br_leaving"],
      },
    ],
    accepted: {
      summary: "Accepted: both electron movements form one valid SN2 elementary step.",
      message:
        "Oxygen forms the C–O bond as the C–Br bond pair moves onto bromine; charge and valence are conserved.",
      focusEntityIds: ["o_nucleophile", "c_electrophile", "bond_c_br", "br_leaving"],
    },
    notAccepted: {
      summary: "The arrows are internally processable but do not match this exercise's authored SN2 pathway.",
      message:
        "Use the nucleophile's lone pair to attack the carbon bearing bromine, and send the C–Br bond pair to bromine.",
      focusEntityIds: ["o_nucleophile", "c_electrophile", "bond_c_br", "br_leaving"],
    },
    committedSummary: "The accepted SN2 step is now part of the mechanism history.",
    commitActivitySummary: "Committed the accepted SN2 step.",
  },
  negativeCases: [
    {
      id: "sn2_attack_only",
      title: "Attack without departure",
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_o_1" },
          target: { kind: "atom", entityId: "c_electrophile" },
        },
      ],
      expectedClassification: "incomplete",
      expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
    },
    {
      id: "sn2_reversed_departure",
      title: "Bond pair sent back to carbon",
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_o_1" },
          target: { kind: "atom", entityId: "c_electrophile" },
        },
        {
          source: { kind: "bond", entityId: "bond_c_br" },
          target: { kind: "atom", entityId: "c_electrophile" },
        },
      ],
      expectedClassification: "not_accepted_path",
      expectedReasonCode: "WRONG_LEAVING_GROUP_DIRECTION",
    },
    {
      id: "sn2_duplicate_source",
      title: "One lone pair used twice",
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_o_1" },
          target: { kind: "atom", entityId: "c_electrophile" },
        },
        {
          source: { kind: "lone_pair", entityId: "lp_o_1" },
          target: { kind: "atom", entityId: "br_leaving" },
        },
      ],
      expectedClassification: "invalid_invariant",
      expectedReasonCode: "DUPLICATE_ELECTRON_SOURCE",
    },
    {
      id: "sn2_wrong_reaction_center",
      title: "Nucleophile attacks bromine",
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_o_1" },
          target: { kind: "atom", entityId: "br_leaving" },
        },
        {
          source: { kind: "bond", entityId: "bond_c_br" },
          target: { kind: "atom", entityId: "br_leaving" },
        },
      ],
      expectedClassification: "not_accepted_path",
      expectedReasonCode: "NOT_IN_AUTHORED_PATH",
    },
  ],
  review: {
    status: "draft",
    sources: [
      {
        title: "IUPAC Gold Book: nucleophilic substitution",
        urlOrDoi: "https://doi.org/10.1351/goldbook.08191",
        note: "Defines the entering group, electrophilic substrate, and electron-pair retention by the leaving group; includes CH3Br plus hydroxide as the example.",
      },
      {
        title: "OpenStax Organic Chemistry 11.2: The SN2 Reaction",
        urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/11-2-the-sn2-reaction",
        note: "Shows hydroxide plus bromomethane yielding methanol and bromide in a single concerted step.",
      },
    ],
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
  },
};
