// Mock data for teacher analytics dashboard

export interface MockStudent {
  id: string;
  name: string;
  accuracy: number;
  questionsAttempted: number;
  currentStreak?: number;
  daysInactive?: number;
  improvement?: number;
  previousAccuracy?: number;
  doubtsCount?: number;
  lastActive?: string;
}

export interface MockQuestion {
  id: string;
  title: string;
  chapter: string;
  type: "MCQ" | "Integer";
  accuracy: number;
  attemptCount: number;
  solutionViews?: number;
  doubtCount?: number;
  wrongCount?: number;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface MockBatch {
  id: string;
  name: string;
  totalStudents: number;
  avgAccuracy: number;
  totalPracticeCount: number;
  doubtsPending: number;
  status: "Active" | "Archived";
}

// Top performing students
export const topPerformingStudents: MockStudent[] = [
  {
    id: "1",
    name: "Aarjav Patel",
    accuracy: 92,
    questionsAttempted: 287,
    currentStreak: 15,
  },
  {
    id: "2",
    name: "Divya Sharma",
    accuracy: 89,
    questionsAttempted: 265,
    currentStreak: 12,
  },
  {
    id: "3",
    name: "Rohan Kumar",
    accuracy: 88,
    questionsAttempted: 243,
    currentStreak: 10,
  },
];

// Weak students
export const weakStudents: MockStudent[] = [
  {
    id: "4",
    name: "Priya Singh",
    accuracy: 48,
    questionsAttempted: 95,
    doubtsCount: 8,
  },
  {
    id: "5",
    name: "Akshay Verma",
    accuracy: 52,
    questionsAttempted: 112,
    doubtsCount: 6,
  },
  {
    id: "6",
    name: "Nisha Kapoor",
    accuracy: 55,
    questionsAttempted: 103,
    doubtsCount: 5,
  },
];

// Most improved students
export const mostImprovedStudents: MockStudent[] = [
  {
    id: "7",
    name: "Ravi Desai",
    improvement: 32,
    previousAccuracy: 58,
    accuracy: 78,
    questionsAttempted: 156,
  },
  {
    id: "8",
    name: "Zara Khan",
    improvement: 28,
    previousAccuracy: 62,
    accuracy: 82,
    questionsAttempted: 189,
  },
  {
    id: "9",
    name: "Aditya Nair",
    improvement: 24,
    previousAccuracy: 66,
    accuracy: 85,
    questionsAttempted: 178,
  },
];

// Inactive students
export const inactiveStudents: MockStudent[] = [
  {
    id: "10",
    name: "Harsh Patel",
    daysInactive: 15,
    lastActive: "2025-05-08",
    accuracy: 68,
    questionsAttempted: 124,
  },
  {
    id: "11",
    name: "Sneha Gupta",
    daysInactive: 12,
    lastActive: "2025-05-11",
    accuracy: 71,
    questionsAttempted: 145,
  },
  {
    id: "12",
    name: "Vikram Joshi",
    daysInactive: 18,
    lastActive: "2025-05-05",
    accuracy: 62,
    questionsAttempted: 98,
  },
];

// Most wrong questions
export const mostWrongQuestions: MockQuestion[] = [
  {
    id: "q1",
    title: "Complex Numbers - Argument Calculation",
    chapter: "Complex Numbers",
    type: "MCQ",
    accuracy: 35,
    attemptCount: 234,
    wrongCount: 152,
    difficulty: "Medium",
  },
  {
    id: "q2",
    title: "Differential Equations - Exact Method",
    chapter: "Differential Equations",
    type: "Integer",
    accuracy: 42,
    attemptCount: 198,
    wrongCount: 115,
    difficulty: "Hard",
  },
  {
    id: "q3",
    title: "Vectors - 3D Geometry Relations",
    chapter: "3D Geometry",
    type: "MCQ",
    accuracy: 48,
    attemptCount: 187,
    wrongCount: 97,
    difficulty: "Hard",
  },
];

// Most viewed solutions
export const mostViewedSolutions: MockQuestion[] = [
  {
    id: "q4",
    title: "Trigonometric Equations - General Solutions",
    chapter: "Trigonometry",
    type: "MCQ",
    accuracy: 68,
    attemptCount: 312,
    solutionViews: 487,
    difficulty: "Medium",
  },
  {
    id: "q5",
    title: "Integration by Parts - Logarithmic",
    chapter: "Calculus",
    type: "Integer",
    accuracy: 71,
    attemptCount: 289,
    solutionViews: 421,
    difficulty: "Medium",
  },
  {
    id: "q6",
    title: "Probability - Conditional Problems",
    chapter: "Probability",
    type: "MCQ",
    accuracy: 64,
    attemptCount: 276,
    solutionViews: 398,
    difficulty: "Medium",
  },
];

// Highest doubt questions
export const highestDoubtQuestions: MockQuestion[] = [
  {
    id: "q7",
    title: "Quadratic Equations - Nature of Roots",
    chapter: "Algebra",
    type: "MCQ",
    accuracy: 72,
    attemptCount: 245,
    doubtCount: 24,
    difficulty: "Medium",
  },
  {
    id: "q8",
    title: "Coordination - Oxidation States",
    chapter: "Chemistry",
    type: "Integer",
    accuracy: 68,
    attemptCount: 156,
    doubtCount: 18,
    difficulty: "Medium",
  },
  {
    id: "q9",
    title: "Electrostatics - Gauss Law Application",
    chapter: "Physics",
    type: "MCQ",
    accuracy: 59,
    attemptCount: 203,
    doubtCount: 16,
    difficulty: "Hard",
  },
];

// Lowest accuracy questions
export const lowestAccuracyQuestions: MockQuestion[] = [
  {
    id: "q10",
    title: "Matrices - Rank & Nullity",
    chapter: "Linear Algebra",
    type: "Integer",
    accuracy: 31,
    attemptCount: 156,
    difficulty: "Hard",
  },
  {
    id: "q11",
    title: "Permutations & Combinations - Advanced",
    chapter: "Combinatorics",
    type: "MCQ",
    accuracy: 38,
    attemptCount: 189,
    difficulty: "Hard",
  },
  {
    id: "q12",
    title: "Organic Chemistry - Mechanism Identification",
    chapter: "Organic Chemistry",
    type: "MCQ",
    accuracy: 44,
    attemptCount: 167,
    difficulty: "Hard",
  },
];

// Batch overview
export const teacherBatches: MockBatch[] = [
  {
    id: "b1",
    name: "JEE Main 2025 - Batch A",
    totalStudents: 45,
    avgAccuracy: 72,
    totalPracticeCount: 1200,
    doubtsPending: 5,
    status: "Active",
  },
  {
    id: "b2",
    name: "JEE Advanced 2025 - Batch B",
    totalStudents: 28,
    avgAccuracy: 65,
    totalPracticeCount: 890,
    doubtsPending: 12,
    status: "Active",
  },
  {
    id: "b3",
    name: "Topic Wise - Chemistry Batch",
    totalStudents: 62,
    avgAccuracy: 78,
    totalPracticeCount: 2100,
    doubtsPending: 3,
    status: "Active",
  },
  {
    id: "b4",
    name: "Crash Course - Physics",
    totalStudents: 38,
    avgAccuracy: 68,
    totalPracticeCount: 950,
    doubtsPending: 8,
    status: "Active",
  },
  {
    id: "b5",
    name: "Previous Year Papers",
    totalStudents: 55,
    avgAccuracy: 75,
    totalPracticeCount: 1650,
    doubtsPending: 2,
    status: "Active",
  },
  {
    id: "b6",
    name: "Mock Tests 2024",
    totalStudents: 42,
    avgAccuracy: 70,
    totalPracticeCount: 840,
    doubtsPending: 6,
    status: "Archived",
  },
];

// Helper functions
export function getStudentStatusBadge(
  student: MockStudent
): "🔥 Excellent" | "⚠️ Needs Help" | "📈 Improving" | "😴 Inactive" {
  if (student.daysInactive && student.daysInactive > 10) return "😴 Inactive";
  if (student.improvement && student.improvement > 20) return "📈 Improving";
  if (student.accuracy >= 80) return "🔥 Excellent";
  if (student.accuracy < 60) return "⚠️ Needs Help";
  return "📈 Improving";
}

export function getQuestionDifficultyColor(
  difficulty: "Easy" | "Medium" | "Hard"
): string {
  switch (difficulty) {
    case "Easy":
      return "bg-green-500/15 text-green-300";
    case "Medium":
      return "bg-yellow-500/15 text-yellow-300";
    case "Hard":
      return "bg-red-500/15 text-red-300";
  }
}

export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return "text-green-400";
  if (accuracy >= 60) return "text-yellow-400";
  return "text-red-400";
}

export function getAccuracyBgColor(accuracy: number): string {
  if (accuracy >= 80) return "bg-green-500/15";
  if (accuracy >= 60) return "bg-yellow-500/15";
  return "bg-red-500/15";
}
