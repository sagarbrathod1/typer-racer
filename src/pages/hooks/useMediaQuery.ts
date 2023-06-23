import { useMediaQuery as useRawMediaQuery } from 'react-responsive';

const screens: { [key: string]: string } = {
    sm: '640px',
    // => @media (min-width: 640px) { ... }

    md: '768px',
    // => @media (min-width: 768px) { ... }

    lg: '1024px',
    // => @media (min-width: 1024px) { ... }

    xl: '1280px',
    // => @media (min-width: 1280px) { ... }

    '2xl': '1536px',
    // => @media (min-width: 1536px) { ... }
};

type UseMediaQueryParams = {
    minWidth?: number | string;
    maxWidth?: number | string;
};

export const useMediaQuery = ({ minWidth, maxWidth }: UseMediaQueryParams): boolean => {
    return useRawMediaQuery({
        minWidth: minWidth && screens[minWidth],
        maxWidth: maxWidth && screens[maxWidth],
    });
};

/* Media queries */
export const useIsSm = (): boolean => {
    return useMediaQuery({
        maxWidth: 'sm',
    });
};

export const useIsMd = (): boolean => {
    return useMediaQuery({
        minWidth: 'md',
    });
};

export const useIsLg = (): boolean => {
    return useMediaQuery({
        minWidth: 'lg',
    });
};
