const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=1280,900']
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Expose game state by injecting into page context
  page.on('console', msg => {
    if (msg.type() === 'log') console.log('Browser:', msg.text());
  });
  
  try {
    // Step 1: Open game
    await page.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/01-deploy-screen.png', fullPage: true });
    console.log('Step 1: Deploy screen opened');

    // Step 2: Select 8 units by clicking the + buttons
    // Click infantry + twice
    const infantryPlus = await page.$('.btn-plus[data-unit="infantry"]');
    await infantryPlus.click();
    await infantryPlus.click();
    
    // Click archer + three times  
    const archerPlus = await page.$('.btn-plus[data-unit="archer"]');
    await archerPlus.click();
    await archerPlus.click();
    await archerPlus.click();
    
    // Click cavalry + three times
    const cavalryPlus = await page.$('.btn-plus[data-unit="cavalry"]');
    await cavalryPlus.click();
    await cavalryPlus.click();
    await cavalryPlus.click();
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/02-units-selected.png', fullPage: true });
    console.log('Step 2: Selected 8 units (2 infantry, 3 archer, 3 cavalry)');

    // Step 3: Click "部署阵型"
    await page.click('#btn-start');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/03-formation-screen.png', fullPage: true });
    console.log('Step 3: Formation screen opened');

    // Step 4: Confirm formation
    await page.click('#btn-confirm-formation');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/04-combat-start.png', fullPage: true });
    console.log('Step 4: Combat started');

    // Step 5: Check unit-building overlap by evaluating in page context
    const overlapInfo = await page.evaluate(() => {
      const results = [];
      for (const u of units) {
        if (!u.alive || u.team !== 'player') continue;
        for (const b of buildings) {
          if (!b.alive || b.team !== 'player') continue;
          const dist = Math.hypot(u.x - b.x, u.y - b.y);
          if (dist < 35) {
            results.push({
              unitType: u.type,
              unitPos: { x: Math.round(u.x), y: Math.round(u.y) },
              buildingType: b.type,
              buildingPos: { gx: b.gx, gy: b.gy, x: b.x, y: b.y },
              distance: Math.round(dist)
            });
          }
        }
      }
      return results;
    });
    
    console.log(`Step 5: Found ${overlapInfo.length} unit-building overlaps`);
    if (overlapInfo.length > 0) {
      overlapInfo.forEach(o => {
        console.log(`  - ${o.unitType} at (${o.unitPos.x},${o.unitPos.y}) overlaps with ${o.buildingType} at (${o.buildingPos.gx},${o.buildingPos.gy}), dist=${o.distance}`);
      });
    }
    
    await page.screenshot({ path: '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/05-unit-positions.png', fullPage: true });

    // Step 6: Box select units
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    console.log(`Canvas bounding box: ${JSON.stringify(box)}`);
    
    // Drag from top-left area to center-right to box select
    await page.mouse.move(box.x + 80, box.y + 100);
    await page.waitForTimeout(100);
    await page.mouse.down({ button: 'left' });
    await page.waitForTimeout(200);
    await page.mouse.move(box.x + 350, box.y + 500, { steps: 10 });
    await page.waitForTimeout(200);
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/06-box-select.png', fullPage: true });
    console.log('Step 6: Box select performed');

    // Step 7: Check selected units count
    const selectedCount = await page.evaluate(() => selectedUnits.length);
    console.log(`Step 7: ${selectedCount} units selected out of ${await page.evaluate(() => units.filter(u => u.alive && u.team === 'player').length)} player units`);

    // Step 8: Right-click on empty ground (far from any unit/building) to issue move command
    // Click in the middle-right area of canvas (should be empty space)
    await page.mouse.click(box.x + 450, box.y + 300, { button: 'right' });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/07-right-click-move.png', fullPage: true });
    console.log('Step 8: Right-click move command issued at (450, 300)');

    // Step 9: Check if units received move command
    const unitStatus = await page.evaluate(() => {
      return selectedUnits.filter(u => u.alive).map(u => ({
        type: u.type,
        pos: { x: Math.round(u.x), y: Math.round(u.y) },
        command: u.command ? `${u.command.type}(${u.command.x ? Math.round(u.command.x) : 'N/A'},${u.command.y ? Math.round(u.command.y) : 'N/A'})` : 'none',
        idle: u.idle,
        retreating: u.retreating
      }));
    });
    
    console.log('Step 9: Unit status after right-click:');
    unitStatus.forEach(u => console.log(`  ${u.type}: pos=(${u.pos.x},${u.pos.y}) cmd=${u.command} idle=${u.idle}`));

    // Step 10: Wait 3 seconds and check if units moved
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/08-units-after-3s.png', fullPage: true });
    
    const unitPositionsAfter = await page.evaluate(() => {
      return selectedUnits.filter(u => u.alive).map(u => ({
        type: u.type,
        pos: { x: Math.round(u.x), y: Math.round(u.y) },
        command: u.command ? `${u.command.type}` : 'none',
        idle: u.idle
      }));
    });
    
    console.log('Step 10: Unit positions after 3 seconds:');
    unitPositionsAfter.forEach(u => console.log(`  ${u.type}: pos=(${u.pos.x},${u.pos.y}) cmd=${u.command} idle=${u.idle}`));

    // Determine if units moved
    const moved = unitPositionsAfter.some((u, i) => {
      const before = unitStatus[i];
      return before && (u.pos.x !== before.pos.x || u.pos.y !== before.pos.y);
    });
    
    console.log(`\n=== VERDICT ===`);
    console.log(`BUG-009 (Unit-Building Overlap): ${overlapInfo.length > 0 ? 'CONFIRMED' : 'NOT REPRODUCED'} - ${overlapInfo.length} overlaps found`);
    console.log(`BUG-010 (Units Not Moving): ${!moved && selectedCount > 0 ? 'CONFIRMED' : 'NOT REPRODUCED'} - ${selectedCount} units selected, moved=${moved}`);
    
    if (!moved && selectedCount > 0) {
      console.log('\n  Possible causes:');
      const allIdle = unitPositionsAfter.every(u => u.idle);
      const allHaveCommand = unitPositionsAfter.every(u => u.command === 'move');
      console.log(`  - All units idle: ${allIdle}`);
      console.log(`  - All units have move command: ${allHaveCommand}`);
      if (allHaveCommand) {
        console.log('  -> Units have move command but are not moving - possible obstacle blocking path');
      }
      if (allIdle) {
        console.log('  -> Units are idle - right-click did not issue command (possible left-click instead of right-click)');
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    await browser.close();
  }
})();
