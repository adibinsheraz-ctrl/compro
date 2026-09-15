export type IncidentType = "chance_used" | "fine";

export type Student = {
  id: string;
  name: string;
  roll_no: string;
  class_name?: string;
  chances_used: number;
  total_fine: number;
  created_at: string;
  updated_at: string;
};

export type Incident = {
  id: string;
  student_id: string;
  incident_date: string;
  type: IncidentType;
  amount: number;
  created_at: string;
};

export type Settings = {
  id: number;
  fine_amount: number;
  chances_allowed: number;
  updated_at: string;
};

export type LogIncidentResult = {
  incident: Incident;
  student: Student;
  result_type: IncidentType;
  amount: number;
  chances_allowed: number;
};

export function chanceRemaining(
  student: Pick<Student, "chances_used">,
  settings: Pick<Settings, "chances_allowed">
): number {
  return Math.max(settings.chances_allowed - student.chances_used, 0);
}

export function isChanceExhausted(
  student: Pick<Student, "chances_used">,
  settings: Pick<Settings, "chances_allowed">
): boolean {
  return student.chances_used >= settings.chances_allowed;
}

/** Pure prediction of what the next log would do (UI only — DB is source of truth). */
export function predictIncident(
  student: Pick<Student, "chances_used" | "total_fine">,
  settings: Pick<Settings, "chances_allowed" | "fine_amount">
): { type: IncidentType; amount: number; nextTotalFine: number } {
  if (student.chances_used < settings.chances_allowed) {
    return {
      type: "chance_used",
      amount: 0,
      nextTotalFine: student.total_fine,
    };
  }
  return {
    type: "fine",
    amount: settings.fine_amount,
    nextTotalFine: student.total_fine + settings.fine_amount,
  };
}
