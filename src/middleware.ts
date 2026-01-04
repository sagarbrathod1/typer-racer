import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export default authMiddleware({
    publicRoutes: ['/', '/typer-racer'],
    ignoredRoutes: ['/api/pingDatabase'],
    beforeAuth: (req) => {
        if (
            req.nextUrl.pathname === '/api/pingDatabase' &&
            req.headers.get('x-vercel-cron') === 'true'
        ) {
            return NextResponse.next();
        }
        return undefined;
    },
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
