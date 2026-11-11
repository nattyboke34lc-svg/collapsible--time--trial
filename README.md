# COLLAPSIBLE TIME — THE FIRST THRESHOLD

A browser-based 3D vertical slice for the Collapsible Time universe.

## Play locally
Serve this folder with any static web server and open it in a modern browser. The game imports Three.js 0.170 from jsDelivr, so an internet connection is required. Opening `index.html` directly as a file may be blocked by browser module/CORS rules.

## Current experience
- Real-time 3D papercraft-inspired airport, hangar, runway, aircraft, hills, trees and moving cloud clusters.
- Original procedural 3D pilot character Mara with a beanie, braids, expressive face, flight-suit details, rounded articulated limbs and walk/idle motion.
- Third-person camera, keyboard controls and touch joystick.
- World-space beacons and interaction rings for the flight board, radio and timeline threshold.
- A branching story decision with an impact index.
- A visible timeline aperture with animated rings and synthesized interaction/transition sounds.
- Responsive HUD and mobile layout.

## Controls
- WASD / arrow keys: move
- E / Enter: interact
- Mobile: on-screen joystick and Interact button
- Sound button: toggle synthesized sound effects

## Technology
- Three.js 0.170, HTML, CSS and JavaScript.
- Procedural geometry and original browser-generated sound effects.
- No paid assets, subscriptions or external model downloads.

## Art direction
Handcrafted dimensional papercraft, warm natural light, soft pastel aviation palette, tactile paper-like materials, folded silhouettes and surreal timeline phenomena. The visual identity is intended to belong to Collapsible Time, not imitate another game's characters or environments.

## Current limitations
This is an early 3D vertical slice, not a finished multiplayer game. Mara is currently procedural geometry, not a Blender-authored rigged production character. A faithful recreation of the original reference image, detailed facial animation, high-quality character rig, richer cockpit and flight sequence, persistent consequence system, multiplayer, additional timelines, accessibility settings and full playtesting remain future production work.

Olympiad-style challenges are not in this opening aviation chapter. They are planned as future optional Timeline Trials, integrated into world-specific discovery and progression rather than inserted as unrelated quiz pop-ups.

The earlier 2D prototype remains in `paper-world.js` for reference. The current page loads `game.js`.
