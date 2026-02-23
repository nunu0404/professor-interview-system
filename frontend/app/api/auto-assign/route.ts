import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Auto-assign students to sessions based on their 1→2→3 preference
export async function POST() {
    try {
        const db = getDb();

        const students = db.prepare('SELECT * FROM students').all() as {
            id: number; choice1_lab_id: number; choice2_lab_id: number; choice3_lab_id: number;
        }[];
        const labs = db.prepare('SELECT * FROM labs').all() as { id: number; capacity: number }[];

        // Track how many are assigned to each lab per session
        const slotCount: Record<number, Record<number, number>> = {};
        labs.forEach(lab => { slotCount[lab.id] = { 1: 0, 2: 0, 3: 0 }; });

        // Load existing assignments to count slots already used
        const existing = db.prepare('SELECT * FROM assignments').all() as {
            student_id: number; session_number: number; lab_id: number;
        }[];
        existing.forEach(a => {
            if (slotCount[a.lab_id]) slotCount[a.lab_id][a.session_number]++;
        });

        const getCapacity = (labId: number) => labs.find(l => l.id === labId)?.capacity ?? 5;

        let assigned = 0;
        const upsert = db.prepare(`
      INSERT INTO assignments (student_id, session_number, lab_id, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, session_number)
      DO UPDATE SET lab_id = excluded.lab_id, updated_at = CURRENT_TIMESTAMP
    `);

        // For each student, try to assign them to 3 different sessions using their preferences
        for (const student of students) {
            const choices = [student.choice1_lab_id, student.choice2_lab_id, student.choice3_lab_id].filter(Boolean);
            const sessionsUsed = new Set<number>();
            const labsUsed = new Set<number>();

            // Get sessions already assigned for this student
            const studentAssignments = db.prepare(
                'SELECT session_number, lab_id FROM assignments WHERE student_id = ?'
            ).all(student.id) as { session_number: number; lab_id: number }[];
            studentAssignments.forEach(a => {
                sessionsUsed.add(a.session_number);
                labsUsed.add(a.lab_id);
            });

            for (const session of [1, 2, 3]) {
                if (sessionsUsed.has(session)) continue; // already assigned

                // Try 1st→2nd→3rd choice
                let assigned_lab: number | null = null;
                for (const labId of choices) {
                    if (labsUsed.has(labId)) continue; // don't repeat lab
                    if (slotCount[labId][session] < getCapacity(labId)) {
                        assigned_lab = labId;
                        break;
                    }
                }

                // Fallback: any lab with space in this session
                if (!assigned_lab) {
                    for (const lab of labs) {
                        if (labsUsed.has(lab.id)) continue;
                        if (slotCount[lab.id][session] < getCapacity(lab.id)) {
                            assigned_lab = lab.id;
                            break;
                        }
                    }
                }

                if (assigned_lab) {
                    upsert.run(student.id, session, assigned_lab);
                    slotCount[assigned_lab][session]++;
                    sessionsUsed.add(session);
                    labsUsed.add(assigned_lab);
                    assigned++;
                }
            }
        }

        return NextResponse.json({ success: true, assigned });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
