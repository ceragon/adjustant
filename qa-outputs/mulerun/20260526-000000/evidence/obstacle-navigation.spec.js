const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '../../../../code/index.html');

test.describe('Obstacle Navigation - Unit Stuck Issues', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('NEW-001: Unit stuck between central cross obstacles', async ({ page }) => {
    /**
     * Issue: Units get stuck when moving through the central cross obstacle cluster
     * Obstacles at: [10,8], [10,12], [8,10], [12,10]
     * Gap between obstacles is only 1-2 cells wide
     */
    await page.click('#btn-start');
    await page.click('#btn-confirm-formation');
    
    // Wait for combat to initialize
    await page.waitForTimeout(1000);
    
    // Get initial unit positions
    const initialPositions = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({
        id: units.indexOf(u),
        x: u.x,
        y: u.y,
        type: u.type
      }));
    });
    
    console.log('Initial positions:', JSON.stringify(initialPositions));
    
    // Right-click to order units to move across the map (through central obstacles)
    // Target: far right side of the map
    const targetX = 700; // Near enemy side
    const targetY = 420; // Center Y
    
    await page.evaluate(({ tx, ty }) => {
      // Simulate right-click on target location
      const w = { x: tx, y: ty };
      const cmdUnits = units.filter(u => u.alive && u.team === 'player' && !u.retreating);
      cmdUnits.forEach(u => {
        u.command = { type: 'move', x: w.x, y: w.y };
        u.idle = false;
        u.target = null;
      });
    }, { tx: targetX, ty: targetY });
    
    // Wait for units to move
    await page.waitForTimeout(3000);
    
    // Check unit positions after 3 seconds
    const after3s = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({
        id: units.indexOf(u),
        x: u.x,
        y: u.y,
        type: u.type,
        hasCommand: !!u.command,
        retreating: u.retreating
      }));
    });
    
    console.log('After 3s positions:', JSON.stringify(after3s));
    
    // Calculate how much units moved
    const movement = after3s.map((pos, i) => {
      const init = initialPositions.find(p => p.id === pos.id);
      const dist = init ? Math.hypot(pos.x - init.x, pos.y - init.y) : 0;
      return { id: pos.id, dist, type: pos.type };
    });
    
    console.log('Movement distances:', JSON.stringify(movement));
    
    // Check if any unit moved less than 50px (likely stuck)
    const stuckUnits = movement.filter(m => m.dist < 50);
    console.log('Stuck units (moved < 50px):', JSON.stringify(stuckUnits));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'qa-outputs/mulerun/20260526-000000/evidence/obstacle-nav-01-central-cross.png',
      fullPage: false 
    });
    
    // Verify: at least some units should have moved significantly
    const movedUnits = movement.filter(m => m.dist > 100);
    console.log(`Moved units (> 100px): ${movedUnits.length}/${movement.length}`);
    
    // This test documents the issue - units may get stuck
    if (stuckUnits.length > 0) {
      console.log(`WARNING: ${stuckUnits.length} units appear stuck near central obstacles`);
    }
  });

  test('NEW-002: Unit stuck in corner obstacle cluster', async ({ page }) => {
    /**
     * Issue: Units get stuck near corner obstacle clusters
     * Top-left: [4,4], [5,4], [4,5]
     * Top-right: [16,4], [15,4], [16,5]
     * Bottom-left: [4,16], [5,16], [4,15]
     * Bottom-right: [16,16], [15,16], [16,15]
     */
    await page.click('#btn-start');
    await page.click('#btn-confirm-formation');
    await page.waitForTimeout(1000);
    
    // Get player HQ position to determine spawn side
    const hqPos = await page.evaluate(() => {
      const hq = buildings.find(b => b.team === 'player' && b.type === 'hq');
      return { x: hq.x, y: hq.y, gx: hq.gx, gy: hq.gy };
    });
    
    console.log('Player HQ at:', JSON.stringify(hqPos));
    
    // Order units to move towards a corner obstacle cluster
    // Target: top-left corner (obstacles at 4,4 / 5,4 / 4,5)
    const targetX = 180; // Cell 4.5 * 40
    const targetY = 180; // Cell 4.5 * 40
    
    await page.evaluate(({ tx, ty }) => {
      const cmdUnits = units.filter(u => u.alive && u.team === 'player' && !u.retreating);
      cmdUnits.forEach(u => {
        u.command = { type: 'move', x: w.x, y: w.y };
        u.idle = false;
      });
    }, { tx: targetX, ty: targetY });
    
    await page.waitForTimeout(4000);
    
    // Check positions
    const finalPositions = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({
        x: u.x, y: u.y, type: u.type
      }));
    });
    
    console.log('Final positions near corner:', JSON.stringify(finalPositions));
    
    await page.screenshot({ 
      path: 'qa-outputs/mulerun/20260526-000000/evidence/obstacle-nav-02-corner-cluster.png',
      fullPage: false 
    });
  });

  test('NEW-003: Multiple units blocking each other near obstacles', async ({ page }) => {
    /**
     * Issue: Unit separation logic (line 887-895) pushes units into obstacles
     * or causes deadlock when multiple units try to navigate the same gap
     */
    await page.click('#btn-start');
    await page.click('#btn-confirm-formation');
    await page.waitForTimeout(1000);
    
    // Get initial positions
    const initialPositions = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({
        x: u.x, y: u.y, type: u.type
      }));
    });
    
    // Order ALL units to move through a narrow gap (center of map)
    const targetX = 420; // Center X (cell 10.5)
    const targetY = 420; // Center Y (cell 10.5)
    
    await page.evaluate(({ tx, ty }) => {
      const cmdUnits = units.filter(u => u.alive && u.team === 'player' && !u.retreating);
      cmdUnits.forEach(u => {
        u.command = { type: 'move', x: tx, y: ty };
        u.idle = false;
      });
    }, { tx: targetX, ty: targetY });
    
    // Wait and observe
    await page.waitForTimeout(5000);
    
    // Final state
    const finalState = await page.evaluate(() => {
      const playerUnits = units.filter(u => u.team === 'player' && u.alive);
      return {
        positions: playerUnits.map(u => ({ x: u.x, y: u.y, type: u.type })),
        commands: playerUnits.map(u => !!u.command),
        idle: playerUnits.map(u => u.idle)
      };
    });
    
    console.log('Final state after 5s:', JSON.stringify(finalState));
    
    await page.screenshot({ 
      path: 'qa-outputs/mulerun/20260526-000000/evidence/obstacle-nav-03-multi-unit-blocking.png',
      fullPage: false 
    });
  });

  test('NEW-004: Obstacle avoidance algorithm edge cases', async ({ page }) => {
    /**
     * Issue: moveToward() line 908-928 has specific edge cases:
     * 1. Both lateral probes blocked → no direction change (unit stops)
     * 2. Random selection (Math.random>0.5) when both sides clear → nondeterministic
     * 3. No retry with different angles if first attempt fails
     */
    await page.click('#btn-start');
    await page.click('#btn-confirm-formation');
    await page.waitForTimeout(1000);
    
    // Get obstacle positions
    const obstaclePositions = await page.evaluate(() => {
      return obstacles.map(o => ({ gx: o.gx, gy: o.gy, x: o.gx * 40, y: o.gy * 40 }));
    });
    
    console.log('Obstacle positions:', JSON.stringify(obstaclePositions));
    
    // Get unit positions
    const unitPositions = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({
        x: u.x, y: u.y, type: u.type
      }));
    });
    
    console.log('Unit positions:', JSON.stringify(unitPositions));
    
    // Analyze: find units that are close to obstacles (< 1.5 cells)
    const nearObstacles = await page.evaluate(() => {
      const threshold = 1.5 * 40; // 1.5 cells
      return units.filter(u => u.team === 'player' && u.alive).map(u => {
        const nearestObs = obstacles.reduce((min, o) => {
          const d = Math.hypot(u.x - (o.gx * 40 + 20), u.y - (o.gy * 40 + 20));
          return Math.min(min, d);
        }, Infinity);
        return { type: u.type, dist: nearestObs, near: nearestObs < threshold };
      });
    });
    
    console.log('Units near obstacles:', JSON.stringify(nearObstacles));
    
    await page.screenshot({ 
      path: 'qa-outputs/mulerun/20260526-000000/evidence/obstacle-nav-04-edge-cases.png',
      fullPage: false 
    });
  });
});
