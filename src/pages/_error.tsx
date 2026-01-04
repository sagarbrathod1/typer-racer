import { NextPageContext } from 'next';
import Link from 'next/link';

interface ErrorProps {
    statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
    const title =
        statusCode === 404
            ? 'Page not found'
            : statusCode
            ? `${statusCode} - Server error`
            : 'An error occurred';

    const message =
        statusCode === 404
            ? "The page you're looking for doesn't exist."
            : statusCode && statusCode >= 500
            ? 'Something went wrong on our end. Please try again later.'
            : 'An unexpected error occurred. Please try again.';

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="text-center p-8 max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                <Link
                    href="/"
                    className="inline-block px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded hover:opacity-80 transition-opacity"
                >
                    Go home
                </Link>
            </div>
        </div>
    );
}

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
    const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
    return { statusCode };
};

export default Error;
