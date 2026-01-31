import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, password } = body;

        if (!userId || !password) {
            return NextResponse.json({ error: 'User ID and Password are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { authProviderId: userId },
        });

        console.log('Login attempt:', { userId, providedPassword: password });
        console.log('Found user:', user ? { id: user.id, authId: user.authProviderId, hasPassword: !!user.password, passwordMatch: user.password === password } : 'null');

        if (!user || user.password !== password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error logging in:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
