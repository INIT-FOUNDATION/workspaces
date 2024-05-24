import React from 'react';

interface MousePosition {
  x: number | null;
  y: number | null;
}

const useMousePosition = (): MousePosition => {
  const [mousePosition, setMousePosition] = React.useState<MousePosition>({ x: null, y: null });

  React.useEffect(() => {
    const updateMousePosition = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
};

export default useMousePosition;
