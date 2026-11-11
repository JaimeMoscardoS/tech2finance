import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type Level = "beginner" | "intermediate" | "advanced";
const levels: Level[] = ["beginner", "intermediate", "advanced"];
const spring = { type: "spring" as const, bounce: 0.55, duration: 1 };

export default function LevelSelector({ level, onChange, names, label, backLabel }: {
  level: Level; onChange: (level: Level) => void; names: Record<Level, string>; label: string; backLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const focusFrame = useRef(0);
  const reduced = useReducedMotion();
  const transition = reduced ? { duration: 0 } : spring;
  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) focusFrame.current = requestAnimationFrame(() => trigger.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    // Motion may still have visibility:hidden from the closed state on this frame.
    if (menu.current) menu.current.style.visibility = "visible";
    back.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(true); };
    const onPointer = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) close(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);

  return <div className="level-wrap" ref={wrap} onBlur={event => {
    if (open && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) close(false);
  }}>
    <motion.button ref={trigger} type="button" className="level-button" onClick={() => { cancelAnimationFrame(focusFrame.current); setOpen(true); }} initial={false}
      aria-expanded={open} aria-controls="level-options" aria-hidden={open} tabIndex={open ? -1 : 0}
      style={{ pointerEvents: open ? "none" : "auto" }}
      animate={open ? { scaleX: reduced ? 1 : 1.5, scaleY: reduced ? 1 : 0.9, opacity: 0, filter: reduced ? "none" : "blur(8px)" } : { scaleX: 1, scaleY: 1, opacity: 1, filter: reduced ? "none" : "blur(0px)" }}
      transition={transition} whileTap={reduced ? undefined : { scale: 1.15 }}>
      <span>{label}: <strong>{names[level]}</strong></span><ChevronDown size={15} aria-hidden="true" />
    </motion.button>
    <motion.div ref={menu} id="level-options" className="level-menu" role="group" aria-label={label}
      aria-hidden={!open} inert={!open} style={{ pointerEvents: open ? "auto" : "none" }} initial={false}
      animate={open ? { visibility: "visible", scaleX: 1, scaleY: 1, opacity: 1, filter: reduced ? "none" : "blur(0px)" } : { scaleX: reduced ? 1 : 0.2, scaleY: reduced ? 1 : 0.9, opacity: 0, filter: reduced ? "none" : "blur(8px)", transitionEnd: { visibility: "hidden" } }} transition={transition}>
      <motion.button ref={back} type="button" className="level-back" aria-label={backLabel} onClick={() => close(true)} whileTap={reduced ? undefined : { scale: 1.15 }}><ArrowLeft size={18} aria-hidden="true" /></motion.button>
      {levels.map(option => <motion.button type="button" key={option} aria-pressed={level === option}
        onClick={() => { onChange(option); close(true); }} whileTap={reduced ? undefined : { scale: 1.05 }}>{names[option]}</motion.button>)}
    </motion.div>
  </div>;
}
