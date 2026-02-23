import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Extend settings to support close_at timer
function ensureSettings(db: ReturnType<typeof import('@/lib/db').getDb>) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('registration_open', 'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('registration_close_at', '');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('results_published', 'false');
  `);
}

export async function GET() {
    try {
        const db = getDb();
        ensureSettings(db);
        const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
        const map: Record<string, string> = {};
        rows.forEach(r => { map[r.key] = r.value; });

        // Auto-close check
        const closeAt = map['registration_close_at'];
        if (closeAt && new Date(closeAt) <= new Date()) {
            db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('registration_open', 'false')").run();
            map['registration_open'] = 'false';
        }

        return NextResponse.json({
            registration_open: map['registration_open'] === 'true',
            registration_close_at: map['registration_close_at'] || null,
            results_published: map['results_published'] === 'true',
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const db = getDb();
        ensureSettings(db);
        const body = await req.json();

        const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

        if ('registration_open' in body) {
            upsert.run('registration_open', body.registration_open ? 'true' : 'false');
            // If manually opening, clear the auto-close timer
            if (body.registration_open) {
                upsert.run('registration_close_at', '');
            }
        }
        if ('registration_close_at' in body) {
            upsert.run('registration_close_at', body.registration_close_at || '');
            // Also open registration when timer is set
            if (body.registration_close_at) {
                upsert.run('registration_open', 'true');
            }
        }
        if ('results_published' in body) {
            upsert.run('results_published', body.results_published ? 'true' : 'false');
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
