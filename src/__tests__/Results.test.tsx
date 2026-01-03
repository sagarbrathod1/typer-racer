import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Results from '@/pages/components/Results';

// Mock the chart component since it requires canvas
jest.mock('@/components/LineGraph/MyResponsiveLine', () => {
    return function MockChart({ data }: { data: any[] }) {
        return <div data-testid="mock-chart">Chart with {data.length} series</div>;
    };
});

// Mock react-loader-spinner
jest.mock('react-loader-spinner', () => ({
    __esModule: true,
    default: () => <div data-testid="loader">Loading...</div>,
}));

describe('Results', () => {
    const defaultProps = {
        sagarWpm: ['50', '55', '60', '65', '70'],
        wpmArray: [40, 45, 50, 55, 60],
        theme: 'light',
        wpm: 60,
        corpus: 'hello world this is a test corpus',
        errorCount: 3,
        leaderboard: [
            { user: 'player1', adjusted_wpm: 100 },
            { user: 'player2', adjusted_wpm: 90 },
            { user: 'player3', adjusted_wpm: 80 },
        ],
        postLeaderboard: jest.fn(),
        submitLeaderboardLoading: false,
        skipMode: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display the chart', () => {
        render(<Results {...defaultProps} />);

        expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('should display user WPM', () => {
        render(<Results {...defaultProps} />);

        expect(screen.getByText(/Your WPM: 60/)).toBeInTheDocument();
    });

    it('should display Sagar WPM (last element)', () => {
        render(<Results {...defaultProps} />);

        expect(screen.getByText(/Sagar's WPM: 70/)).toBeInTheDocument();
    });

    it('should calculate and display accuracy correctly', () => {
        render(<Results {...defaultProps} />);

        // corpus length = 34, errors = 3
        // accuracy = (34 - 3) / 34 = 0.91
        expect(screen.getByText(/Your accuracy: 0.91/)).toBeInTheDocument();
    });

    it('should display Sagar accuracy as 1.00', () => {
        render(<Results {...defaultProps} />);

        expect(screen.getByText(/Sagar's accuracy: 1.00/)).toBeInTheDocument();
    });

    it('should display leaderboard entries', () => {
        render(<Results {...defaultProps} />);

        expect(screen.getByText(/1\. player1: 100 WPM/)).toBeInTheDocument();
        expect(screen.getByText(/2\. player2: 90 WPM/)).toBeInTheDocument();
        expect(screen.getByText(/3\. player3: 80 WPM/)).toBeInTheDocument();
    });

    it('should display Submit button when wpm > 0 and not in skip mode', () => {
        render(<Results {...defaultProps} />);

        expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
    });

    it('should not display Submit button when wpm is 0', () => {
        render(<Results {...defaultProps} wpm={0} />);

        expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
    });

    it('should not display Submit button in skip mode', () => {
        render(<Results {...defaultProps} skipMode={true} />);

        expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
    });

    it('should call postLeaderboard when Submit is clicked', async () => {
        const mockPostLeaderboard = jest.fn().mockImplementation((score, callback) => {
            callback();
            return Promise.resolve();
        });

        render(<Results {...defaultProps} postLeaderboard={mockPostLeaderboard} />);

        fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

        expect(mockPostLeaderboard).toHaveBeenCalledWith(60, expect.any(Function));
    });

    it('should show success message after saving', async () => {
        const mockPostLeaderboard = jest.fn().mockImplementation((score, callback) => {
            callback();
            return Promise.resolve();
        });

        render(<Results {...defaultProps} postLeaderboard={mockPostLeaderboard} />);

        fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

        await waitFor(() => {
            expect(screen.getByText(/Your WPM was successfully saved!/)).toBeInTheDocument();
        });
    });

    it('should show loader when submitLeaderboardLoading is true', () => {
        render(<Results {...defaultProps} submitLeaderboardLoading={true} />);

        expect(screen.getByTestId('loader')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
    });

    it('should hide Submit button after save', async () => {
        const mockPostLeaderboard = jest.fn().mockImplementation((score, callback) => {
            callback();
            return Promise.resolve();
        });

        render(<Results {...defaultProps} postLeaderboard={mockPostLeaderboard} />);

        fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
        });
    });

    it('should handle empty leaderboard', () => {
        render(<Results {...defaultProps} leaderboard={[]} />);

        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        // No entries should be rendered
        expect(screen.queryByText(/WPM$/)).not.toBeInTheDocument();
    });

    it('should handle null/undefined sagarWpm gracefully', () => {
        render(<Results {...defaultProps} sagarWpm={null as any} />);

        // Should render without crashing
        expect(screen.getByText(/Your WPM:/)).toBeInTheDocument();
    });

    it('should handle empty corpus', () => {
        render(<Results {...defaultProps} corpus="" />);

        // Accuracy should be 0 when corpus is empty
        expect(screen.getByText(/Your accuracy: 0/)).toBeInTheDocument();
    });

    it('should calculate 100% accuracy with zero errors', () => {
        render(<Results {...defaultProps} errorCount={0} />);

        // corpus length = 34, errors = 0
        // accuracy = (34 - 0) / 34 = 1.00
        expect(screen.getByText(/Your accuracy: 1.00/)).toBeInTheDocument();
    });

    it('should render try-again-button-slot when not in skip mode', () => {
        const { container } = render(<Results {...defaultProps} skipMode={false} />);

        expect(container.querySelector('#try-again-button-slot')).toBeInTheDocument();
    });

    it('should not render try-again-button-slot in skip mode', () => {
        const { container } = render(<Results {...defaultProps} skipMode={true} />);

        expect(container.querySelector('#try-again-button-slot')).not.toBeInTheDocument();
    });
});

describe('Results - Accuracy Calculations', () => {
    const baseProps = {
        sagarWpm: ['50'],
        wpmArray: [50],
        theme: 'light',
        wpm: 50,
        leaderboard: [],
        postLeaderboard: jest.fn(),
        submitLeaderboardLoading: false,
        skipMode: true,
    };

    it('should calculate accuracy correctly for various error counts', () => {
        const testCases = [
            { corpus: 'a'.repeat(100), errors: 0, expected: '1.00' },
            { corpus: 'a'.repeat(100), errors: 10, expected: '0.90' },
            { corpus: 'a'.repeat(100), errors: 25, expected: '0.75' },
            { corpus: 'a'.repeat(100), errors: 50, expected: '0.50' },
            { corpus: 'a'.repeat(100), errors: 100, expected: '0.00' },
        ];

        testCases.forEach(({ corpus, errors, expected }) => {
            const { unmount } = render(
                <Results {...baseProps} corpus={corpus} errorCount={errors} />
            );

            expect(screen.getByText(new RegExp(`Your accuracy: ${expected}`))).toBeInTheDocument();
            unmount();
        });
    });
});
