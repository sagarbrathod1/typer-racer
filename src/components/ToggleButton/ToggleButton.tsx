import { useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { UserButton } from '@clerk/nextjs';

const ToggleButton = (): JSX.Element => {
    const { theme, setTheme } = useTheme();

    const switchTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [setTheme, theme]);

    const themeClassName = useMemo(() => (theme === 'dark' ? 'dark' : ''), [theme]);

    const DarkIcon = useCallback(
        (): JSX.Element => (
            <svg
                className="w-6 h-6 md:w-8 md:h-8"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
            </svg>
        ),
        []
    );

    const LightIcon = useCallback(
        (): JSX.Element => (
            <svg
                className="w-6 h-6 md:w-8 md:h-8"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#EA9613"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
        ),
        []
    );

    return (
        <>
            <div className={`${themeClassName} absolute top-4 left-4 z-10`}>
                <div className="dark:text-gray-200">
                    <span
                        onClick={switchTheme}
                        className="active:outline-none focus:outline-none cursor-pointer"
                    >
                        {theme === 'dark' ? <DarkIcon /> : <LightIcon />}
                    </span>
                </div>
            </div>

            <div className={`${themeClassName} absolute top-4 right-4 z-10`}>
                <UserButton />
            </div>
        </>
    );
};

export default ToggleButton;
