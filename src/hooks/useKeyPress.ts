import { useState, useEffect, useCallback } from 'react';

type UseKeyPressProps = {
    callback: (char: string) => void;
};

const useKeyPress = ({ callback }: UseKeyPressProps): string | null => {
    const [keyPressed, setKeyPressed] = useState<string | null>(null);

    const downHandler = useCallback(
        (event: KeyboardEvent) => {
            const { key } = event;
            // Prevent Firefox's Quick Find feature for apostrophe
            if (key === "'") {
                event.preventDefault();
            }
            
            if (keyPressed !== key && key.length === 1) {
                setKeyPressed(key);
                callback && callback(key);
            }
        },
        [callback, keyPressed, setKeyPressed]
    );

    const upHandler = useCallback(() => {
        setKeyPressed(null);
    }, [setKeyPressed]);

    useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    });

    return keyPressed;
};

export default useKeyPress;
