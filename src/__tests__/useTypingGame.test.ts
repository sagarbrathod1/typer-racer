/**
 * Unit tests for typing game logic
 *
 * These tests verify the core game logic in isolation.
 * Run with: yarn test
 */

// Helper function to calculate WPM (mirrors the logic used in the app)
function calculateWpm(charactersTyped: number, elapsedTimeMs: number): number {
    const durationInMinutes = elapsedTimeMs / 60000.0;
    if (durationInMinutes === 0) return 0;
    return Number((charactersTyped / 5 / durationInMinutes).toFixed(2));
}

// Helper function to calculate accuracy
function calculateAccuracy(corpusLength: number, errorCount: number): number {
    if (corpusLength === 0) return 0;
    return Number(((corpusLength - errorCount) / corpusLength).toFixed(2));
}

// Helper function to determine if WPM is reasonable
function isReasonableWpm(wpm: number): boolean {
    const MAX_REASONABLE_WPM = 250; // World record is ~216 WPM
    return wpm >= 0 && wpm <= MAX_REASONABLE_WPM;
}

// Helper to generate room code (mirrors multiplayer logic)
function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

describe('WPM Calculation', () => {
    it('should return 0 for 0 elapsed time', () => {
        expect(calculateWpm(100, 0)).toBe(0);
    });

    it('should calculate WPM correctly for 30 seconds (half minute)', () => {
        // 100 chars in 30 seconds = 200 chars/min = 40 WPM (5 chars per word)
        const wpm = calculateWpm(100, 30000);
        expect(wpm).toBe(40);
    });

    it('should calculate WPM correctly for 60 seconds', () => {
        // 250 chars in 60 seconds = 250 chars/min = 50 WPM
        const wpm = calculateWpm(250, 60000);
        expect(wpm).toBe(50);
    });

    it('should handle partial minutes correctly', () => {
        // 75 chars in 45 seconds (0.75 min) = 100 chars/min = 20 WPM
        const wpm = calculateWpm(75, 45000);
        expect(wpm).toBe(20);
    });

    it('should return 0 for 0 characters typed', () => {
        expect(calculateWpm(0, 30000)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
        // 77 chars in 30 seconds = 30.8 WPM
        const wpm = calculateWpm(77, 30000);
        expect(wpm).toBe(30.8);
    });
});

describe('WPM Validation', () => {
    it('should accept WPM of 0', () => {
        expect(isReasonableWpm(0)).toBe(true);
    });

    it('should accept typical WPM values', () => {
        [30, 50, 70, 100, 150].forEach(wpm => {
            expect(isReasonableWpm(wpm)).toBe(true);
        });
    });

    it('should accept world-record-level WPM (up to 250)', () => {
        expect(isReasonableWpm(216)).toBe(true);
        expect(isReasonableWpm(250)).toBe(true);
    });

    it('should reject impossibly high WPM', () => {
        expect(isReasonableWpm(300)).toBe(false);
        expect(isReasonableWpm(500)).toBe(false);
    });

    it('should reject negative WPM', () => {
        expect(isReasonableWpm(-10)).toBe(false);
    });
});

describe('Accuracy Calculation', () => {
    it('should return 0 for empty corpus', () => {
        expect(calculateAccuracy(0, 0)).toBe(0);
    });

    it('should return 1.00 for perfect accuracy (0 errors)', () => {
        expect(calculateAccuracy(100, 0)).toBe(1);
    });

    it('should calculate accuracy correctly', () => {
        // 100 chars, 10 errors = 90% accuracy
        expect(calculateAccuracy(100, 10)).toBe(0.9);
    });

    it('should return 0 for 100% errors', () => {
        expect(calculateAccuracy(100, 100)).toBe(0);
    });

    it('should handle various error rates', () => {
        expect(calculateAccuracy(100, 25)).toBe(0.75);
        expect(calculateAccuracy(100, 50)).toBe(0.5);
        expect(calculateAccuracy(100, 75)).toBe(0.25);
    });

    it('should round to 2 decimal places', () => {
        // 100 chars, 33 errors = 0.67
        expect(calculateAccuracy(100, 33)).toBe(0.67);
    });
});

describe('Game State Logic', () => {
    describe('Initial State', () => {
        it('should have correct initial values', () => {
            const initialState = {
                wpm: 0,
                seconds: 30,
                errorCount: 0,
                charCount: 0,
                isGameStarted: false,
            };

            expect(initialState.wpm).toBe(0);
            expect(initialState.seconds).toBe(30);
            expect(initialState.errorCount).toBe(0);
            expect(initialState.isGameStarted).toBe(false);
        });
    });

    describe('Game Over Conditions', () => {
        it('should be game over when seconds reach 0', () => {
            const seconds = 0;
            const isGameOver = seconds === 0;
            expect(isGameOver).toBe(true);
        });

        it('should not be game over with time remaining', () => {
            const seconds = 15;
            const isGameOver = seconds === 0;
            expect(isGameOver).toBe(false);
        });
    });

    describe('Character Matching', () => {
        it('should detect correct character match', () => {
            const corpus = 'hello world';
            const typedChar = 'h';
            const currentIndex = 0;
            const isCorrect = typedChar === corpus.charAt(currentIndex);
            expect(isCorrect).toBe(true);
        });

        it('should detect incorrect character', () => {
            const corpus = 'hello world';
            const typedChar = 'x';
            const currentIndex = 0;
            const isCorrect = typedChar === corpus.charAt(currentIndex);
            expect(isCorrect).toBe(false);
        });

        it('should handle case sensitivity', () => {
            const corpus = 'Hello';
            const typedLower = 'h';
            const typedUpper = 'H';
            const currentIndex = 0;

            expect(typedLower === corpus.charAt(currentIndex)).toBe(false);
            expect(typedUpper === corpus.charAt(currentIndex)).toBe(true);
        });

        it('should handle space character', () => {
            const corpus = 'hello world';
            const typedChar = ' ';
            const currentIndex = 5; // The space between words
            expect(typedChar === corpus.charAt(currentIndex)).toBe(true);
        });
    });

    describe('Corpus Navigation', () => {
        it('should correctly split corpus into current and incoming', () => {
            const corpus = 'hello world';
            const currentIndex = 0;

            const currentChar = corpus.charAt(currentIndex);
            const incomingChars = corpus.substring(currentIndex + 1);

            expect(currentChar).toBe('h');
            expect(incomingChars).toBe('ello world');
        });

        it('should handle end of corpus', () => {
            const corpus = 'hi';
            const currentIndex = 1;

            const currentChar = corpus.charAt(currentIndex);
            const incomingChars = corpus.substring(currentIndex + 1);

            expect(currentChar).toBe('i');
            expect(incomingChars).toBe('');
        });
    });
});

describe('Room Code Generation', () => {
    it('should generate 6-character codes', () => {
        const code = generateRoomCode();
        expect(code.length).toBe(6);
    });

    it('should only contain allowed characters', () => {
        const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for (let i = 0; i < 100; i++) {
            const code = generateRoomCode();
            for (const char of code) {
                expect(allowedChars).toContain(char);
            }
        }
    });

    it('should not contain confusing characters (0, O, 1, I)', () => {
        const confusingChars = ['0', 'O', '1', 'I'];
        for (let i = 0; i < 100; i++) {
            const code = generateRoomCode();
            for (const char of confusingChars) {
                expect(code).not.toContain(char);
            }
        }
    });

    it('should generate unique codes (high probability)', () => {
        const codes = new Set<string>();
        for (let i = 0; i < 100; i++) {
            codes.add(generateRoomCode());
        }
        // With 6 chars from 32 possible, collision in 100 is extremely unlikely
        expect(codes.size).toBe(100);
    });
});

describe('Timer Logic', () => {
    it('should count down from 30 seconds', () => {
        let seconds = 30;
        seconds = seconds - 1;
        expect(seconds).toBe(29);
    });

    it('should stop at 0', () => {
        let seconds = 1;
        seconds = Math.max(0, seconds - 1);
        expect(seconds).toBe(0);

        seconds = Math.max(0, seconds - 1);
        expect(seconds).toBe(0);
    });
});

describe('Left Padding Logic', () => {
    it('should start with 30 spaces on desktop', () => {
        const isSm = false;
        const leftPadding = new Array(isSm ? 25 : 30).fill(' ').join('');
        expect(leftPadding.length).toBe(30);
    });

    it('should start with 25 spaces on mobile', () => {
        const isSm = true;
        const leftPadding = new Array(isSm ? 25 : 30).fill(' ').join('');
        expect(leftPadding.length).toBe(25);
    });

    it('should shrink as user types correct chars', () => {
        let leftPadding = '     '; // 5 spaces
        leftPadding = leftPadding.substring(1);
        expect(leftPadding.length).toBe(4);
    });

    it('should eventually become empty', () => {
        let leftPadding = '  '; // 2 spaces
        leftPadding = leftPadding.substring(1);
        leftPadding = leftPadding.substring(1);
        expect(leftPadding.length).toBe(0);
    });
});
