import { NextResponse } from 'next/server';
import { networkInterfaces } from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const nets = networkInterfaces();
        let ip = 'localhost';
        for (const name of Object.keys(nets)) {
            for (const net of nets[name] || []) {
                if (net.family === 'IPv4' && !net.internal) {
                    ip = net.address;
                    break;
                }
            }
            if (ip !== 'localhost') break;
        }
        return NextResponse.json({ ip });
    } catch (e) {
        return NextResponse.json({ ip: 'localhost' });
    }
}
