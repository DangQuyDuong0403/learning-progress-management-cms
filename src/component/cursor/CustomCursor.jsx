import React, { useEffect, useRef } from 'react';
import './CustomCursor.css';

// A smooth, GPU-friendly custom cursor with two layers:
// - primary: helmet pointer (snaps to mouse)
// - follower: rocket that smoothly trails and rotates by velocity
export default function CustomCursor() {
    const helmetRef = useRef(null);
    const rocketRef = useRef(null);

    useEffect(() => {
        const helmetEl = helmetRef.current;
        const rocketEl = rocketRef.current;
        if (!helmetEl || !rocketEl) return undefined;

        // Hide the system cursor while this component is mounted
        document.body.classList.add('custom-cursor-enabled');

        // Ensure cursors are visible immediately on mount
        helmetEl.dataset.visible = '1';
        rocketEl.dataset.visible = '1';

        const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const onMove = (e) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            // Position both elements centered at pointer; helmet scales via CSS var
            helmetEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) scale(var(--cc-scale, 1))`;
            rocketEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;

            // Determine if pointer is over an interactive element
            const el = document.elementFromPoint(e.clientX, e.clientY);
            let isHover = false;
            if (el) {
                for (const sel of interactiveSelectors) {
                    if (el.closest(sel)) { isHover = true; break; }
                }
            }
            updateHoverState(isHover);
        };

        const onPointerEnter = () => {
            helmetEl.dataset.visible = '1';
            rocketEl.dataset.visible = '1';
        };
        const onPointerLeave = () => {
            helmetEl.dataset.visible = '0';
            rocketEl.dataset.visible = '0';
        };

        const updateHoverState = (isHover) => {
            helmetEl.dataset.hover = isHover ? '1' : '0';
            rocketEl.dataset.hover = isHover ? '1' : '0';
        };

        const interactiveSelectors = [
            'a',
            'button',
            'input',
            'textarea',
            'select',
            '[role="button"]',
            '.clickable',
        ];

        // Hover state is handled in onMove via elementFromPoint

        // No trailing animation needed; rocket snaps to pointer in onMove

        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerenter', onPointerEnter);
        window.addEventListener('pointerleave', onPointerLeave);
        // We rely on pointermove + elementFromPoint, so no mouseover/mouseout listeners needed

        // Initial position in center
        helmetEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) scale(var(--cc-scale, 1))`;
        rocketEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
        // No RAF loop since both elements are updated on pointermove

        return () => {
            // No RAF loop to cancel
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerenter', onPointerEnter);
            window.removeEventListener('pointerleave', onPointerLeave);
            // no mouseover/mouseout listeners to remove
            document.body.classList.remove('custom-cursor-enabled');
        };
    }, []);

    return (
        <>
            <img
                ref={helmetRef}
                src="/img/helmet-cursor.png"
                alt="cursor-helmet"
                className="cc-cursor cc-cursor-helmet"
                draggable={false}
            />
            <img
                ref={rocketRef}
                src="/img/spaceship-cursor.png"
                alt="cursor-rocket"
                className="cc-cursor cc-cursor-rocket"
                draggable={false}
            />
        </>
    );
}


