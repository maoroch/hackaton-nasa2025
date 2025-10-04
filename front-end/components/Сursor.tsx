"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.top = `${e.clientY}px`;
        cursorRef.current.style.left = `${e.clientX}px`;
      }
    };

    const clickCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.add("click");
        setTimeout(() => {
          cursorRef.current && cursorRef.current.classList.remove("click");
        }, 150);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", clickCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", clickCursor);
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
}
