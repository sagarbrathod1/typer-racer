import { authMiddleware } from '@clerk/nextjs';

const middleware = authMiddleware({
    publicRoutes: ['/api/pingDatabase'],
});

export default middleware;

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/'],
};
