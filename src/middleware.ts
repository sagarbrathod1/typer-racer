import { authMiddleware } from '@clerk/nextjs';

const middleware = authMiddleware({
    ignoredRoutes: ['/((?!api|trpc))(_next.*|.+.[w]+$)', '/api/pingDatabase'],
});

export default middleware;

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/'],
};
