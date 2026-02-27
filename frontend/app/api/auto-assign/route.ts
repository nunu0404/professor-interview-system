import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

        let assigned = 0;
        const upsert = db.prepare(`
            INSERT INTO assignments (student_id, session_number, lab_id, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(student_id, session_number)
            DO UPDATE SET lab_id = excluded.lab_id, updated_at = CURRENT_TIMESTAMP
        `);

        // Helper: pick a random lab different from `excludeIds`
        const getRandomLab = (excludeIds: Set<number>) => {
            const available = labs.filter(l => !excludeIds.has(l.id));
            if (available.length === 0) return labs.length > 0 ? labs[0].id : 0;
            return available[Math.floor(Math.random() * available.length)].id;
        };

        // Helper: generate permutations of an array
        function generatePermutations<T>(arr: T[]): T[][] {
            if (arr.length <= 1) return [arr];
            const result: T[][] = [];
            for (let i = 0; i < arr.length; i++) {
                const current = arr[i];
                const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
                const remainingPerms = generatePermutations(remaining);
                for (const perm of remainingPerms) {
                    result.push([current, ...perm]);
                }
            }
            return result;
        }

        // Shuffle students array to avoid alphabetical bias (randomize evaluation order)
        for (let i = students.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [students[i], students[j]] = [students[j], students[i]];
        }

        db.transaction(() => {
            for (const student of students) {
                // Get sessions already assigned for this student
                const studentAssignments = db.prepare(
                    'SELECT session_number, lab_id FROM assignments WHERE student_id = ?'
                ).all(student.id) as { session_number: number; lab_id: number }[];
                
                const sessionsUsed = new Set<number>();
                const labsUsed = new Set<number>();
                studentAssignments.forEach(a => {
                    sessionsUsed.add(a.session_number);
                    labsUsed.add(a.lab_id);
                });

                // Which sessions need to be filled?
                const sessionsToFill = [1, 2, 3].filter(s => !sessionsUsed.has(s));
                if (sessionsToFill.length === 0) continue; // Already fully assigned

                // Collect intended unique choices not yet visited
                const choices = [student.choice1_lab_id, student.choice2_lab_id, student.choice3_lab_id].filter(Boolean);
                const intendedLabsSet = new Set<number>();
                choices.forEach(id => {
                    if (!labsUsed.has(id)) intendedLabsSet.add(id);
                });

                // We need exactly exactly `sessionsToFill.length` labs. Fill blanks with random unvisited labs.
                while (intendedLabsSet.size < sessionsToFill.length) {
                    const rLab = getRandomLab(new Set([...labsUsed, ...intendedLabsSet]));
                    if (rLab === 0) break; // Emergency break if no labs exist at all
                    intendedLabsSet.add(rLab);
                }

                const labsToAssign = Array.from(intendedLabsSet).slice(0, sessionsToFill.length);
                if (labsToAssign.length !== sessionsToFill.length) continue; // Should rarely happen unless 0 labs

                // Permute sessions mappings to minimize load
                const perms = generatePermutations(sessionsToFill);
                
                let bestPerm = perms[0];
                let minScore = Infinity;

                for (const p of perms) {
                    let maxLoad = 0;
                    let sumLoad = 0;
                    for (let i = 0; i < p.length; i++) {
                        const sessionNum = p[i];
                        const labId = labsToAssign[i];
                        const count = slotCount[labId] ? slotCount[labId][sessionNum] : 0;
                        if (count > maxLoad) maxLoad = count;
                        sumLoad += count;
                    }
                    const totalScore = maxLoad * 1000 + sumLoad;
                    if (totalScore < minScore) {
                        minScore = totalScore;
                        bestPerm = p;
                    }
                }

                // Execute the best assignment permutation
                for (let i = 0; i < bestPerm.length; i++) {
                    const sessionNum = bestPerm[i];
                    const labId = labsToAssign[i];
                    upsert.run(student.id, sessionNum, labId);
                    if (slotCount[labId]) slotCount[labId][sessionNum]++;
                    assigned++;
                }
            }
        })();

        return NextResponse.json({ success: true, assigned });
    } catch (e) {
        console.error("Auto Assign Error:", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
