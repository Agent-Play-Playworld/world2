import { useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { clampPanelPlacement, clampPanelSize, COLLAPSED_PANEL_HEIGHT_PX, nextExpandedPanelHeightPx, shouldReleaseExpandedPanelHeight } from "../lib/play-preview";

type FloatingPanelProps = {
  label: string;
  moveLabel: string;
  className: string;
  collapsed: boolean;
  landmark?: "region" | "complementary";
  defaultWidthPx?: number | undefined;
  onCollapsedChange: (collapsed: boolean) => void;
  children: ReactNode;
};

export const FloatingPanel = (options: FloatingPanelProps) => {
  const {
    label,
    moveLabel,
    className,
    collapsed,
    onCollapsedChange,
    children,
    landmark = "region",
    defaultWidthPx,
  } = options;
  const panelRef = useRef<HTMLElement | null>(null);
  const drag = useRef({
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    active: false,
    suppressClick: false,
  });
  const resize = useRef({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    active: false,
  });
  const expandedHeight = useRef<number | null>(null);
  const userSized = useRef(false);

  const measureOpenHeightPx = (panel: HTMLElement): number => {
    const previousHeight = panel.style.height;
    const previousTransition = panel.style.transition;
    panel.style.transition = "none";
    panel.style.height = "auto";
    const measured = panel.getBoundingClientRect().height;
    panel.style.height = previousHeight;
    panel.style.transition = previousTransition;
    void panel.getBoundingClientRect();
    return measured;
  };

  const toggleCollapsed = (): void => {
    const panel = panelRef.current;
    if (panel !== null && !collapsed) {
      const height = panel.getBoundingClientRect().height;
      if (height > 0) {
        expandedHeight.current = height;
      }
    }
    onCollapsedChange(!collapsed);
  };

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }
    if (collapsed) {
      const from = panel.getBoundingClientRect().height;
      if (from > COLLAPSED_PANEL_HEIGHT_PX) {
        panel.style.height = `${String(from)}px`;
      }
      const frame = window.requestAnimationFrame(() => {
        panel.style.height = `${String(COLLAPSED_PANEL_HEIGHT_PX)}px`;
      });
      return () => {
        window.cancelAnimationFrame(frame);
      };
    }
    const target = nextExpandedPanelHeightPx({
      measuredOpenPx: measureOpenHeightPx(panel),
      storedOpenPx: expandedHeight.current,
      collapsedPx: COLLAPSED_PANEL_HEIGHT_PX,
      userSized: userSized.current,
    });
    if (target === null) {
      panel.style.height = "";
      return;
    }
    expandedHeight.current = target;
    panel.style.height = `${String(COLLAPSED_PANEL_HEIGHT_PX)}px`;
    const frame = window.requestAnimationFrame(() => {
      panel.style.height = `${String(target)}px`;
    });
    const onEaseEnd = (event: Event): void => {
      const propertyName =
        "propertyName" in event && typeof event.propertyName === "string"
          ? event.propertyName
          : "";
      if (propertyName !== "height") {
        return;
      }
      if (!shouldReleaseExpandedPanelHeight({ userSized: userSized.current })) {
        return;
      }
      panel.style.height = "";
    };
    panel.addEventListener("transitionend", onEaseEnd);
    return () => {
      window.cancelAnimationFrame(frame);
      panel.removeEventListener("transitionend", onEaseEnd);
    };
  }, [collapsed]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (event.button !== 0 && event.button !== undefined) {
      return;
    }
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }
    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    drag.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      active: true,
      suppressClick: false,
    };
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (!drag.current.active) {
      return;
    }
    const panel = panelRef.current;
    const shell = panel?.closest(".game-shell");
    if (panel === null || shell === undefined || !(shell instanceof HTMLElement)) {
      return;
    }
    const bounds = shell.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const movement = Math.hypot(
      event.clientX - drag.current.startX,
      event.clientY - drag.current.startY
    );
    drag.current.moved = drag.current.moved || movement > 3;
    const next = clampPanelPlacement({
      leftPx: event.clientX - bounds.left - drag.current.offsetX,
      topPx: event.clientY - bounds.top - drag.current.offsetY,
      panelWidth: panelRect.width,
      panelHeight: panelRect.height,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height,
    });
    panel.style.left = `${String(next.leftPx)}px`;
    panel.style.top = `${String(next.topPx)}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      typeof event.currentTarget.releasePointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!drag.current.active) {
      return;
    }
    drag.current.active = false;
    if (drag.current.moved) {
      drag.current.suppressClick = true;
      return;
    }
    drag.current.suppressClick = true;
    toggleCollapsed();
  };

  const onHandleClick = (): void => {
    if (drag.current.suppressClick) {
      drag.current.suppressClick = false;
      return;
    }
    if (drag.current.moved) {
      return;
    }
    toggleCollapsed();
  };

  const onResizeDown = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }
    const rect = panel.getBoundingClientRect();
    resize.current = {
      startX: event.clientX,
      startY: event.clientY,
      startW: rect.width,
      startH: rect.height,
      active: true,
    };
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onResizeMove = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (!resize.current.active) {
      return;
    }
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }
    const next = clampPanelSize({
      widthPx: resize.current.startW + (event.clientX - resize.current.startX),
      heightPx: resize.current.startH + (event.clientY - resize.current.startY),
      minWidthPx: 280,
      minHeightPx: 180,
      maxWidthPx: 640,
      maxHeightPx: 720,
    });
    panel.style.width = `${String(next.widthPx)}px`;
    panel.style.height = `${String(next.heightPx)}px`;
    panel.style.maxHeight = "none";
    expandedHeight.current = next.heightPx;
    userSized.current = true;
  };

  const onResizeUp = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    resize.current.active = false;
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      typeof event.currentTarget.releasePointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section
      ref={panelRef}
      className={`play-floating-panel ${className}${collapsed ? " is-collapsed" : ""}`}
      role={landmark}
      aria-label={label}
      aria-expanded={!collapsed}
      style={
        defaultWidthPx === undefined
          ? undefined
          : { width: `min(${String(defaultWidthPx)}px, calc(100vw - 24px))` }
      }
    >
      <button
        type="button"
        className="play-floating-panel-handle"
        aria-label={moveLabel}
        aria-expanded={!collapsed}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onHandleClick}
      >
        <span className="play-floating-panel-grip" aria-hidden="true">
          ⋮
        </span>
        <span className="play-floating-panel-label">{label}</span>
        <span className="play-floating-panel-chevron" aria-hidden="true">
          {collapsed ? "+" : "–"}
        </span>
      </button>
      <div className="play-floating-panel-fold" aria-hidden={collapsed}>
        <div className="play-floating-panel-body">{children}</div>
      </div>
      <button
        type="button"
        className="play-floating-panel-resize"
        aria-label={`Resize ${label} panel`}
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
      />
    </section>
  );
};
