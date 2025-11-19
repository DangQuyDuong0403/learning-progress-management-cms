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
    const anh7PointerRef = useRef(null);
    const anh7CursorRef = useRef(null);
    const blueCrystalPointerRef = useRef(null);
    const blueCrystalCursorRef = useRef(null);
    const diamondPointerRef = useRef(null);
    const diamondCursorRef = useRef(null);
    const icyPointerRef = useRef(null);
    const icyCursorRef = useRef(null);
    const m10PointerRef = useRef(null);
    const m10CursorRef = useRef(null);
    const moonPointerRef = useRef(null);
    const moonCursorRef = useRef(null);
    const [mounted, setMounted] = React.useState(false);
    const [cursorType, setCursorType] = React.useState(() => {
        return localStorage.getItem('customCursorType') || 'default';
    });

    // Ensure component is mounted before rendering portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Listen for cursor type changes (both storage events and custom events)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'customCursorType') {
                setCursorType(e.newValue || 'default');
            }
        };
        
        const handleCursorTypeChange = (e) => {
            setCursorType(e.detail?.cursorType || 'default');
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
        
        // If default cursor, don't render custom cursor
        if (cursorType === 'default') {
            document.body.classList.remove('custom-cursor-enabled');
            return;
        }
        
        // Get the appropriate cursor element based on cursor type
        const isSpaceCursor = cursorType === 'space';
        const isWoodCursor = cursorType === 'wood';
        const isCosmicCursor = cursorType === 'cosmic';
        const isCelestialCursor = cursorType === 'celestial';
        const isAnh7Cursor = cursorType === 'anh7';
        const isBlueCrystalCursor = cursorType === 'blue_crystal';
        const isDiamondCursor = cursorType === 'diamond';
        const isIcyCursor = cursorType === 'icy';
        const isM10Cursor = cursorType === 'm10';
        const isMoonCursor = cursorType === 'moon';
        
        const helmetEl = isSpaceCursor ? helmetRef.current : null;
        const rocketEl = isSpaceCursor ? rocketRef.current : null;
        const woodPointerEl = isWoodCursor ? woodPointerRef.current : null;
        const woodCursorEl = isWoodCursor ? woodCursorRef.current : null;
        const cosmicPointerEl = isCosmicCursor ? cosmicPointerRef.current : null;
        const cosmicCursorEl = isCosmicCursor ? cosmicCursorRef.current : null;
        const celestialPointerEl = isCelestialCursor ? celestialPointerRef.current : null;
        const celestialCursorEl = isCelestialCursor ? celestialCursorRef.current : null;
        const anh7PointerEl = isAnh7Cursor ? anh7PointerRef.current : null;
        const anh7CursorEl = isAnh7Cursor ? anh7CursorRef.current : null;
        const blueCrystalPointerEl = isBlueCrystalCursor ? blueCrystalPointerRef.current : null;
        const blueCrystalCursorEl = isBlueCrystalCursor ? blueCrystalCursorRef.current : null;
        const diamondPointerEl = isDiamondCursor ? diamondPointerRef.current : null;
        const diamondCursorEl = isDiamondCursor ? diamondCursorRef.current : null;
        const icyPointerEl = isIcyCursor ? icyPointerRef.current : null;
        const icyCursorEl = isIcyCursor ? icyCursorRef.current : null;
        const m10PointerEl = isM10Cursor ? m10PointerRef.current : null;
        const m10CursorEl = isM10Cursor ? m10CursorRef.current : null;
        const moonPointerEl = isMoonCursor ? moonPointerRef.current : null;
        const moonCursorEl = isMoonCursor ? moonCursorRef.current : null;
        
        const activeEl = isSpaceCursor ? (helmetEl || rocketEl) 
            : isWoodCursor ? (woodPointerEl || woodCursorEl)
            : isCosmicCursor ? (cosmicPointerEl || cosmicCursorEl)
            : isCelestialCursor ? (celestialPointerEl || celestialCursorEl)
            : isAnh7Cursor ? (anh7PointerEl || anh7CursorEl)
            : isBlueCrystalCursor ? (blueCrystalPointerEl || blueCrystalCursorEl)
            : isDiamondCursor ? (diamondPointerEl || diamondCursorEl)
            : isIcyCursor ? (icyPointerEl || icyCursorEl)
            : isM10Cursor ? (m10PointerEl || m10CursorEl)
            : isMoonCursor ? (moonPointerEl || moonCursorEl)
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
        } else if (isAnh7Cursor) {
            if (anh7PointerEl) {
                anh7PointerEl.dataset.visible = '1';
                anh7PointerEl.dataset.hover = '0';
            }
            if (anh7CursorEl) {
                anh7CursorEl.dataset.visible = '1';
                anh7CursorEl.dataset.hover = '0';
            }
        } else if (isBlueCrystalCursor) {
            if (blueCrystalPointerEl) {
                blueCrystalPointerEl.dataset.visible = '1';
                blueCrystalPointerEl.dataset.hover = '0';
            }
            if (blueCrystalCursorEl) {
                blueCrystalCursorEl.dataset.visible = '1';
                blueCrystalCursorEl.dataset.hover = '0';
            }
        } else if (isDiamondCursor) {
            if (diamondPointerEl) {
                diamondPointerEl.dataset.visible = '1';
                diamondPointerEl.dataset.hover = '0';
            }
            if (diamondCursorEl) {
                diamondCursorEl.dataset.visible = '1';
                diamondCursorEl.dataset.hover = '0';
            }
        } else if (isIcyCursor) {
            if (icyPointerEl) {
                icyPointerEl.dataset.visible = '1';
                icyPointerEl.dataset.hover = '0';
            }
            if (icyCursorEl) {
                icyCursorEl.dataset.visible = '1';
                icyCursorEl.dataset.hover = '0';
            }
        } else if (isM10Cursor) {
            if (m10PointerEl) {
                m10PointerEl.dataset.visible = '1';
                m10PointerEl.dataset.hover = '0';
            }
            if (m10CursorEl) {
                m10CursorEl.dataset.visible = '1';
                m10CursorEl.dataset.hover = '0';
            }
        } else if (isMoonCursor) {
            if (moonPointerEl) {
                moonPointerEl.dataset.visible = '1';
                moonPointerEl.dataset.hover = '0';
            }
            if (moonCursorEl) {
                moonCursorEl.dataset.visible = '1';
                moonCursorEl.dataset.hover = '0';
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
            } else if (isAnh7Cursor) {
                if (anh7PointerEl) {
                    anh7PointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (anh7CursorEl) {
                    anh7CursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isBlueCrystalCursor) {
                if (blueCrystalPointerEl) {
                    blueCrystalPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (blueCrystalCursorEl) {
                    blueCrystalCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isDiamondCursor) {
                if (diamondPointerEl) {
                    diamondPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (diamondCursorEl) {
                    diamondCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isIcyCursor) {
                if (icyPointerEl) {
                    icyPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (icyCursorEl) {
                    icyCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isM10Cursor) {
                if (m10PointerEl) {
                    m10PointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (m10CursorEl) {
                    m10CursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isMoonCursor) {
                if (moonPointerEl) {
                    moonPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
                if (moonCursorEl) {
                    moonCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
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
            } else if (isAnh7Cursor) {
                if (anh7PointerEl) anh7PointerEl.dataset.visible = '1';
                if (anh7CursorEl) anh7CursorEl.dataset.visible = '1';
            } else if (isBlueCrystalCursor) {
                if (blueCrystalPointerEl) blueCrystalPointerEl.dataset.visible = '1';
                if (blueCrystalCursorEl) blueCrystalCursorEl.dataset.visible = '1';
            } else if (isDiamondCursor) {
                if (diamondPointerEl) diamondPointerEl.dataset.visible = '1';
                if (diamondCursorEl) diamondCursorEl.dataset.visible = '1';
            } else if (isIcyCursor) {
                if (icyPointerEl) icyPointerEl.dataset.visible = '1';
                if (icyCursorEl) icyCursorEl.dataset.visible = '1';
            } else if (isM10Cursor) {
                if (m10PointerEl) m10PointerEl.dataset.visible = '1';
                if (m10CursorEl) m10CursorEl.dataset.visible = '1';
            } else if (isMoonCursor) {
                if (moonPointerEl) moonPointerEl.dataset.visible = '1';
                if (moonCursorEl) moonCursorEl.dataset.visible = '1';
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
            } else if (isAnh7Cursor) {
                if (anh7PointerEl) anh7PointerEl.dataset.visible = '0';
                if (anh7CursorEl) anh7CursorEl.dataset.visible = '0';
            } else if (isBlueCrystalCursor) {
                if (blueCrystalPointerEl) blueCrystalPointerEl.dataset.visible = '0';
                if (blueCrystalCursorEl) blueCrystalCursorEl.dataset.visible = '0';
            } else if (isDiamondCursor) {
                if (diamondPointerEl) diamondPointerEl.dataset.visible = '0';
                if (diamondCursorEl) diamondCursorEl.dataset.visible = '0';
            } else if (isIcyCursor) {
                if (icyPointerEl) icyPointerEl.dataset.visible = '0';
                if (icyCursorEl) icyCursorEl.dataset.visible = '0';
            } else if (isM10Cursor) {
                if (m10PointerEl) m10PointerEl.dataset.visible = '0';
                if (m10CursorEl) m10CursorEl.dataset.visible = '0';
            } else if (isMoonCursor) {
                if (moonPointerEl) moonPointerEl.dataset.visible = '0';
                if (moonCursorEl) moonCursorEl.dataset.visible = '0';
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
            } else if (isAnh7Cursor) {
                if (anh7PointerEl) anh7PointerEl.dataset.hover = isHover ? '1' : '0';
                if (anh7CursorEl) {
                    anh7CursorEl.dataset.hover = isHover ? '1' : '0';
                    anh7CursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isBlueCrystalCursor) {
                if (blueCrystalPointerEl) blueCrystalPointerEl.dataset.hover = isHover ? '1' : '0';
                if (blueCrystalCursorEl) {
                    blueCrystalCursorEl.dataset.hover = isHover ? '1' : '0';
                    blueCrystalCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isDiamondCursor) {
                if (diamondPointerEl) diamondPointerEl.dataset.hover = isHover ? '1' : '0';
                if (diamondCursorEl) {
                    diamondCursorEl.dataset.hover = isHover ? '1' : '0';
                    diamondCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isIcyCursor) {
                if (icyPointerEl) icyPointerEl.dataset.hover = isHover ? '1' : '0';
                if (icyCursorEl) {
                    icyCursorEl.dataset.hover = isHover ? '1' : '0';
                    icyCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isM10Cursor) {
                if (m10PointerEl) m10PointerEl.dataset.hover = isHover ? '1' : '0';
                if (m10CursorEl) {
                    m10CursorEl.dataset.hover = isHover ? '1' : '0';
                    m10CursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
                }
            } else if (isMoonCursor) {
                if (moonPointerEl) moonPointerEl.dataset.hover = isHover ? '1' : '0';
                if (moonCursorEl) {
                    moonCursorEl.dataset.hover = isHover ? '1' : '0';
                    moonCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
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
        } else if (isAnh7Cursor) {
            if (anh7PointerEl) {
                anh7PointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (anh7CursorEl) {
                anh7CursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        } else if (isBlueCrystalCursor) {
            if (blueCrystalPointerEl) {
                blueCrystalPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (blueCrystalCursorEl) {
                blueCrystalCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        } else if (isDiamondCursor) {
            if (diamondPointerEl) {
                diamondPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (diamondCursorEl) {
                diamondCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        } else if (isIcyCursor) {
            if (icyPointerEl) {
                icyPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (icyCursorEl) {
                icyCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        } else if (isM10Cursor) {
            if (m10PointerEl) {
                m10PointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (m10CursorEl) {
                m10CursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
        } else if (isMoonCursor) {
            if (moonPointerEl) {
                moonPointerEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
            }
            if (moonCursorEl) {
                moonCursorEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
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

    const cursorContent = cursorType === 'default' ? null : cursorType === 'space' ? (
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
    ) : cursorType === 'anh7' ? (
        <>
            <img
                ref={anh7PointerRef}
                src="/img/anh7_cursor.png"
                alt="cursor-anh7-pointer"
                className="cc-cursor cc-cursor-anh7-pointer"
                draggable={false}
            />
            <img
                ref={anh7CursorRef}
                src="/img/anh7_pointer.png"
                alt="cursor-anh7-hand"
                className="cc-cursor cc-cursor-anh7-cursor"
                draggable={false}
            />
        </>
    ) : cursorType === 'blue_crystal' ? (
        <>
            <img
                ref={blueCrystalPointerRef}
                src="/img/blue_crystal_cursor.png"
                alt="cursor-blue-crystal-pointer"
                className="cc-cursor cc-cursor-blue-crystal-pointer"
                draggable={false}
            />
            <img
                ref={blueCrystalCursorRef}
                src="/img/blue_crystal_pointer.png"
                alt="cursor-blue-crystal-hand"
                className="cc-cursor cc-cursor-blue-crystal-cursor"
                draggable={false}
            />
        </>
    ) : cursorType === 'diamond' ? (
        <>
            <img
                ref={diamondPointerRef}
                src="/img/diamond_cursor.png"
                alt="cursor-diamond-pointer"
                className="cc-cursor cc-cursor-diamond-pointer"
                draggable={false}
            />
            <img
                ref={diamondCursorRef}
                src="/img/diamond_pointer.png"
                alt="cursor-diamond-hand"
                className="cc-cursor cc-cursor-diamond-cursor"
                draggable={false}
            />
        </>
    ) : cursorType === 'icy' ? (
        <>
            <img
                ref={icyPointerRef}
                src="/img/icy_cursor.png"
                alt="cursor-icy-pointer"
                className="cc-cursor cc-cursor-icy-pointer"
                draggable={false}
            />
            <img
                ref={icyCursorRef}
                src="/img/icy_pointer.png"
                alt="cursor-icy-hand"
                className="cc-cursor cc-cursor-icy-cursor"
                draggable={false}
            />
        </>
    ) : cursorType === 'm10' ? (
        <>
            <img
                ref={m10PointerRef}
                src="/img/m10_cursor.png"
                alt="cursor-m10-pointer"
                className="cc-cursor cc-cursor-m10-pointer"
                draggable={false}
            />
            <img
                ref={m10CursorRef}
                src="/img/m10_pointer.png"
                alt="cursor-m10-hand"
                className="cc-cursor cc-cursor-m10-cursor"
                draggable={false}
            />
        </>
    ) : cursorType === 'moon' ? (
        <>
            <img
                ref={moonPointerRef}
                src="/img/moon_cursor.png"
                alt="cursor-moon-pointer"
                className="cc-cursor cc-cursor-moon-pointer"
                draggable={false}
            />
            <img
                ref={moonCursorRef}
                src="/img/moon_pointer.png"
                alt="cursor-moon-hand"
                className="cc-cursor cc-cursor-moon-cursor"
                draggable={false}
            />
        </>
    ) : null;

    // Use portal to render directly to body, ensuring it's always on top
    if (!mounted) return null;
    if (!cursorContent) return null;
    return createPortal(cursorContent, document.body);
}


