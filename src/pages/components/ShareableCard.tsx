import { useRef, useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

type Props = {
    wpm: number;
    accuracy: string;
    username: string;
    theme: string | undefined;
    didBeatSagar: boolean;
    sagarWpm: string;
};

const ShareableCard = ({ wpm, accuracy, username, theme, didBeatSagar, sagarWpm }: Props) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadCard = useCallback(async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                scale: 2,
            });
            const link = document.createElement('a');
            link.download = `typer-racer-${wpm}wpm.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Failed to download card:', error);
        } finally {
            setIsDownloading(false);
        }
    }, [theme, wpm]);

    const copyToClipboard = useCallback(async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                scale: 2,
            });
            canvas.toBlob(async (blob) => {
                if (blob) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob }),
                    ]);
                }
            });
        } catch (error) {
            console.error('Failed to copy card:', error);
        } finally {
            setIsDownloading(false);
        }
    }, [theme]);

    const isDark = theme === 'dark';

    return (
        <div className="mt-6">
            <div
                ref={cardRef}
                className={`p-6 rounded-xl border-2 ${
                    isDark
                        ? 'bg-gray-900 border-gray-700'
                        : 'bg-white border-gray-200'
                }`}
                style={{ width: '320px', margin: '0 auto' }}
            >
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-1">Typer Racer</h2>
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {username}&apos;s Race Results
                    </p>

                    <div className={`text-6xl font-bold mb-2 ${
                        didBeatSagar ? 'text-green-500' : isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        {wpm}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        words per minute
                    </p>

                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex justify-between text-sm">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Accuracy</span>
                            <span className="font-semibold">{accuracy}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>vs Sagar</span>
                            <span className={`font-semibold ${didBeatSagar ? 'text-green-500' : 'text-red-500'}`}>
                                {didBeatSagar ? 'Won' : 'Lost'} ({sagarWpm} WPM)
                            </span>
                        </div>
                    </div>

                    {didBeatSagar && (
                        <div className="mt-4 text-2xl">
                            Victory!
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 justify-center mt-4">
                <button
                    onClick={downloadCard}
                    disabled={isDownloading}
                    className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-sm transition-colors disabled:opacity-50"
                >
                    {isDownloading ? 'Saving...' : 'Save Image'}
                </button>
                <button
                    onClick={copyToClipboard}
                    disabled={isDownloading}
                    className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-sm transition-colors disabled:opacity-50"
                >
                    Copy to Clipboard
                </button>
            </div>
        </div>
    );
};

export default ShareableCard;
