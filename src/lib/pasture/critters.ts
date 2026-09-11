/**
 * Everyone on the field who is not a cow: the farmer, and the office pets
 * from #moon-bean-appreciation, who run laps around the pens having a nice time.
 */
export type CritterKind = "dog" | "cat" | "farmer"

export type Critter = {
  id: string
  name: string
  kind: CritterKind
  /** One line for the hover card. */
  blurb: string
  /** Coat colour; the farmer's is his hoodie. */
  body: string
  /** Second colour: a muzzle and chest for dogs, unused for cats. */
  patch?: string
  eyes: string
  /** Relative size; a cow is 1. */
  size: number
  ears: "floppy" | "up" | "point"
  legs: "short" | "regular"
  /** Cruising speed in field units per second. */
  speed: number
  /** Whose heels this one stays on. */
  follows?: string
}

export const FARMER_ID = "kobi"

export const CRITTERS: Critter[] = [
  {
    id: FARMER_ID,
    name: "Kobi",
    kind: "farmer",
    blurb: "The farmer. Walks the fences. Do not click.",
    body: "#1c1c1c",
    eyes: "#1d1917",
    size: 1,
    ears: "up",
    legs: "regular",
    speed: 1.6,
  },
  {
    id: "moon",
    name: "Moon",
    kind: "dog",
    blurb: "Kobi's queen. Does NOT want to go on a walk.",
    body: "#efe9dc",
    patch: "#f8f5ee",
    eyes: "#2b1d14",
    size: 0.84,
    ears: "floppy",
    legs: "regular",
    speed: 3.4,
    follows: FARMER_ID,
  },
  {
    id: "bean",
    name: "Bean",
    kind: "dog",
    blurb: "Kobi's other one. Famous for the bean lean.",
    body: "#c0763d",
    patch: "#e8c79a",
    eyes: "#2b1d14",
    size: 0.68,
    ears: "floppy",
    legs: "short",
    speed: 2.6,
    follows: FARMER_ID,
  },
  {
    id: "waffles",
    name: "Waffles",
    kind: "dog",
    blurb: "Mallory's prince. Every photo a renaissance painting.",
    body: "#d9a45f",
    patch: "#f7f1e6",
    eyes: "#2b1d14",
    size: 0.68,
    ears: "floppy",
    legs: "regular",
    speed: 3.8,
  },
  {
    id: "felix",
    name: "Felix",
    kind: "cat",
    blurb: "Office cat, north corner. Profoundly masculine.",
    body: "#141414",
    eyes: "#7bd389",
    size: 0.58,
    ears: "point",
    legs: "regular",
    speed: 2.8,
  },
  {
    id: "haru",
    name: "Haru",
    kind: "cat",
    blurb: "Office cat, south corner. It's her desk now.",
    body: "#181818",
    eyes: "#f0c419",
    size: 0.52,
    ears: "point",
    legs: "regular",
    speed: 3.2,
  },
]

export const critterByID = (id: string) => CRITTERS.find((critter) => critter.id === id)

/** What the farmer says when you click him. He is busy. */
export const FARMER_LINES = [
  "Get back to work.",
  "Those PRs won't review themselves.",
  "I'm not paying you to click on me.",
  "Cows to move. Comments to resolve. Chop chop.",
  "Ship it. Then we'll talk.",
  "You've got three unresolved threads and you're poking a farmer?",
  "Queues are lookin' healthy. Your PR isn't.",
]
