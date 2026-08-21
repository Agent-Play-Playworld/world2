import { useEffect, useState } from "react";

type CursorPoint = {
  x: number;
  y: number;
};

type CustomCursorState = {
  point: CursorPoint;
  onDesign: boolean;
  visible: boolean;
};

export const CustomCursor = () => {
  const [state, setState] = useState<CustomCursorState>({
    point: { x: 0, y: 0 },
    onDesign: false,
    visible: false,
  });

  useEffect(() => {
    const finePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const target = event.target;
      const onClickable =
        target instanceof Element &&
        target.closest(
          "a, button, summary, label, input, select, textarea, [role='button']"
        ) !== null;
      const onDesign =
        target instanceof Element && target.closest("[data-design]") !== null;
      setState({
        point: { x: event.clientX, y: event.clientY },
        onDesign,
        visible: !onClickable,
      });
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  if (!state.visible) {
    return null;
  }

  return (
    <div
      className={
        state.onDesign ? "custom-cursor custom-cursor-on-design" : "custom-cursor"
      }
      style={{
        transform: `translate3d(${state.point.x}px, ${state.point.y}px, 0)`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width="42" height="42">
        <path
          d="M18 6c1.2 0 2.2.8 2.5 2l4.2 18.4 3.2-12.2c.4-1.6 2-2.6 3.6-2.3 1.6.3 2.7 1.9 2.4 3.5L32 28l6.4-8.8c1-1.4 2.9-1.7 4.3-.8 1.4 1 1.8 2.9.8 4.3L36.8 34.4l8.3-4.2c1.6-.8 3.5-.2 4.3 1.4.8 1.6.2 3.5-1.4 4.3l-16 8.1c-4.6 2.3-10.1-.3-11.5-5.2L14.8 11.2C14.3 8.7 16 6.4 18.6 6H18z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};
