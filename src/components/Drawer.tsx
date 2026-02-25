import React, { useEffect, useId, useRef } from "react";

export default function Drawer(props: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  status?: "state" | "lga";
  children: React.ReactNode;
}) {
  const titleId = useId();
  const descId = useId();
  const lastActiveElRef = useRef<HTMLElement | null>(null);

  // ESC to close + focus restore
  useEffect(() => {
    if (!props.open) return;

    lastActiveElRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      lastActiveElRef.current?.focus?.();
    };
  }, [props.open, props.onClose]);

  // Scroll lock behind drawer (important for mobile bottom-sheet)
  useEffect(() => {
    if (!props.open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [props.open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`backdrop ${props.open ? "open" : ""}`}
        onClick={props.onClose}
        aria-hidden={!props.open}
      />

      {/* Drawer */}
      <aside
        className={`drawer ${props.open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={props.subtitle ? descId : undefined}
        // Prevent clicks inside drawer from bubbling to backdrop on some browsers
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawerTop">
          <div className="drawerTopLeft">
            <div className="drawerKicker">
              {props.status === "lga"
                ? "LGA selected"
                : props.status === "state"
                ? "State selected"
                : "Selection"}
            </div>

            <div className="drawerTitleRow">
              <div className="drawerTitle" id={titleId}>
                {props.title ?? "Details"}
              </div>

              {props.subtitle ? (
                <div className="drawerSubtitle" id={descId}>
                  {props.subtitle}
                </div>
              ) : null}
            </div>
          </div>

          <button className="iconBtn" onClick={props.onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Optional: mobile handle (CSS can hide on desktop) */}
        <div className="drawerHandle" aria-hidden="true" />

        <div className="drawerBody">{props.children}</div>
      </aside>
    </>
  );
}