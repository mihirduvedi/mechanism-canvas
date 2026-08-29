import type { ProblemDefinition } from "../domain/types";

export const protonTransferProblem: ProblemDefinition = {
  id: "proton_transfer_01",
  title: "Pass the proton",
  reactionFamily: "proton_transfer",
  difficulty: 1,
  stepCount: 1,
  prompt:
    "Show ammonia accepting a proton from hydronium. Add both electron movements to one draft before you check the elementary step.",
  objective:
    "Use nitrogen's lone pair to form the new N–H bond while returning the original O–H bond pair to oxygen.",
  contextNote:
    "This fixture isolates one Brønsted acid–base event. It represents Lewis structures and electron bookkeeping, not solvent structure, equilibrium populations, or proton-transfer kinetics.",
  currentStateId: "proton_transfer_reactants",
  completedStateId: "proton_transfer_products",
  states: {
    proton_transfer_reactants: {
      id: "proton_transfer_reactants",
      label: "Ammonia plus hydronium",
      atoms: [
        {
          id: "n_base",
          label: "N1",
          element: "N",
          formalCharge: 0,
          lonePairCount: 1,
          implicitHydrogenCount: 3,
          position: { x: 175, y: 190 },
        },
        {
          id: "h_transfer",
          label: "H1",
          element: "H",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 0,
          position: { x: 455, y: 190 },
        },
        {
          id: "o_acid",
          label: "O1",
          element: "O",
          formalCharge: 1,
          lonePairCount: 1,
          implicitHydrogenCount: 2,
          position: { x: 585, y: 190 },
        },
      ],
      bonds: [
        { id: "bond_o_h_transfer", atomIds: ["o_acid", "h_transfer"], order: 1 },
      ],
      lonePairSites: [
        { id: "lp_n_1", atomId: "n_base", angle: 0 },
        { id: "lp_o_acid_1", atomId: "o_acid", angle: -90 },
      ],
      separators: [{ x: 332, y: 200 }],
    },
    proton_transfer_products: {
      id: "proton_transfer_products",
      label: "Ammonium plus water",
      atoms: [
        {
          id: "n_base",
          label: "N1",
          element: "N",
          formalCharge: 1,
          lonePairCount: 0,
          implicitHydrogenCount: 3,
          position: { x: 245, y: 190 },
        },
        {
          id: "h_transfer",
          label: "H1",
          element: "H",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 0,
          position: { x: 365, y: 190 },
        },
        {
          id: "o_acid",
          label: "O1",
          element: "O",
          formalCharge: 0,
          lonePairCount: 2,
          implicitHydrogenCount: 2,
          position: { x: 625, y: 190 },
        },
      ],
      bonds: [
        { id: "bond_h_transfer__n_base", atomIds: ["n_base", "h_transfer"], order: 1 },
      ],
      lonePairSites: [
        { id: "lp_o_acid_1", atomId: "o_acid", angle: -90 },
        { id: "lp_o_acid_2", atomId: "o_acid", angle: 90 },
      ],
      separators: [{ x: 545, y: 200 }],
    },
  },
  steps: [
    {
      id: "ammonia_proton_transfer",
      title: "Transfer the proton",
      fromStateId: "proton_transfer_reactants",
      toStateId: "proton_transfer_products",
  acceptedBundles: [
    [
      {
        source: { kind: "lone_pair", entityId: "lp_n_1" },
        target: { kind: "atom", entityId: "h_transfer" },
      },
      {
        source: { kind: "bond", entityId: "bond_o_h_transfer" },
        target: { kind: "atom", entityId: "o_acid" },
      },
    ],
  ],
  scaffold: [
    {
      level: 1,
      title: "Identify acid and base",
      message:
        "A Brønsted base accepts a proton with an electron pair. Which atom has an available lone pair, and which species carries the transferable proton?",
      focusEntityIds: ["n_base", "lp_n_1", "h_transfer", "o_acid"],
      revealsAcceptedBundle: false,
    },
    {
      level: 2,
      title: "Form the new bond",
      message:
        "Begin at nitrogen's lone pair and end at the hydrogen attached to oxygen. That arrow forms the new N–H bond.",
      focusEntityIds: ["lp_n_1", "h_transfer"],
      revealsAcceptedBundle: false,
    },
    {
      level: 3,
      title: "Return the old bond pair",
      message:
        "Hydrogen cannot remain bonded to both atoms. In the same step, move the O–H bond pair back onto oxygen.",
      focusEntityIds: ["bond_o_h_transfer", "o_acid", "h_transfer"],
      revealsAcceptedBundle: false,
    },
    {
      level: 4,
      title: "Show the complete transfer",
      message:
        "Preview: nitrogen lone pair → hydrogen, and O–H bond → oxygen. Reproduce both arrows in your draft; the preview does not edit it.",
      focusEntityIds: ["lp_n_1", "h_transfer", "bond_o_h_transfer", "o_acid"],
      revealsAcceptedBundle: true,
    },
  ],
  feedback: {
    incomplete: {
      summary: "This draft begins the accepted proton transfer, but the elementary step is incomplete.",
      message:
        "Account for both bonds around the transferred hydrogen: form N–H while returning the original O–H bond pair to oxygen in the same bundle.",
      focusEntityIds: ["n_base", "lp_n_1", "h_transfer", "bond_o_h_transfer", "o_acid"],
    },
    bondDirection: [
      {
        sourceBondId: "bond_o_h_transfer",
        incorrectTargetAtomId: "h_transfer",
        code: "WRONG_BOND_DIRECTION",
        summary: "The O–H bond electrons are moving to the wrong atom.",
        message:
          "The bond-source arrow carries the O–H electron pair. End it on oxygen so hydrogen transfers without taking that pair.",
        focusEntityIds: ["bond_o_h_transfer", "o_acid", "h_transfer"],
      },
    ],
    accepted: {
      summary: "Accepted: both arrows account for one proton-transfer elementary step.",
      message:
        "Nitrogen's lone pair forms N–H while the original O–H bond pair returns to oxygen; atom inventory, charge, and supported valence are conserved.",
      focusEntityIds: ["n_base", "h_transfer", "bond_o_h_transfer", "o_acid"],
    },
    notAccepted: {
      summary: "The arrows are processable by the Lewis-structure model but do not match this exercise's authored proton transfer.",
      message:
        "Use nitrogen's lone pair to accept the labeled hydrogen, then return the labeled O–H bond pair to oxygen.",
      focusEntityIds: ["lp_n_1", "h_transfer", "bond_o_h_transfer", "o_acid"],
    },
    committedSummary: "The accepted proton transfer is now part of the mechanism history.",
    commitActivitySummary: "Committed the accepted proton-transfer step.",
  },
  negativeCases: [
    {
      id: "proton_transfer_attack_only",
      title: "New N–H bond without O–H cleavage",
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_n_1" },
          target: { kind: "atom", entityId: "h_transfer" },
        },
      ],
      expectedClassification: "incomplete",
      expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
    },
    {
      id: "proton_transfer_cleavage_only",
      title: "O–H cleavage without proton acceptance",
      arrows: [
        {
          source: { kind: "bond", entityId: "bond_o_h_transfer" },
          target: { kind: "atom", entityId: "o_acid" },
        },
      ],
      expectedClassification: "incomplete",
      expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
    },
    {
      id: "proton_transfer_wrong_bond_direction",
      title: "O–H electron pair sent to hydrogen",
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_n_1" },
          target: { kind: "atom", entityId: "h_transfer" },
        },
        {
          source: { kind: "bond", entityId: "bond_o_h_transfer" },
          target: { kind: "atom", entityId: "h_transfer" },
        },
      ],
      expectedClassification: "not_accepted_path",
      expectedReasonCode: "WRONG_BOND_DIRECTION",
    },
    {
      id: "proton_transfer_wrong_acceptor",
      title: "Nitrogen lone pair aimed at oxygen",
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_n_1" },
          target: { kind: "atom", entityId: "o_acid" },
        },
        {
          source: { kind: "bond", entityId: "bond_o_h_transfer" },
          target: { kind: "atom", entityId: "o_acid" },
        },
      ],
      expectedClassification: "not_accepted_path",
      expectedReasonCode: "NOT_IN_AUTHORED_PATH",
    },
    ],
    },
  ],
  review: {
    status: "draft",
    sources: [
      {
        title: "IUPAC Gold Book: Brønsted acid",
        urlOrDoi: "https://goldbook.iupac.org/terms/view/B00744",
        note: "Defines a Brønsted acid as a molecular entity capable of donating a proton to a base.",
      },
      {
        title: "OpenStax Organic Chemistry 2.7: Acids and Bases",
        urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/2-7-acids-and-bases-the-bronsted-lowry-definition",
        note: "Explains proton donation and acceptance, conjugate acid–base pairs, and ammonia accepting a proton to form ammonium.",
      },
      {
        title: "OpenStax Organic Chemistry 6.5: Using Curved Arrows",
        urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/6-5-using-curved-arrows-in-polar-reaction-mechanisms",
        note: "Supports starting curved arrows at electron sources and ending them at the atom receiving the pair.",
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
