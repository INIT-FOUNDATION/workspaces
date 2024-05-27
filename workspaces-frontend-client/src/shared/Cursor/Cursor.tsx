import React, { CSSProperties } from "react";
import './Cursor.css';

interface CursorProps {
    x: number;
    y: number;
    label: string;
    color: string;
}

const Cursor: React.FC<CursorProps> = ({ x, y, label, color }) => {
    const truncateName = (name: string) => {
        if (name.length > 10) {
            return name.slice(0, 10) + "...";
        }
        return name;
    };

    const cursorStyle: CSSProperties = {
        left: x,
        top: y,
        color: color,
    };

    return x !== null && y !== null ? (
        <p className="cursor-overlay" style={cursorStyle}>
            {truncateName(label)}
        </p>
    ) : null;
};

export default Cursor;