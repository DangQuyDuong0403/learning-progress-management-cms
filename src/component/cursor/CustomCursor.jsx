import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './CustomCursor.css';

// A smooth, GPU-friendly custom cursor with two layers:
// - primary: helmet pointer (snaps to mouse)
// - follower: rocket that smoothly trails and rotates by velocity
export default function CustomCursor() {
    const helmetRef = useRef(null);
    const rocketRef = useRef(null);
    const woodPointerRef = useRef(null);
    const woodCursorRef = useRef(null);
    const cosmicPointerRef = useRef(null);
    const cosmicCursorRef = useRef(null);
    const celestialPointerRef = useRef(null);
    const celestialCursorRef = useRef(null);
    const [mounted, setMounted] = React.useState(false);
    const [cursorType, setCursorType] = React.useState(() => {
        return localStorage.getItem('customCursorType') || 'space';
    });

    // Ensure component is mounted before rendering portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Listen for cursor type changes (both storage events and custom events)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'customCursorType') {
                setCursorType(e.newValue || 'space');
            }
        };
        
        const handleCursorTypeChange = (e) => {
            setCursorType(e.detail?.cursorType || 'space');
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('cursorTypeChanged', handleCursorTypeChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cursorTypeChanged', handleCursorTypeChange);
        };
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        // Get the appropriate cursor element based on cursor type
        const isSpaceCursor = cursorType === 'space';
        const isWoodCursor = cursorType === 'wood';
        const isCosmicCursor = cursorType === 'cosmic';
        const isCelestialCursor = cursorType === 'celestial';
        
        const helmetEl = isSpaceCursor ? helmetRef.current : null;
        const rocketEl = isSpaceCursor ? rocketRef.current : null;
        const woodPointerEl = isWoodCursor ? woodPointerRef.current : null;
        const woodCursorEl = isWoodCursor ? woodCursorRef.current : null;
        const cosmicPointerEl = isCosmicCursor ? cosmicPointerRef.current : null;
        const cosmicCursorEl = isCosmicCursor ? cosmicCursorRef.current : null;
        const celestialPointerEl = isCelestialCursor ? celestialPointerRef.current : null;
        const celestialCursorEl = isCelestialCursor ? celestialCursorRef.current : null;
        
        const activeEl = isSpaceCursor ? (helmetEl || rocketEl) 
            : isWoodCursor ? (woodPointerEl || woodCursorEl)
            : isCosmicCursor ? (cosmicPointerEl || cosmicCursorEl)
            : isCelestialCursor ? (celestialPointerEl || celestialCursorEl)
            : null;
        if (!activeEl) return undefined;

        // Hide the system cursor while this component is mounted
        document.body.classList.add('custom-cursor-enabled');

        // Ensure cursors are visible immediately on mount
        if (isSpaceCursor) {
            if (helmetEl) {
                helmetEl.dataset.visible = '1';
                helmetEl.dataset.hover = '0'; // Initial state: not hovering
            }
            if (rocketEl) {
                rocketEl.dataset.visible = '1';
                rocketEl.dataset.hover = '0'; // Initial state: not hovering
            }
        } else if (isWoodCursor) {
            if (woodPointerEl) {
                woodPointerEl.dataset.visible = '1';
                woodPointerEl.dataset.hover = '0'; // Initial state: show pointer
            }
            if (woodCursorEl) {
                woodCursorEl.dataset.visible = '1';
                woodCursorEl.dataset.hover = '0'; // Initial state: hide hand cursor
            }
        } else if (isCosmicCursor) {
            if (cosmicPointerEl) {
                cosmicPointerEl.dataset.visible = '1';
                cosmicPointerEl.dataset.hover = '0'; // Initial state: show pointer
            }
            if (cosmicCursorEl) {
                cosmicCursorEl.dataset.visible = '1';
                cosmicCursorEl.dataset.hover = '0'; // Initial state: hide cursor
            }
        } else if (isCelestialCursor) {
            if (celestialPointerEl) {
                celestialPointerEl.dataset.visible = '1';
                celestialPointerEl.dataset.hover = '0'; // Initial state: show pointer
            }
            if (celestialCursorEl) {
                celestialCursorEl.dataset.visible = '1';
                celestialCursorEl.dataset.hover = '0'; // Initial state: hide cursor
            }
        }

        const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const onMove = (e) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            
            if (isSpaceCursor) {
                // Position both elements centered at pointer; helmet scales via CSS var
                if (helmetEl) {
                    helmetEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) scale(var(--cc-scale, 1))`;
                }
                if (rocketEl) {
                    rocketEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isWoodCursor) {
                // Position wood cursors (pointer always visible, cursor only on hover)
                if (woodPointerEl) {
                    woodPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (woodCursorEl) {
                    // Always update position, opacity is controlled by CSS based on data-hover
                    woodCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isCosmicCursor) {
                // Position cosmic cursors (pointer always visible, cursor only on hover)
                if (cosmicPointerEl) {
                    cosmicPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (cosmicCursorEl) {
                    cosmicCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isCelestialCursor) {
                // Position celestial cursors (pointer always visible, cursor only on hover)
                if (celestialPointerEl) {
                    celestialPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (celestialCursorEl) {
                    celestialCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            }

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
            if (isSpaceCursor) {
                if (helmetEl) helmetEl.dataset.visible = '1';
                if (rocketEl) rocketEl.dataset.visible = '1';
            } else if (isWoodCursor) {
                if (woodPointerEl) woodPointerEl.dataset.visible = '1';
                if (woodCursorEl) woodCursorEl.dataset.visible = '1';
            } else if (isCosmicCursor) {
                if (cosmicPointerEl) cosmicPointerEl.dataset.visible = '1';
                if (cosmicCursorEl) cosmicCursorEl.dataset.visible = '1';
            } else if (isCelestialCursor) {
                if (celestialPointerEl) celestialPointerEl.dataset.visible = '1';
                if (celestialCursorEl) celestialCursorEl.dataset.visible = '1';
            }
        };
        const onPointerLeave = () => {
            if (isSpaceCursor) {
                if (helmetEl) helmetEl.dataset.visible = '0';
                if (rocketEl) rocketEl.dataset.visible = '0';
            } else if (isWoodCursor) {
                if (woodPointerEl) woodPointerEl.dataset.visible = '0';
                if (woodCursorEl) woodCursorEl.dataset.visible = '0';
            } else if (isCosmicCursor) {
                if (cosmicPointerEl) cosmicPointerEl.dataset.visible = '0';
                if (cosmicCursorEl) cosmicCursorEl.dataset.visible = '0';
            } else if (isCelestialCursor) {
                if (celestialPointerEl) celestialPointerEl.dataset.visible = '0';
                if (celestialCursorEl) celestialCursorEl.dataset.visible = '0';
            }
        };

        const updateHoverState = (isHover) => {
            if (isSpaceCursor) {
                if (helmetEl) helmetEl.dataset.hover = isHover ? '1' : '0';
                if (rocketEl) rocketEl.dataset.hover = isHover ? '1' : '0';
            } else if (isWoodCursor) {
                // Wood pointer: hide when hovering (data-hover="1" -> opacity: 0)
                // Wood cursor: show when hovering (data-hover="1" -> opacity: 1)
                if (woodPointerEl) woodPointerEl.dataset.hover = isHover ? '1' : '0';
                if (woodCursorEl) {
                    woodCursorEl.dataset.hover = isHover ? '1' : '0';
                    woodCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isCosmicCursor) {
                // Cosmic pointer: hide when hovering, cursor: show when hovering
                if (cosmicPointerEl) cosmicPointerEl.dataset.hover = isHover ? '1' : '0';
                if (cosmicCursorEl) {
                    cosmicCursorEl.dataset.hover = isHover ? '1' : '0';
                    cosmicCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isCelestialCursor) {
                // Celestial pointer: hide when hovering, cursor: show when hovering
                if (celestialPointerEl) celestialPointerEl.dataset.hover = isHover ? '1' : '0';
                if (celestialCursorEl) {
                    celestialCursorEl.dataset.hover = isHover ? '1' : '0';
                    celestialCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            }
        };

        const interactiveSelectors = [
            // Native interactive elements
            'a',
            'button',
            'input',
            'textarea',
            'select',
            'label',
            '[contenteditable="true"]',
            '[role="button"]',
            '[role="tab"]',
            '[role="menuitem"]',
            '[role="link"]',
            // App-specific hooks
            '.clickable',
            '[data-interactive="true"]',
            // Ant Design common controls
            '.ant-btn',
            '.ant-input',
            '.ant-input-affix-wrapper',
            '.ant-select',
            '.ant-select-selector',
            '.ant-tabs-tab',
            '.ant-tabs-tab-btn',
            '.ant-segmented-item',
            '.ant-switch',
            '.ant-pagination-item',
        ];

        // Hover state is handled in onMove via elementFromPoint

        // No trailing animation needed; rocket snaps to pointer in onMove

        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerenter', onPointerEnter);
        window.addEventListener('pointerleave', onPointerLeave);
        // We rely on pointermove + elementFromPoint, so no mouseover/mouseout listeners needed

        // Initial position in center
        if (isSpaceCursor) {
            if (helmetEl) {
                helmetEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) scale(var(--cc-scale, 1))`;
            }
            if (rocketEl) {
                rocketEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        } else if (isWoodCursor) {
            if (woodPointerEl) {
                woodPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (woodCursorEl) {
                woodCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        } else if (isCosmicCursor) {
            if (cosmicPointerEl) {
                cosmicPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (cosmicCursorEl) {
                cosmicCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        } else if (isCelestialCursor) {
            if (celestialPointerEl) {
                celestialPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (celestialCursorEl) {
                celestialCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        }
        // No RAF loop since both elements are updated on pointermove

        return () => {
            // No RAF loop to cancel
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerenter', onPointerEnter);
            window.removeEventListener('pointerleave', onPointerLeave);
            // no mouseover/mouseout listeners to remove
            document.body.classList.remove('custom-cursor-enabled');
        };
    }, [mounted, cursorType]);

    const cursorContent = cursorType === 'space' ? (
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
    ) : cursorType === 'wood' ? (
        <>
            <img
                ref={woodPointerRef}
                src="/img/wood_pointer.png"
                alt="cursor-wood-pointer"
                className="cc-cursor cc-cursor-wood-pointer"
                draggable={false}
            />
            <img
                ref={woodCursorRef}
                src="/img/wood_cursor.png"
                alt="cursor-wood-hand"
                className="cc-cursor cc-cursor-wood-cursor"
                draggable={false}
            />
        </>
    ) : cursorType === 'cosmic' ? (
        <>
            <img
                ref={cosmicPointerRef}
                src="/img/cosmic-cursor.png"
                alt="cursor-cosmic-pointer"
                className="cc-cursor cc-cursor-cosmic-pointer"
                draggable={false}
            />
            <img
                ref={cosmicCursorRef}
                src="/img/cosmic-pointer.png"
                alt="cursor-cosmic-hand"
                className="cc-cursor cc-cursor-cosmic-cursor"
                draggable={false}
            />
        </>
    ) : cursorType === 'celestial' ? (
        <>
            <img
                ref={celestialPointerRef}
                src="/img/celestial-cursor.png"
                alt="cursor-celestial-pointer"
                className="cc-cursor cc-cursor-celestial-pointer"
                draggable={false}
            />
            <img
                ref={celestialCursorRef}
                src="/img/celestial-pointer.png"
                alt="cursor-celestial-hand"
                className="cc-cursor cc-cursor-celestial-cursor"
                draggable={false}
            />
        </>
    ) : null;

    // Use portal to render directly to body, ensuring it's always on top
    if (!mounted) return null;
    return createPortal(cursorContent, document.body);
}


