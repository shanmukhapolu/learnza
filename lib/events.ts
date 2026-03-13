import { Globe, Dna, FlaskConical, Landmark, Calculator, TrendingUp } from "lucide-react";

export interface ApCourse {
  id: string;
  name: string;
  description: string;
  icon: any;
  questionBankFile: string;
  examDate?: string; // AP exam date (e.g., "May 12, 2025")
  examFormat?: string; // Brief exam format description
  units?: string[]; // Course units
}

export const AP_COURSES: ApCourse[] = [
  {
    id: "ap-world",
    name: "AP World History",
    description: "Master global history from 1200 CE to the present — civilizations, trade, revolutions, and more",
    icon: Globe,
    questionBankFile: "/questions/ap-world.json",
    examDate: "May 8, 2025",
    examFormat: "Section I: 55 MCQs (55 min) + 3 SAQs (40 min). Section II: 1 DBQ (60 min) + 1 LEQ (40 min)",
    units: ["Unit 1: The Global Tapestry", "Unit 2: Networks of Exchange", "Unit 3: Land-Based Empires", "Unit 4: Transoceanic Interconnections", "Unit 5: Revolutions", "Unit 6: Consequences of Industrialization", "Unit 7: Global Conflict", "Unit 8: Cold War and Decolonization", "Unit 9: Globalization"],
  },
  {
    id: "ap-bio",
    name: "AP Biology",
    description: "Deep dive into cellular biology, genetics, evolution, ecology, and biological systems",
    icon: Dna,
    questionBankFile: "/questions/ap-bio.json",
    examDate: "May 12, 2025",
    examFormat: "Section I: 60 MCQs (90 min). Section II: 6 FRQs (90 min) including 2 long and 4 short",
    units: ["Unit 1: Chemistry of Life", "Unit 2: Cell Structure and Function", "Unit 3: Cellular Energetics", "Unit 4: Cell Communication and Cell Cycle", "Unit 5: Heredity", "Unit 6: Gene Expression and Regulation", "Unit 7: Natural Selection", "Unit 8: Ecology"],
  },
  {
    id: "ap-chem",
    name: "AP Chemistry",
    description: "Explore atomic structure, bonding, thermodynamics, kinetics, and chemical equilibria",
    icon: FlaskConical,
    questionBankFile: "/questions/ap-chem.json",
    examDate: "May 5, 2025",
    examFormat: "Section I: 60 MCQs (90 min). Section II: 7 FRQs (105 min) including 3 long and 4 short",
    units: ["Unit 1: Atomic Structure and Properties", "Unit 2: Molecular and Ionic Compound Structure", "Unit 3: Intermolecular Forces", "Unit 4: Chemical Reactions", "Unit 5: Kinetics", "Unit 6: Thermodynamics", "Unit 7: Equilibrium", "Unit 8: Acids and Bases", "Unit 9: Applications of Thermodynamics"],
  },
  {
    id: "ap-euro",
    name: "AP European History",
    description: "Survey European history from the Renaissance through the modern era — politics, culture, and society",
    icon: Landmark,
    questionBankFile: "/questions/ap-euro.json",
    examDate: "May 6, 2025",
    examFormat: "Section I: 55 MCQs (55 min) + 3 SAQs (40 min). Section II: 1 DBQ (60 min) + 1 LEQ (40 min)",
    units: ["Unit 1: Renaissance and Exploration", "Unit 2: Age of Reformation", "Unit 3: Absolutism and Constitutionalism", "Unit 4: Scientific, Philosophical, and Political Developments", "Unit 5: Conflict, Crisis, and Reaction", "Unit 6: Industrialization and Its Effects", "Unit 7: 19th-Century Perspectives and Political Developments", "Unit 8: 20th-Century Global Conflicts", "Unit 9: Cold War and Contemporary Europe"],
  },
  {
    id: "ap-precalc",
    name: "AP Precalculus",
    description: "Build foundational skills in functions, polynomials, trigonometry, and mathematical reasoning",
    icon: Calculator,
    questionBankFile: "/questions/ap-precalc.json",
    examDate: "May 13, 2025",
    examFormat: "Section I: 40 MCQs (2 hours). Section II: 4 FRQs (1 hour)",
    units: ["Unit 1: Polynomial and Rational Functions", "Unit 2: Exponential and Logarithmic Functions", "Unit 3: Trigonometric and Polar Functions", "Unit 4: Functions Involving Parameters, Vectors, and Matrices"],
  },
  {
    id: "ap-macro",
    name: "AP Macroeconomics",
    description: "Understand national economies, fiscal policy, monetary systems, GDP, and international trade",
    icon: TrendingUp,
    questionBankFile: "/questions/ap-macro.json",
    examDate: "May 5, 2025",
    examFormat: "Section I: 60 MCQs (70 min). Section II: 3 FRQs (60 min) including 1 long and 2 short",
    units: ["Unit 1: Basic Economic Concepts", "Unit 2: Economic Indicators and the Business Cycle", "Unit 3: National Income and Price Determination", "Unit 4: Financial Sector", "Unit 5: Long-Run Consequences of Stabilization Policies", "Unit 6: Open Economy—International Trade and Finance"],
  },
];

// Legacy alias so existing imports still resolve
export const HOSA_EVENTS = AP_COURSES;

export function getCourseById(courseId: string): ApCourse | undefined {
  return AP_COURSES.find((course) => course.id === courseId);
}

export function getEventById(eventId: string): ApCourse | undefined {
  return getCourseById(eventId);
}

export function getCourseName(courseId: string): string {
  const course = getCourseById(courseId);
  return course?.name || courseId;
}

export function getEventName(eventId: string): string {
  return getCourseName(eventId);
}
