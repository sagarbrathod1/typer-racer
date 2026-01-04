import { render, screen, fireEvent } from '@testing-library/react';
import TypingBoard from '@/pages/components/TypingBoard';

describe('TypingBoard', () => {
    const defaultProps = {
        leftPadding: '     ',
        outgoingChars: 'hel',
        isSm: false,
        incorrectChar: false,
        currentChar: 'l',
        incomingChars: 'o world',
    };

    it('should render the current character', () => {
        render(<TypingBoard {...defaultProps} />);

        // The current character should be visible
        expect(screen.getByText('l')).toBeInTheDocument();
    });

    it('should render incoming characters', () => {
        render(<TypingBoard {...defaultProps} />);

        // Incoming chars should be displayed (truncated to 30 chars for non-mobile)
        expect(screen.getByText('o world')).toBeInTheDocument();
    });

    it('should render outgoing characters with left padding', () => {
        render(<TypingBoard {...defaultProps} />);

        // Outgoing chars should be displayed with gray color
        const outgoingSpan = screen.getByText(/hel/);
        expect(outgoingSpan).toHaveClass('text-gray-400');
    });

    it('should show orange background for correct current char', () => {
        const { container } = render(<TypingBoard {...defaultProps} />);

        // Find the span with the background class for current char
        const currentCharSpan = container.querySelector('[class*="bg-"]');
        expect(currentCharSpan).toHaveClass('bg-[#FF990080]');
    });

    it('should show red background for incorrect current char', () => {
        const { container } = render(<TypingBoard {...defaultProps} incorrectChar={true} />);

        // Find the span with the background class for current char
        const currentCharSpan = container.querySelector('[class*="bg-"]');
        expect(currentCharSpan).toHaveClass('bg-red-400');
    });

    it('should render non-breaking space for space character', () => {
        render(<TypingBoard {...defaultProps} currentChar=" " />);

        // Should render &nbsp; for space
        const spaceSpan = screen.getByText((content, element) => {
            return element?.innerHTML === '&nbsp;';
        });
        expect(spaceSpan).toBeInTheDocument();
    });

    it('should truncate incoming chars to 30 on desktop', () => {
        const longIncoming = 'a'.repeat(50);
        render(<TypingBoard {...defaultProps} incomingChars={longIncoming} isSm={false} />);

        // Should only show 30 chars
        const incomingSpan = screen.getByText('a'.repeat(30));
        expect(incomingSpan).toBeInTheDocument();
    });

    it('should truncate incoming chars to 25 on mobile', () => {
        const longIncoming = 'b'.repeat(50);
        render(<TypingBoard {...defaultProps} incomingChars={longIncoming} isSm={true} />);

        // Should only show 25 chars on mobile
        const incomingSpan = screen.getByText('b'.repeat(25));
        expect(incomingSpan).toBeInTheDocument();
    });

    it('should slice outgoing chars to show last 30 on desktop', () => {
        const longOutgoing = 'c'.repeat(50);
        render(
            <TypingBoard
                {...defaultProps}
                outgoingChars={longOutgoing}
                leftPadding=""
                isSm={false}
            />
        );

        // Should only show last 30 chars
        const outgoingSpan = screen.getByText('c'.repeat(30));
        expect(outgoingSpan).toBeInTheDocument();
    });

    it('should slice outgoing chars to show last 25 on mobile', () => {
        const longOutgoing = 'd'.repeat(50);
        render(
            <TypingBoard
                {...defaultProps}
                outgoingChars={longOutgoing}
                leftPadding=""
                isSm={true}
            />
        );

        // Should only show last 25 chars on mobile
        const outgoingSpan = screen.getByText('d'.repeat(25));
        expect(outgoingSpan).toBeInTheDocument();
    });

    it('should render hidden input on mobile for keyboard focus', () => {
        render(<TypingBoard {...defaultProps} isSm={true} />);

        const hiddenInput = document.querySelector('input');
        expect(hiddenInput).toBeInTheDocument();
        expect(hiddenInput).toHaveClass('opacity-0');
    });

    it('should not render hidden input on desktop', () => {
        render(<TypingBoard {...defaultProps} isSm={false} />);

        const hiddenInput = document.querySelector('input');
        expect(hiddenInput).not.toBeInTheDocument();
    });

    it('should focus hidden input when clicked on mobile', () => {
        render(<TypingBoard {...defaultProps} isSm={true} />);

        const hiddenInput = document.querySelector('input') as HTMLInputElement;
        const focusSpy = jest.spyOn(hiddenInput, 'focus');

        const currentCharSpan = screen.getByText(defaultProps.currentChar);
        fireEvent.click(currentCharSpan);

        expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle empty incomingChars gracefully', () => {
        render(<TypingBoard {...defaultProps} incomingChars="" />);

        // Should not throw, just render nothing for incoming
        expect(screen.getByText(defaultProps.currentChar)).toBeInTheDocument();
    });

    it('should handle undefined incomingChars gracefully', () => {
        render(<TypingBoard {...defaultProps} incomingChars={undefined as any} />);

        // Should not throw
        expect(screen.getByText(defaultProps.currentChar)).toBeInTheDocument();
    });
});
