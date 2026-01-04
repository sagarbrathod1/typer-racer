import { useState, useEffect, useCallback, useRef } from 'react';

type UseKeyPressProps = {
    callback: (char: string) => void;
};

const useKeyPress = ({ callback }: UseKeyPressProps): string | null => {
    const [keyPressed, setKeyPressed] = useState<string | null>(null);

    const callbackRef = useRef(callback);
    const keyPressedRef = useRef(keyPressed);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        keyPressedRef.current = keyPressed;
    }, [keyPressed]);

    useEffect(() => {
        const downHandler = (event: KeyboardEvent) => {
            const { key } = event;
            // Prevent Firefox's Quick Find feature for apostrophe
            if (key === "'") {
                event.preventDefault();
            }

            if (keyPressedRef.current !== key && key.length === 1) {
                setKeyPressed(key);
                callbackRef.current?.(key);
            }
        };

        const upHandler = () => {
            setKeyPressed(null);
        };

        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, []);

    return keyPressed;
};

export default useKeyPress;
