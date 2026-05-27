# Context: MuleRun (Azeroth Chronicles)

## Glossary

| Term | Definition |
|------|------------|
| HQ (Headquarters / 主堡) | Core building for each team. Destroying enemy HQ = win condition. Spawns at column 2-3 (player) or 17-18 (enemy). |
| Tower (防御塔) | Defensive building flanking HQ. Auto-attacks enemies in range. Placed at Y±2 relative to HQ to ensure click separation. |
| Spawn Point (出生点) | A group of 1 HQ + 2 Towers at fixed grid coordinates. 3 per side (left/right). |
| Spawn Config | Preset arrangement of one spawn point per side, randomly selected at combat start. |
| Formation Row (排) | Player assigns units to Front / Mid / Back row during deployment phase. Determines initial positioning relative to HQ. |
| Fog of War (战争迷雾) | Three states per cell: Unexplored, Explored, Visible. Only Visible cells reveal enemy units. Player's own half is always Visible. |
| Edge Scrolling (边缘滚动) | Camera pans when mouse approaches screen edge (< 10px dead zone, every frame). Was 40px causing "mouse stuck" bug. |
| Scattering / Separation (散开) | Post-movement push-apart logic preventing unit overlap. Applied every tick as pairwise separation. Capped at 50 iterations per frame to prevent freeze. |
| Focus Command (集火指令) | Player manually targets a specific enemy unit; overrides retreat and idle behavior. |
| God View (上帝视角) | AI can see all entities regardless of fog. Bug fixed — AI uses same fog system as player (Option A: each AI unit produces vision). |
| Blind Orders (盲指令) | Commands given to AI units when no enemy is visible. Melee units advance toward center line; ranged units hold position near towers. |
