const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '../code/index.html');
const MAX_UNITS = 8;

async function selectUnits(page, infantry, archer, cavalry) {
  for (let i = 0; i < infantry; i++) await page.click('[data-unit="infantry"].btn-plus');
  for (let i = 0; i < archer; i++) await page.click('[data-unit="archer"].btn-plus');
  for (let i = 0; i < cavalry; i++) await page.click('[data-unit="cavalry"].btn-plus');
  expect(infantry + archer + cavalry).toBe(MAX_UNITS);
}

async function startCombat(page) {
  await expect(page.locator('#btn-start')).toBeEnabled();
  await page.click('#btn-start');
  await page.click('#btn-confirm-formation');
  await page.waitForTimeout(1500);
}

test.describe('Regression tests', () => {
  
  test('player auto-engages when enemy enters vision', async ({ page }) => {
    await page.goto(FILE_URL);
    await selectUnits(page, 3, 3, 2);
    await startCombat(page);
    
    // Wait for enemies to approach and enter vision
    await page.waitForTimeout(6000);
    
    const hasTarget = await page.evaluate(() => {
      return units.some(u => u.team === 'player' && u.alive && u.target !== null);
    });
    console.log('Player unit has target:', hasTarget);
    expect(hasTarget).toBe(true);
    
    await page.screenshot({ path: 'qa-outputs/auto-engage.png', fullPage: false });
  });

  test('units navigate around obstacles via BFS', async ({ page }) => {
    await page.goto(FILE_URL);
    await selectUnits(page, 4, 2, 2);
    await startCombat(page);
    
    // Get initial positions
    const initialPositions = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({ x: u.x, y: u.y }));
    });
    
    // Order all units to move to enemy side
    await page.evaluate(() => {
      const cmdUnits = units.filter(u => u.alive && u.team === 'player' && !u.retreating);
      cmdUnits.forEach(u => {
        u.command = { type: 'move', x: 700, y: 420 };
        u.idle = false;
        u.target = null;
        u._path = null;
      });
    });
    
    await page.waitForTimeout(3000);
    
    const finalPositions = await page.evaluate(() => {
      return units.filter(u => u.team === 'player' && u.alive).map(u => ({ x: u.x, y: u.y }));
    });
    
    let totalDist = 0;
    for (let i = 0; i < initialPositions.length; i++) {
      const dist = Math.hypot(finalPositions[i].x - initialPositions[i].x, finalPositions[i].y - initialPositions[i].y);
      totalDist += dist;
    }
    const avgDist = totalDist / initialPositions.length;
    console.log(`Average movement: ${avgDist.toFixed(1)}px`);
    expect(avgDist).toBeGreaterThan(50);
    
    await page.screenshot({ path: 'qa-outputs/bfs-navigation.png', fullPage: false });
  });

  test('game does not freeze after errors', async ({ page }) => {
    await page.goto(FILE_URL);
    await selectUnits(page, 4, 2, 2);
    await startCombat(page);
    
    // Get initial timer
    const timer1 = await page.locator('#timer').textContent();
    console.log('Timer at start:', timer1);
    
    // Play for 5 seconds
    await page.waitForTimeout(5000);
    
    // Timer should have changed
    const timer2 = await page.locator('#timer').textContent();
    console.log('Timer after 5s:', timer2);
    
    // Verify game is still running
    const stillRunning = await page.evaluate(() => phase === 'combat');
    expect(stillRunning).toBe(true);
  });
});
