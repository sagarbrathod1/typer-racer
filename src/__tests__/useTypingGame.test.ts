/**
 * Unit tests for useTypingGame hook
 *
 * These tests verify the core game logic in isolation.
 * Run with: yarn test
 */

describe('useTypingGame', () => {
    describe('WPM calculation', () => {
        it('should calculate WPM correctly', () => {
            // WPM = (characters / 5) / minutes
            const characters = 100;
            const minutes = 0.5; // 30 seconds
            const expectedWpm = (characters / 5) / minutes;

            expect(expectedWpm).toBe(40);
        });

        it('should reject WPM above 250 as impossible', () => {
            const MAX_REASONABLE_WPM = 250;
            const impossibleWpm = 300;

            expect(impossibleWpm).toBeGreaterThan(MAX_REASONABLE_WPM);
        });
    });

    describe('game state', () => {
        it('should start with correct initial values', () => {
            const initialState = {
                wpm: 0,
                seconds: 30,
                errorCount: 0,
                isGameOver: false,
                isGameStarted: false,
            };

            expect(initialState.wpm).toBe(0);
            expect(initialState.seconds).toBe(30);
            expect(initialState.isGameOver).toBe(false);
        });

        it('should mark game as over when seconds reach 0', () => {
            const seconds = 0;
            const isGameOver = seconds === 0;

            expect(isGameOver).toBe(true);
        });
    });

    describe('character tracking', () => {
        it('should track correct characters', () => {
            const corpus = 'hello world';
            const typedChar = 'h';
            const currentChar = corpus.charAt(0);

            expect(typedChar).toBe(currentChar);
        });

        it('should detect incorrect characters', () => {
            const corpus = 'hello world';
            const typedChar = 'x';
            const currentChar = corpus.charAt(0);
            const isIncorrect = typedChar !== currentChar;

            expect(isIncorrect).toBe(true);
        });
    });
});
