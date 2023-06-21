import React, { FunctionComponent, useMemo } from 'react';
import { Point } from '@nivo/line';

type Props = {
    point: Point;
    theme: string | undefined;
};

const ChartTool: FunctionComponent<Props> = ({ point, theme }) => {
    const containerClassName: string = useMemo(() => {
        const defaultClassName: string = 'flex flex-col items-center p-1 rounded-md';
        return theme === 'dark'
            ? `${defaultClassName} dark-background`
            : `${defaultClassName} bg-gray-50`;
    }, [theme]);

    return (
        <div className={containerClassName}>
            <div className="flex items-center">
                <div style={{ backgroundColor: point.serieColor }} className="h-3 mr-1 w-3" />
                <div>{`${point.serieId}: ${point.data.y}`}</div>
            </div>
            <div>{point.data.xFormatted} seconds</div>
        </div>
    );
};

export default ChartTool;
