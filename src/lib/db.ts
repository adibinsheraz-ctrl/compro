import { getAdminDb } from "./supabase";
import type {
  Incident,
  LogIncidentResult,
  PublicSettings,
  PublicStudent,
  Settings,
  Student,
} from "./types";

export async function getPublicSettings(): Promise<PublicSettings> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("settings")
    .select("fine_amount, chances_allowed")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return { fine_amount: 50, chances_allowed: 1 };
  }

  return data as PublicSettings;
}

export async function listPublicStudents(): Promise<PublicStudent[]> {
  const db = getAdminDb();
  try {
    const { data, error } = await db
      .from("students")
      .select("id, name, roll_no, class_name, chances_used, total_fine")
      .order("name", { ascending: true });

    if (!error && data) {
      return data as PublicStudent[];
    }
  } catch {
    // column class_name may not exist yet
  }

  const { data, error } = await db
    .from("students")
    .select("id, name, roll_no, chances_used, total_fine")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PublicStudent[];
}



export async function getSettings(): Promise<Settings> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Settings missing");
  }

  return data as Settings;
}

export async function updateSettings(input: {
  fine_amount: number;
  chances_allowed: number;
}): Promise<Settings> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("settings")
    .update({
      fine_amount: input.fine_amount,
      chances_allowed: input.chances_allowed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update settings");
  }

  return data as Settings;
}

export async function listStudents(): Promise<Student[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("students")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Student[];
}

export async function getStudent(id: string): Promise<Student | null> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Student) ?? null;
}

export async function createStudent(input: {
  name: string;
  roll_no: string;
  class_name?: string;
}): Promise<Student> {
  const db = getAdminDb();
  if (input.class_name) {
    try {
      const res = await db
        .from("students")
        .insert({
          name: input.name.trim(),
          roll_no: input.roll_no.trim(),
          class_name: input.class_name.trim(),
        })
        .select("*")
        .single();

      if (!res.error && res.data) {
        return res.data as Student;
      }
      // If the error is due to column not existing in DB, fallback to insert without class_name
      if (res.error && (res.error.message.includes("class_name") || res.error.code === "42703" || res.error.code === "PGRST204")) {
        console.warn("class_name column not found in students table, falling back to standard insert");
      } else if (res.error) {
        throw new Error(res.error.message);
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes("class_name")) {
        throw e;
      }
    }
  }

  const { data, error } = await db
    .from("students")
    .insert({
      name: input.name.trim(),
      roll_no: input.roll_no.trim(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create student");
  }

  return data as Student;
}

export async function updateStudent(
  id: string,
  input: { name: string; roll_no: string; class_name?: string }
): Promise<Student> {
  const db = getAdminDb();
  if (input.class_name !== undefined) {
    try {
      const res = await db
        .from("students")
        .update({
          name: input.name.trim(),
          roll_no: input.roll_no.trim(),
          class_name: input.class_name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (!res.error && res.data) {
        return res.data as Student;
      }
    } catch {
      // Fallback if class_name doesn't exist
    }
  }

  const { data, error } = await db
    .from("students")
    .update({
      name: input.name.trim(),
      roll_no: input.roll_no.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update student");
  }

  return data as Student;
}

export async function deleteStudent(id: string): Promise<void> {
  const db = getAdminDb();
  const { error } = await db.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listIncidents(studentId: string): Promise<Incident[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("incidents")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Incident[];
}

export async function logIncident(
  studentId: string
): Promise<LogIncidentResult> {
  const db = getAdminDb();
  const { data, error } = await db.rpc("log_student_incident", {
    p_student_id: studentId,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to log incident");
  }

  return data as LogIncidentResult;
}

export async function undoLastIncident(studentId: string): Promise<{
  undone: Incident;
  student: Student;
}> {
  const db = getAdminDb();
  const { data, error } = await db.rpc("undo_last_incident", {
    p_student_id: studentId,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to undo incident");
  }

  return data as { undone: Incident; student: Student };
}
