interface TypingLoaderProps {
    message: string;
    letters: string[];
}

const TypingLoader = ({ message, letters }: TypingLoaderProps) => (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center font-mono">
            <div className="text-gray-600 dark:text-gray-400 text-lg">
                <span className="inline-block">{message}</span>
                <span className="inline-block animate-pulse">|</span>
            </div>
            
            <div className="flex justify-center mt-6 space-x-2">
                {letters.map((letter, index) => (
                    <div 
                        key={index}
                        className={`${
                            letter === ' ' 
                                ? 'w-6 h-8 bg-gray-300 dark:bg-gray-600' 
                                : 'w-8 h-8 bg-gray-200 dark:bg-gray-700'
                        } border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-xs font-semibold animate-bounce`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {letter === ' ' ? null : letter}
                        {letter === ' ' && (
                            <span className="sr-only">Space</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default TypingLoader; 