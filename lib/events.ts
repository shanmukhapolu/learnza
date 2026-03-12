import { Globe, Dna, FlaskConical, Landmark, Calculator, TrendingUp } from "lucide-react";

export interface ApCourse {
  id: string;
  name: string;
  description: string;
  icon: any;
  questionBankFile: string;
}

export const AP_COURSES: ApCourse[] = [
  {
    id: "ap-world",
    name: "AP World History",
    description: "Master global history from 1200 CE to the present — civilizations, trade, revolutions, and more",
    icon: Globe,
    questionBankFile: "/questions/ap-world.json",
  },
  {
    id: "ap-bio",
    name: "AP Biology",
    description: "Deep dive into cellular biology, genetics, evolution, ecology, and biological systems",
    icon: Dna,
    questionBankFile: "/questions/ap-bio.json",
  },
  {
    id: "ap-chem",
    name: "AP Chemistry",
    description: "Explore atomic structure, bonding, thermodynamics, kinetics, and chemical equilibria",
    icon: FlaskConical,
    questionBankFile: "/questions/ap-chem.json",
  },
  {
    id: "ap-euro",
    name: "AP European History",
    description: "Survey European history from the Renaissance through the modern era — politics, culture, and society",
    icon: Landmark,
    questionBankFile: "/questions/ap-euro.json",
  },
  {
    id: "ap-precalc",
    name: "AP Precalculus",
    description: "Build foundational skills in functions, polynomials, trigonometry, and mathematical reasoning",
    icon: Calculator,
    questionBankFile: "/questions/ap-precalc.json",
  },
  {
    id: "ap-macro",
    name: "AP Macroeconomics",
    description: "Understand national economies, fiscal policy, monetary systems, GDP, and international trade",
    icon: TrendingUp,
    questionBankFile: "/questions/ap-macro.json",
  },
];

// Legacy aliases so existing imports still resolve
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
