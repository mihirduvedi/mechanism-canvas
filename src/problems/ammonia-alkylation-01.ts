import type { ProblemDefinition } from "../domain/types";

export const ammoniaAlkylationProblem: ProblemDefinition = {
  id: "ammonia_alkylation_01",
  title: "Build methylamine in two steps",
  reactionFamily: "SN2_proton_transfer",
  difficulty: 2,
  stepCount: 2,
  prompt:
    "Follow excess ammonia reacting with bromomethane. Commit the substitution that forms methylammonium bromide, then transfer the labeled proton to a second ammonia molecule.",
  objective:
    "Carry one atom-mapped mechanism through a charged intermediate while keeping each elementary step separately checked and reversible.",
  contextNote:
    "This authored capstone isolates an SN2 event followed by proton transfer. It does not model solvent, equilibria, kinetics, or the competing overalkylation that can make direct amine synthesis hard to control.",
  currentStateId: "amine_reactants",
  completedStateId: "amine_products",
  states: {
    amine_reactants: {
      id: "amine_reactants",
      label: "Two ammonia molecules plus bromomethane",
      atoms: [
        {
          id: "n_attacker",
          label: "N1",
          element: "N",
          formalCharge: 0,
          lonePairCount: 1,
          implicitHydrogenCount: 2,
          position: { x: 100, y: 145 },
        },
        {
          id: "h_transfer",
          label: "H1",
          element: "H",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 0,
          position: { x: 100, y: 45 },
        },
        {
          id: "c_methyl",
          label: "C1",
          element: "C",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 3,
          position: { x: 350, y: 145 },
        },
        {
          id: "br_leaving",
          label: "Br1",
          element: "Br",
          formalCharge: 0,
          lonePairCount: 3,
          implicitHydrogenCount: 0,
          position: { x: 480, y: 145 },
        },
        {
          id: "n_base",
          label: "N2",
          element: "N",
          formalCharge: 0,
          lonePairCount: 1,
          implicitHydrogenCount: 3,
          position: { x: 670, y: 245 },
        },
      ],
      bonds: [
        {
          id: "bond_n_attack_h_transfer",
          atomIds: ["n_attacker", "h_transfer"],
          order: 1,
        },
        { id: "bond_c_br", atomIds: ["c_methyl", "br_leaving"], order: 1 },
      ],
      lonePairSites: [
        { id: "lp_n_attack_1", atomId: "n_attacker", angle: 0 },
        { id: "lp_br_1", atomId: "br_leaving", angle: -90 },
        { id: "lp_br_2", atomId: "br_leaving", angle: 30 },
        { id: "lp_br_3", atomId: "br_leaving", angle: 150 },
        { id: "lp_n_base_1", atomId: "n_base", angle: 180 },
      ],
      separators: [
        { x: 230, y: 180 },
        { x: 575, y: 205 },
      ],
    },
    methylammonium_intermediate: {
      id: "methylammonium_intermediate",
      label: "Methylammonium bromide plus ammonia",
      atoms: [
        {
          id: "n_attacker",
          label: "N1",
          element: "N",
          formalCharge: 1,
          lonePairCount: 0,
          implicitHydrogenCount: 2,
          position: { x: 250, y: 150 },
        },
        {
          id: "h_transfer",
          label: "H1",
          element: "H",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 0,
          position: { x: 250, y: 45 },
        },
        {
          id: "c_methyl",
          label: "C1",
          element: "C",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 3,
          position: { x: 115, y: 150 },
        },
        {
          id: "br_leaving",
          label: "Br1",
          element: "Br",
          formalCharge: -1,
          lonePairCount: 4,
          implicitHydrogenCount: 0,
          position: { x: 465, y: 150 },
        },
        {
          id: "n_base",
          label: "N2",
          element: "N",
          formalCharge: 0,
          lonePairCount: 1,
          implicitHydrogenCount: 3,
          position: { x: 670, y: 245 },
        },
      ],
      bonds: [
        {
          id: "bond_n_attack_h_transfer",
          atomIds: ["n_attacker", "h_transfer"],
          order: 1,
        },
        { id: "bond_c_n_attack", atomIds: ["c_methyl", "n_attacker"], order: 1 },
      ],
      lonePairSites: [
        { id: "lp_br_1", atomId: "br_leaving", angle: -90 },
        { id: "lp_br_2", atomId: "br_leaving", angle: 0 },
        { id: "lp_br_3", atomId: "br_leaving", angle: 90 },
        { id: "lp_br_4", atomId: "br_leaving", angle: 180 },
        { id: "lp_n_base_1", atomId: "n_base", angle: 180 },
      ],
      separators: [
        { x: 360, y: 200 },
        { x: 565, y: 205 },
      ],
    },
    amine_products: {
      id: "amine_products",
      label: "Methylamine plus ammonium bromide",
      atoms: [
        {
          id: "n_attacker",
          label: "N1",
          element: "N",
          formalCharge: 0,
          lonePairCount: 1,
          implicitHydrogenCount: 2,
          position: { x: 250, y: 150 },
        },
        {
          id: "h_transfer",
          label: "H1",
          element: "H",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 0,
          position: { x: 670, y: 140 },
        },
        {
          id: "c_methyl",
          label: "C1",
          element: "C",
          formalCharge: 0,
          lonePairCount: 0,
          implicitHydrogenCount: 3,
          position: { x: 115, y: 150 },
        },
        {
          id: "br_leaving",
          label: "Br1",
          element: "Br",
          formalCharge: -1,
          lonePairCount: 4,
          implicitHydrogenCount: 0,
          position: { x: 465, y: 150 },
        },
        {
          id: "n_base",
          label: "N2",
          element: "N",
          formalCharge: 1,
          lonePairCount: 0,
          implicitHydrogenCount: 3,
          position: { x: 670, y: 245 },
        },
      ],
      bonds: [
        { id: "bond_c_n_attack", atomIds: ["c_methyl", "n_attacker"], order: 1 },
        {
          id: "bond_h_transfer__n_base",
          atomIds: ["n_base", "h_transfer"],
          order: 1,
        },
      ],
      lonePairSites: [
        { id: "lp_n_attack_1", atomId: "n_attacker", angle: -90 },
        { id: "lp_br_1", atomId: "br_leaving", angle: -90 },
        { id: "lp_br_2", atomId: "br_leaving", angle: 0 },
        { id: "lp_br_3", atomId: "br_leaving", angle: 90 },
        { id: "lp_br_4", atomId: "br_leaving", angle: 180 },
      ],
      separators: [
        { x: 360, y: 200 },
        { x: 565, y: 205 },
      ],
    },
  },
  steps: [
    {
      id: "form_methylammonium",
      title: "Form methylammonium",
      fromStateId: "amine_reactants",
      toStateId: "methylammonium_intermediate",
      acceptedBundles: [
        [
          {
            source: { kind: "lone_pair", entityId: "lp_n_attack_1" },
            target: { kind: "atom", entityId: "c_methyl" },
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
          title: "Find the nucleophile",
          message:
            "One ammonia nitrogen has an available lone pair beside bromomethane. Start by identifying that electron source and the carbon bonded to bromine.",
          focusEntityIds: ["n_attacker", "lp_n_attack_1", "c_methyl", "bond_c_br"],
          revealsAcceptedBundle: false,
        },
        {
          level: 2,
          title: "Make the carbon–nitrogen bond",
          message:
            "Send N1's lone pair to C1. This begins the substitution but does not yet account for carbon's full octet.",
          focusEntityIds: ["lp_n_attack_1", "c_methyl"],
          revealsAcceptedBundle: false,
        },
        {
          level: 3,
          title: "Move the leaving-group pair",
          message:
            "In the same elementary step, move the C–Br bond pair onto bromine so carbon never carries five bonds.",
          focusEntityIds: ["c_methyl", "bond_c_br", "br_leaving"],
          revealsAcceptedBundle: false,
        },
        {
          level: 4,
          title: "Show the first complete bundle",
          message:
            "Preview: N1 lone pair → C1, and C–Br bond → Br1. Reproduce both arrows before checking.",
          focusEntityIds: ["lp_n_attack_1", "c_methyl", "bond_c_br", "br_leaving"],
          revealsAcceptedBundle: true,
        },
      ],
      feedback: {
        incomplete: {
          summary: "The substitution has started, but the concerted step is incomplete.",
          message:
            "Forming C–N and breaking C–Br belong in the same bundle. Add the companion electron movement before checking again.",
          focusEntityIds: ["n_attacker", "c_methyl", "bond_c_br", "br_leaving"],
        },
        bondDirection: [
          {
            sourceBondId: "bond_c_br",
            incorrectTargetAtomId: "c_methyl",
            code: "WRONG_LEAVING_GROUP_DIRECTION",
            summary: "The C–Br bond pair points toward the wrong atom.",
            message:
              "End the bond-source arrow on bromine so the leaving group retains the C–Br electron pair.",
            focusEntityIds: ["bond_c_br", "br_leaving"],
          },
        ],
        accepted: {
          summary: "Accepted: ammonia substitution forms the charged intermediate in one step.",
          message:
            "N1 forms C–N as bromide leaves. The resulting methylammonium and bromide charges are explicit and conserved.",
          focusEntityIds: ["n_attacker", "c_methyl", "bond_c_br", "br_leaving"],
        },
        notAccepted: {
          summary: "The arrows do not match the authored ammonia substitution.",
          message:
            "Use N1's lone pair to attack C1 and move the C–Br pair to Br1 in the same step.",
          focusEntityIds: ["lp_n_attack_1", "c_methyl", "bond_c_br", "br_leaving"],
        },
        committedSummary:
          "The methylammonium bromide intermediate is committed. Step 2 can now transfer the labeled proton.",
        commitActivitySummary: "Committed step 1: formed methylammonium bromide.",
      },
      negativeCases: [
        {
          id: "amine_step1_attack_only",
          title: "Attack without departure",
          arrows: [
            {
              source: { kind: "lone_pair", entityId: "lp_n_attack_1" },
              target: { kind: "atom", entityId: "c_methyl" },
            },
          ],
          expectedClassification: "incomplete",
          expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
        },
        {
          id: "amine_step1_departure_only",
          title: "Departure without attack",
          arrows: [
            {
              source: { kind: "bond", entityId: "bond_c_br" },
              target: { kind: "atom", entityId: "br_leaving" },
            },
          ],
          expectedClassification: "incomplete",
          expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
        },
        {
          id: "amine_step1_wrong_bond_direction",
          title: "Bond pair sent to carbon",
          arrows: [
            {
              source: { kind: "lone_pair", entityId: "lp_n_attack_1" },
              target: { kind: "atom", entityId: "c_methyl" },
            },
            {
              source: { kind: "bond", entityId: "bond_c_br" },
              target: { kind: "atom", entityId: "c_methyl" },
            },
          ],
          expectedClassification: "not_accepted_path",
          expectedReasonCode: "WRONG_LEAVING_GROUP_DIRECTION",
        },
        {
          id: "amine_step1_wrong_center",
          title: "Ammonia attacks bromine",
          arrows: [
            {
              source: { kind: "lone_pair", entityId: "lp_n_attack_1" },
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
    },
    {
      id: "deprotonate_methylammonium",
      title: "Release methylamine",
      fromStateId: "methylammonium_intermediate",
      toStateId: "amine_products",
      acceptedBundles: [
        [
          {
            source: { kind: "lone_pair", entityId: "lp_n_base_1" },
            target: { kind: "atom", entityId: "h_transfer" },
          },
          {
            source: { kind: "bond", entityId: "bond_n_attack_h_transfer" },
            target: { kind: "atom", entityId: "n_attacker" },
          },
        ],
      ],
      scaffold: [
        {
          level: 1,
          title: "Read the intermediate",
          message:
            "N1 is positively charged and still holds the labeled H1. The second ammonia, N2, has the lone pair available for the next step.",
          focusEntityIds: ["n_attacker", "h_transfer", "n_base", "lp_n_base_1"],
          revealsAcceptedBundle: false,
        },
        {
          level: 2,
          title: "Let the second ammonia act as base",
          message:
            "Begin at N2's lone pair and end at H1 to form the new N2–H1 bond.",
          focusEntityIds: ["lp_n_base_1", "h_transfer"],
          revealsAcceptedBundle: false,
        },
        {
          level: 3,
          title: "Return the old N–H pair",
          message:
            "H1 cannot remain bonded to both nitrogens. Move the original N1–H1 pair back to N1 in the same bundle.",
          focusEntityIds: ["bond_n_attack_h_transfer", "n_attacker", "h_transfer"],
          revealsAcceptedBundle: false,
        },
        {
          level: 4,
          title: "Show the second complete bundle",
          message:
            "Preview: N2 lone pair → H1, and N1–H1 bond → N1. Reproduce both arrows before checking.",
          focusEntityIds: ["lp_n_base_1", "h_transfer", "bond_n_attack_h_transfer", "n_attacker"],
          revealsAcceptedBundle: true,
        },
      ],
      feedback: {
        incomplete: {
          summary: "The proton transfer is on the accepted path, but the bundle is incomplete.",
          message:
            "Form N2–H1 and return the original N1–H1 bond pair to N1 in the same elementary step.",
          focusEntityIds: ["n_base", "lp_n_base_1", "h_transfer", "bond_n_attack_h_transfer", "n_attacker"],
        },
        bondDirection: [
          {
            sourceBondId: "bond_n_attack_h_transfer",
            incorrectTargetAtomId: "h_transfer",
            code: "WRONG_BOND_DIRECTION",
            summary: "The original N–H bond pair points toward the wrong atom.",
            message:
              "End the N1–H1 bond arrow on N1 so the transferred proton does not take that electron pair.",
            focusEntityIds: ["bond_n_attack_h_transfer", "n_attacker", "h_transfer"],
          },
        ],
        accepted: {
          summary: "Accepted: the second ammonia releases neutral methylamine.",
          message:
            "N2 accepts H1 while the original N1–H1 pair returns to N1. Methylamine, ammonium, and bromide keep the same atom inventory and net charge.",
          focusEntityIds: ["n_attacker", "h_transfer", "n_base", "br_leaving"],
        },
        notAccepted: {
          summary: "The arrows are processable but do not match the authored deprotonation.",
          message:
            "Use N2 as the base for H1, then move the original N1–H1 electron pair back to N1.",
          focusEntityIds: ["lp_n_base_1", "h_transfer", "bond_n_attack_h_transfer", "n_attacker"],
        },
        committedSummary:
          "Both authored steps are committed: methylamine and ammonium bromide are now shown.",
        commitActivitySummary: "Committed step 2: transferred the proton to ammonia.",
      },
      negativeCases: [
        {
          id: "amine_step2_accept_only",
          title: "New N–H bond without cleavage",
          arrows: [
            {
              source: { kind: "lone_pair", entityId: "lp_n_base_1" },
              target: { kind: "atom", entityId: "h_transfer" },
            },
          ],
          expectedClassification: "incomplete",
          expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
        },
        {
          id: "amine_step2_cleave_only",
          title: "N–H cleavage without acceptance",
          arrows: [
            {
              source: { kind: "bond", entityId: "bond_n_attack_h_transfer" },
              target: { kind: "atom", entityId: "n_attacker" },
            },
          ],
          expectedClassification: "incomplete",
          expectedReasonCode: "INCOMPLETE_CONCERTED_STEP",
        },
        {
          id: "amine_step2_wrong_bond_direction",
          title: "N–H pair sent to hydrogen",
          arrows: [
            {
              source: { kind: "lone_pair", entityId: "lp_n_base_1" },
              target: { kind: "atom", entityId: "h_transfer" },
            },
            {
              source: { kind: "bond", entityId: "bond_n_attack_h_transfer" },
              target: { kind: "atom", entityId: "h_transfer" },
            },
          ],
          expectedClassification: "not_accepted_path",
          expectedReasonCode: "WRONG_BOND_DIRECTION",
        },
        {
          id: "amine_step2_bromide_base",
          title: "Bromide accepts the proton",
          arrows: [
            {
              source: { kind: "lone_pair", entityId: "lp_br_1" },
              target: { kind: "atom", entityId: "h_transfer" },
            },
            {
              source: { kind: "bond", entityId: "bond_n_attack_h_transfer" },
              target: { kind: "atom", entityId: "n_attacker" },
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
        title: "OpenStax Organic Chemistry 11.3: Characteristics of the SN2 Reaction",
        urlOrDoi:
          "https://openstax.org/books/organic-chemistry/pages/11-3-characteristics-of-the-sn2-reaction",
        note:
          "Lists ammonia reacting with bromomethane to produce methylammonium in an SN2 comparison table.",
      },
      {
        title: "OpenStax Organic Chemistry 24.6: Synthesis of Amines",
        urlOrDoi: "https://openstax.org/books/organic-chemistry/pages/24-6-synthesis-of-amines",
        note:
          "Describes SN2 alkylation of ammonia with alkyl halides, formation of primary amines, and the risk of further alkylation.",
      },
      {
        title: "University of Calgary Organic Chemistry: RX plus NH3",
        urlOrDoi: "https://www.chem.ucalgary.ca/courses/350/Carey5th/Ch22/ch22-2-1-1.html",
        note:
          "Shows ammonia attack on an alkyl bromide followed by deprotonation of the ammonium center by excess ammonia.",
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
