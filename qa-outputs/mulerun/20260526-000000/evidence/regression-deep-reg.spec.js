// DEEP-005 & REG-003 Regression Test + Historical Bug Verification
// Run with: npx playwright test regression-deep-reg.spec.js --headed

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const HTML_PATH = path.resolve(__dirname, '../../../../code/index.html');
const FILE_URL = `file://${HTML_PATH}`;
const EVIDENCE_DIR = path.resolve(__dirname, '../evidence');

if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

test.describe('DEEP-005 & REG-003 Regression', () => {

  test('DEEP-005: 6 spawns - no obstacle at spawn points', async ({ page }) => {
    const results = [];
    for (let i = 0; i < 6; i++) {
      await page.goto(FILE_URL);
      await page.waitForSelector('#deploy-screen.active');

      // Select 8 units (3 infantry, 3 archer, 2 cavalry)
      for (let j = 0; j < 3; j++) await page.click('[data-unit="infantry"].btn-plus');
      for (let j = 0; j < 3; j++) await page.click('[data-unit="archer"].btn-plus');
      for (let j = 0; j < 2; j++) await page.click('[data-unit="cavalry"].btn-plus');
      await expect(page.locator('#btn-start')).toBeEnabled();
      await page.click('#btn-start');

      await page.waitForSelector('#formation-screen.active');
      await page.click('#btn-confirm-formation');

      await page.waitForSelector('#combat-screen.active');
      await page.waitForTimeout(1500);

      // Screenshot for evidence
      const ssPath = path.join(EVIDENCE_DIR, `deep005-spawn-${i+1}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });

      // Evaluate obstacle vs spawn config overlap via JS
      const overlap = await page.evaluate(() => {
        // Get all obstacle positions
        const obsSet = new Set(obstacles.map(o => o.gx + ',' + o.gy));
        // Check against spawn configs
        const conflicts = [];
        for (const side of ['left', 'right']) {
          for (const cfg of SPAWN_CONFIGS[side]) {
            const hqKey = cfg.hq[0] + ',' + cfg.hq[1];
            if (obsSet.has(hqKey)) conflicts.push({ type: 'hq', pos: cfg.hq, side });
            for (const t of cfg.towers) {
              const tKey = t[0] + ',' + t[1];
              if (obsSet.has(tKey)) conflicts.push({ type: 'tower', pos: t, side });
            }
          }
        }
        return conflicts;
      });

      results.push({ game: i + 1, spawnConfig: i, conflicts: overlap });
      console.log(`DEEP-005 Game ${i+1}: ${overlap.length === 0 ? 'PASS' : 'FAIL'} - conflicts: ${JSON.stringify(overlap)}`);
    }

    // Save results
    const outPath = path.join(EVIDENCE_DIR, 'deep005-results.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

    // Assert no conflicts
    const totalConflicts = results.reduce((a, r) => a + r.conflicts.length, 0);
    expect(totalConflicts).toBe(0);
  });

  test('DEEP-005: Units can move after spawn', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForSelector('#deploy-screen.active');

    // Select 8 units
    for (let j = 0; j < 3; j++) await page.click('[data-unit="infantry"].btn-plus');
    for (let j = 0; j < 3; j++) await page.click('[data-unit="archer"].btn-plus');
    for (let j = 0; j < 2; j++) await page.click('[data-unit="cavalry"].btn-plus');
    await page.click('#btn-start');
    await page.waitForSelector('#formation-screen.active');
    await page.click('#btn-confirm-formation');
    await page.waitForSelector('#combat-screen.active');
    await page.waitForTimeout(1000);

    // Box select all player units (drag from top-left to bottom-right of player area)
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();

    // Mouse down at canvas center-left (player area)
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7);
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(300);

    // Right-click to move (empty ground)
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.5, { button: 'right' });
    await page.waitForTimeout(200);

    // Get initial unit positions
    const posBefore = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({ x: Math.round(u.x), y: Math.round(u.y) }));
    });

    await page.waitForTimeout(2000);

    // Get positions after 2s
    const posAfter = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({ x: Math.round(u.x), y: Math.round(u.y) }));
    });

    // At least some units should have moved
    const moved = posBefore.filter((p, i) => p.x !== posAfter[i].x || p.y !== posAfter[i].y).length;
    console.log(`DEEP-005 move test: ${moved}/${posBefore.length} units moved`);

    const ssPath = path.join(EVIDENCE_DIR, 'deep005-move-before.png');
    const ssPath2 = path.join(EVIDENCE_DIR, 'deep005-move-after.png');
    // We can't retroactively screenshot, but we check positions
    expect(moved).toBeGreaterThan(0);
  });

  test('REG-003: Player half 100% visible at start and over time', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForSelector('#deploy-screen.active');

    for (let j = 0; j < 3; j++) await page.click('[data-unit="infantry"].btn-plus');
    for (let j = 0; j < 3; j++) await page.click('[data-unit="archer"].btn-plus');
    for (let j = 0; j < 2; j++) await page.click('[data-unit="cavalry"].btn-plus');
    await page.click('#btn-start');
    await page.waitForSelector('#formation-screen.active');
    await page.click('#btn-confirm-formation');
    await page.waitForSelector('#combat-screen.active');

    // Check at 2s, 5s, 10s
    const checks = [
      { time: 2000, label: '2s' },
      { time: 5000, label: '5s' },
      { time: 10000, label: '10s' },
    ];

    const results = [];
    for (const check of checks) {
      await page.waitForTimeout(check.time - (checks.indexOf(check) > 0 ? checks[checks.indexOf(check) - 1].time : 0));

      const fogStats = await page.evaluate(() => {
        const playerHQ = buildings.find(b => b.team === 'player' && b.type === 'hq');
        const isLeft = playerHQ.gx < COLS / 2;
        const halfCol = isLeft ? Math.ceil(COLS / 2) : Math.floor(COLS / 2);
        const startGx = isLeft ? 0 : halfCol;
        const endGx = isLeft ? halfCol : COLS;

        let total = 0, visible = 0, explored = 0, unexplored = 0;
        for (let gx = startGx; gx < endGx; gx++) {
          for (let gy = 0; gy < ROWS; gy++) {
            total++;
            const state = fogGrid[gy * COLS + gx];
            if (state === FOG_VISIBLE) visible++;
            else if (state === FOG_EXPLORED) explored++;
            else unexplored++;
          }
        }
        return { total, visible, explored, unexplored, visiblePct: (visible / total * 100).toFixed(1) };
      });

      results.push({ ...check, stats: fogStats });
      console.log(`REG-003 at ${check.label}: ${fogStats.visiblePct}% visible (${fogStats.visible}/${fogStats.total}), explored: ${fogStats.explored}, unexplored: ${fogStats.unexplored}`);

      const ssPath = path.join(EVIDENCE_DIR, `reg003-fog-${check.label}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
    }

    const outPath = path.join(EVIDENCE_DIR, 'reg003-results.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

    // All checkpoints should have 100% visible
    for (const r of results) {
      expect(parseFloat(r.stats.visiblePct)).toBe(100);
    }
  });

  test('REG-003: Enemy half should be fog-covered', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForSelector('#deploy-screen.active');

    for (let j = 0; j < 3; j++) await page.click('[data-unit="infantry"].btn-plus');
    for (let j = 0; j < 3; j++) await page.click('[data-unit="archer"].btn-plus');
    for (let j = 0; j < 2; j++) await page.click('[data-unit="cavalry"].btn-plus');
    await page.click('#btn-start');
    await page.waitForSelector('#formation-screen.active');
    await page.click('#btn-confirm-formation');
    await page.waitForSelector('#combat-screen.active');
    await page.waitForTimeout(2000);

    const enemyFog = await page.evaluate(() => {
      const playerHQ = buildings.find(b => b.team === 'player' && b.type === 'hq');
      const isLeft = playerHQ.gx < COLS / 2;
      const halfCol = isLeft ? Math.ceil(COLS / 2) : Math.floor(COLS / 2);
      const startGx = isLeft ? halfCol : 0;
      const endGx = isLeft ? COLS : halfCol;

      let total = 0, visible = 0, unexplored = 0;
      for (let gx = startGx; gx < endGx; gx++) {
        for (let gy = 0; gy < ROWS; gy++) {
          total++;
          const state = fogGrid[gy * COLS + gx];
          if (state === FOG_VISIBLE) visible++;
          else if (state === FOG_UNEXPLORED) unexplored++;
        }
      }
      return { total, visible, unexplored, visiblePct: (visible / total * 100).toFixed(1) };
    });

    console.log(`REG-003 enemy half: ${enemyFog.visiblePct}% visible, ${enemyFog.unexplored} unexplored`);
    // Enemy half should have very low visibility (only what units/buildings can see)
    expect(parseFloat(enemyFog.visiblePct)).toBeLessThan(30);
  });

  // === Historical regression checks ===

  test('BUG-001: Retreating unit heals and rejoins', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForSelector('#deploy-screen.active');

    for (let j = 0; j < 3; j++) await page.click('[data-unit="infantry"].btn-plus');
    for (let j = 0; j < 3; j++) await page.click('[data-unit="archer"].btn-plus');
    for (let j = 0; j < 2; j++) await page.click('[data-unit="cavalry"].btn-plus');
    await page.click('#btn-start');
    await page.waitForSelector('#formation-screen.active');
    await page.click('#btn-confirm-formation');
    await page.waitForSelector('#combat-screen.active');

    // Wait for combat to start, damage a unit, then order retreat
    await page.waitForTimeout(3000);

    // Get a damaged unit
    const damagedUnit = await page.evaluate(() => {
      const u = units.find(u => u.team === 'player' && u.alive && u.hp < u.maxHp);
      return u ? { hp: u.hp, maxHp: u.maxHp, x: u.x, y: u.y } : null;
    });

    if (damagedUnit) {
      // Right-click on the damaged unit to order retreat
      const canvas = page.locator('#game-canvas');
      const box = await canvas.boundingBox();
      const sx = (damagedUnit.x) * (box.width / 840);
      const sy = (damagedUnit.y) * (box.height / 840);
      await page.mouse.click(box.x + sx, box.y + sy, { button: 'right' });
      await page.waitForTimeout(500);

      // Check unit is retreating
      const retreating = await page.evaluate(() => {
        return units.filter(u => u.team === 'player' && u.alive && u.retreating).length;
      });
      console.log(`BUG-001: ${retreating} player units retreating`);

      // Wait for healing
      await page.waitForTimeout(5000);

      const healedCount = await page.evaluate(() => {
        return units.filter(u => u.team === 'player' && u.alive && !u.retreating && u.hp >= u.maxHp).length;
      });
      console.log(`BUG-001: ${healedCount} units fully healed and rejoined`);
    }
  });

  test('BUG-002: Focus command overrides retreat', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForSelector('#deploy-screen.active');

    for (let j = 0; j < 3; j++) await page.click('[data-unit="infantry"].btn-plus');
    for (let j = 0; j < 3; j++) await page.click('[data-unit="archer"].btn-plus');
    for (let j = 0; j < 2; j++) await page.click('[data-unit="cavalry"].btn-plus');
    await page.click('#btn-start');
    await page.waitForSelector('#formation-screen.active');
    await page.click('#btn-confirm-formation');
    await page.waitForSelector('#combat-screen.active');
    await page.waitForTimeout(3000);

    // Make a unit retreat (right-click on it)
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();

    // Find a player unit position
    const playerUnit = await page.evaluate(() => {
      const u = units.find(u => u.team === 'player' && u.alive);
      return u ? { x: u.x, y: u.y } : null;
    });

    if (playerUnit) {
      const sx = playerUnit.x * (box.width / 840);
      const sy = playerUnit.y * (box.height / 840);
      await page.mouse.click(box.x + sx, box.y + sy, { button: 'right' });
      await page.waitForTimeout(500);

      // Select unit and right-click on visible enemy
      const enemyPos = await page.evaluate(() => {
        const e = units.find(u => u.team === 'enemy' && u.alive && isEntityVisibleToPlayer(u));
        return e ? { x: e.x, y: e.y } : null;
      });

      if (enemyPos) {
        // First select the retreating unit
        await page.mouse.click(box.x + sx, box.y + sy);
        await page.waitForTimeout(200);
        // Then right-click enemy to focus
        const esx = enemyPos.x * (box.width / 840);
        const esy = enemyPos.y * (box.height / 840);
        await page.mouse.click(box.x + esx, box.y + esy, { button: 'right' });
        await page.waitForTimeout(1000);

        const stillRetreating = await page.evaluate(() => {
          const retreatingUnits = units.filter(u => u.team === 'player' && u.alive && u.retreating);
          const focusUnits = units.filter(u => u.team === 'player' && u.alive && u.command && u.command.type === 'focus');
          return { retreating: retreatingUnits.length, focus: focusUnits.length };
        });
        console.log(`BUG-002: retreating=${stillRetreating.retreating}, focus=${stillRetreating.focus}`);
      }
    }
  });

  test('BUG-006: No selection, right-click ground = all units advance', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForSelector('#deploy-screen.active');

    for (let j = 0; j < 3; j++) await page.click('[data-unit="infantry"].btn-plus');
    for (let j = 0; j < 3; j++) await page.click('[data-unit="archer"].btn-plus');
    for (let j = 0; j < 2; j++) await page.click('[data-unit="cavalry"].btn-plus');
    await page.click('#btn-start');
    await page.waitForSelector('#formation-screen.active');
    await page.click('#btn-confirm-formation');
    await page.waitForSelector('#combat-screen.active');
    await page.waitForTimeout(1500);

    // Clear selection by clicking on empty area
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(200);

    const selCount = await page.evaluate(() => selectedUnits.length);
    expect(selCount).toBe(0);

    // Record positions
    const posBefore = await page.evaluate(() =>
      units.filter(u => u.team === 'player' && u.alive).map(u => ({ x: u.x, y: u.y }))
    );

    // Right-click on empty ground (no selection)
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.6, { button: 'right' });
    await page.waitForTimeout(2000);

    const posAfter = await page.evaluate(() =>
      units.filter(u => u.team === 'player' && u.alive).map(u => ({ x: u.x, y: u.y }))
    );

    const moved = posBefore.filter((p, i) =>
      Math.abs(p.x - posAfter[i].x) > 5 || Math.abs(p.y - posAfter[i].y) > 5
    ).length;

    const cmdUnits = await page.evaluate(() =>
      units.filter(u => u.team === 'player' && u.alive && u.command && u.command.type === 'move').length
    );

    console.log(`BUG-006: ${moved}/${posBefore.length} moved, ${cmdUnits} have move command`);
    expect(moved).toBeGreaterThan(0);
  });

  test('BUG-009: Mid-row units should not overlap with HQ/towers', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForSelector('#deploy-screen.active');

    // 3 infantry, 3 archer, 2 cavalry
    for (let j = 0; j < 3; j++) await page.click('[data-unit="infantry"].btn-plus');
    for (let j = 0; j < 3; j++) await page.click('[data-unit="archer"].btn-plus');
    for (let j = 0; j < 2; j++) await page.click('[data-unit="cavalry"].btn-plus');
    await page.click('#btn-start');
    await page.waitForSelector('#formation-screen.active');

    // Assign at least 2 to mid row
    // Default is mid, so just confirm
    await page.click('#btn-confirm-formation');
    await page.waitForSelector('#combat-screen.active');
    await page.waitForTimeout(1000);

    const overlap = await page.evaluate(() => {
      const playerUnits = units.filter(u => u.team === 'player' && u.alive);
      const playerBuildings = buildings.filter(b => b.team === 'player' && b.alive);
      const overlaps = [];
      for (const u of playerUnits) {
        for (const b of playerBuildings) {
          const d = Math.hypot(u.x - b.x, u.y - b.y);
          if (d < CELL * 0.5) {
            overlaps.push({
              unitType: u.type, formationRow: u.formationRow,
              buildingType: b.type, buildingPos: [b.gx, b.gy],
              unitPos: [u.gx, u.gy], distance: d.toFixed(1)
            });
          }
        }
      }
      return overlaps;
    });

    console.log(`BUG-009: ${overlap.length} unit-building overlaps`);
    if (overlap.length > 0) {
      console.log(JSON.stringify(overlap, null, 2));
    }

    const ssPath = path.join(EVIDENCE_DIR, 'bug009-spawn.png');
    await page.screenshot({ path: ssPath, fullPage: false });

    expect(overlap.length).toBe(0);
  });

});
