import React, { FunctionComponent, useCallback, useRef } from 'react';

type Props = {
    leftPadding: string;
    outgoingChars: string;
    isSm: boolean;
    incorrectChar: boolean;
    currentChar: string;
    incomingChars: string;
};

const TypingBoard: FunctionComponent<Props> = ({
    leftPadding,
    outgoingChars,
    isSm,
    incorrectChar,
    currentChar,
    incomingChars,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleTextClick = useCallback(() => {
        if (isSm && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSm]);

    const paddedChars = String(leftPadding) + String(outgoingChars); // Ensure leftPadding and outgoingChars are strings

    return (
        <p className="whitespace-pre width-race-me-text w-screen justify-center flex">
            <span className={`text-gray-400`}>{paddedChars.slice(isSm ? -25 : -30)}</span>
            <span
                className={`${
                    incorrectChar ? 'bg-red-400' : 'bg-[#FF990080]'
                } relative flex justify-center`}
                onClick={handleTextClick}
            >
                {currentChar === ' ' ? <span>&nbsp;</span> : currentChar}
                {isSm && (
                    <input
                        className="border-none cursor-default opacity-0 outline-none pointer-events-none absolute z-[-1] resize-none select-none"
                        ref={inputRef}
                    />
                )}
            </span>
            <span onClick={handleTextClick}>{incomingChars.substr(0, isSm ? 25 : 30)}</span>
        </p>
    );
};

export default TypingBoard;
