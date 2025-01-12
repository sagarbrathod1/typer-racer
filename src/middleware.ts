import { authMiddleware } from '@clerk/nextjs';

const middleware = authMiddleware({
    publicRoutes: ['/api/pingDatabase', '/'],
    beforeAuth: (req) => {
        // Completely skip auth for pingDatabase endpoint
        if (req.nextUrl.pathname === '/api/pingDatabase') {
            return true;
        }
    }
});

export default middleware;

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/'],
};
