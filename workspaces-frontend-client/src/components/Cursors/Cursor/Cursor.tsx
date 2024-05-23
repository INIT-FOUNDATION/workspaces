import { CSSProperties } from "react";

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
    position: "absolute",
    left: x,
    top: y,
    color: color,
    cursor: "pointer",
    transition: "left 0.1s, top 0.1s",
  };

  return <div style={cursorStyle}>{label && truncateName(label)}</div>;
};

export default Cursor;
