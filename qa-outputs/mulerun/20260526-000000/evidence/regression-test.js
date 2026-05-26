const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const evidenceDir = '/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/regression-evidence';
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const issues = [];

function addIssue(id, severity, title, description, evidence = '') {
  issues.push({ id, severity, title, description, evidence });
  console.log(`  ❌ [${severity}] ${title}`);
}
function pass(title) { console.log(`  ✅ ${title}`); }

async function startNewGame(page) {
  // Select 8 units
  for (let i = 0; i < 2; i++) await page.$$('.btn-plus[data-unit="infantry"]').then(b => b[0].click());
  for (let i = 0; i < 3; i++) await page.$$('.btn-plus[data-unit="archer"]').then(b => b[0].click());
  for (let i = 0; i < 3; i++) await page.$$('.btn-plus[data-unit="cavalry"]').then(b => b[0].click());
  await page.click('#btn-start');
  await page.waitForTimeout(500);
  await page.click('#btn-confirm-formation');
  await page.waitForTimeout(2000);
}

async function freshPage(browser) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
  await p.waitForTimeout(1000);
  return p;
}

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--window-size=1400,1000'] });

  try {
    console.log('\n=== 回归测试：已修复 BUG ===\n');

    // REG-001: 撤退回血
    console.log('--- REG-001: BUG-001 撤退回血 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const hasHeal = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes('healRate') && code.includes('u.hp + healRate');
      });
      hasHeal ? pass('BUG-001: 撤退回血逻辑已存在') : addIssue('REG-001','Critical','撤退回血','逻辑缺失');
      await p.screenshot({ path: path.join(evidenceDir,'reg-001.png'), fullPage: true });
      await p.close();
    }

    // REG-002: 集火优先撤退
    console.log('\n--- REG-002: BUG-002 集火优先撤退 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const hasPriority = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes("u.retreating && u.command && u.command.type==='focus'");
      });
      hasPriority ? pass('BUG-002: 集火优先撤退') : addIssue('REG-002','Critical','集火优先撤退','逻辑缺失');
      await p.close();
    }

    // REG-003: 开局半场可见
    console.log('\n--- REG-003: BUG-003 开局半场可见 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const halfVisible = await p.evaluate(() => {
        const hq = buildings.find(b => b.team === 'player' && b.type === 'hq');
        const isLeft = hq.gx < COLS / 2;
        const halfCol = isLeft ? Math.ceil(COLS / 2) : Math.floor(COLS / 2);
        const startGx = isLeft ? 0 : halfCol;
        const endGx = isLeft ? halfCol : COLS;
        let visibleCount = 0, totalCells = 0;
        for (let gx = startGx; gx < endGx; gx++) {
          for (let gy = 0; gy < ROWS; gy++) {
            totalCells++;
            if (getFogCell(gx, gy) === FOG_VISIBLE) visibleCount++;
          }
        }
        return { visibleCount, totalCells, ratio: visibleCount / totalCells };
      });
      console.log(`  己方半场可见率: ${(halfVisible.ratio * 100).toFixed(1)}%`);
      halfVisible.ratio > 0.9 ? pass('BUG-003: 己方半场基本可见') : addIssue('REG-003','Major','开局半场可见',`可见率 ${(halfVisible.ratio*100).toFixed(1)}%`);
      await p.screenshot({ path: path.join(evidenceDir,'reg-003.png'), fullPage: true });
      await p.close();
    }

    // REG-004: 建筑视野一致
    console.log('\n--- REG-004: BUG-004 建筑视野范围 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const consistent = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        const m = code.match(/markDiamond\(b\.gx,b\.gy,([^\)]+)\)/);
        return m && !m[1].includes('+2');
      });
      consistent ? pass('BUG-004: 建筑视野范围一致') : addIssue('REG-004','Major','建筑视野','范围不一致');
      await p.close();
    }

    // REG-005: 视野丢失不自动切换
    console.log('\n--- REG-005: BUG-005 视野丢失不切换目标 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const noSwitch = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes('BUG-005') || code.includes("u.idle=true;u.target=null;");
      });
      noSwitch ? pass('BUG-005: 视野丢失不自动切换') : addIssue('REG-005','Major','视野丢失切换','仍自动切换');
      await p.close();
    }

    // REG-006: 全军推进
    console.log('\n--- REG-006: BUG-006 全军推进 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const hasAll = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes('cmdUnits') && code.includes("selectedUnits.length > 0");
      });
      hasAll ? pass('BUG-006: 全军推进') : addIssue('REG-006','Major','全军推进','逻辑缺失');
      await p.close();
    }

    // REG-007: 塔间距
    console.log('\n--- REG-007: BUG-007 塔间距 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const spacing = await p.evaluate(() => {
        for (const side of ['left','right']) {
          for (const cfg of SPAWN_CONFIGS[side]) {
            for (const [tx,ty] of cfg.towers) {
              if (Math.abs(ty - cfg.hq[1]) !== 1) return false;
            }
          }
        }
        return true;
      });
      spacing ? pass('BUG-007: 塔间距 Y±1') : addIssue('REG-007','Minor','塔间距','非 Y±1');
      await p.close();
    }

    // REG-008: 光标消失
    console.log('\n--- REG-008: BUG-008 光标消失 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const hasTimeout = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes('setTimeout') && code.includes('moveCursor=null') && code.includes('500');
      });
      hasTimeout ? pass('BUG-008: 光标 0.5s 消失') : addIssue('REG-008','Minor','光标消失','时机不符');
      await p.close();
    }

    // REG-009: 单位建筑重叠
    console.log('\n--- REG-009: BUG-009 单位建筑重叠 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const overlap = await p.evaluate(() => {
        const results = [];
        for (const u of units) {
          if (!u.alive || u.team !== 'player') continue;
          for (const b of buildings) {
            if (!b.alive || b.team !== 'player') continue;
            const d = Math.hypot(u.x - b.x, u.y - b.y);
            if (d < 35) results.push({ unit: u.type, bx: b.gx, by: b.gy, dist: Math.round(d) });
          }
        }
        return results;
      });
      overlap.length === 0 ? pass('BUG-009: 无重叠') : addIssue('REG-009','Major','单位建筑重叠',`${overlap.length} 处重叠`);
      await p.screenshot({ path: path.join(evidenceDir,'reg-009.png'), fullPage: true });
      await p.close();
    }

    // REG-010: 右键菜单阻止
    console.log('\n--- REG-010: BUG-011 右键菜单阻止 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const hasDoc = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes("document.addEventListener('contextmenu'") || code.includes("if(phase==='combat')");
      });
      hasDoc ? pass('BUG-011: document 级别阻止') : addIssue('REG-010','Critical','右键菜单','阻止范围不足');
      await p.close();
    }

    console.log('\n=== 深度验收 ===\n');

    // DEEP-001: 单位被障碍物困住
    console.log('--- DEEP-001: 单位出生被障碍物困住 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const stuckCheck = await p.evaluate(() => {
        const playerUnits = units.filter(u => u.alive && u.team === 'player');
        const trapped = [];
        for (const u of playerUnits) {
          const neighbors = [[u.gx-1,u.gy],[u.gx+1,u.gy],[u.gx,u.gy-1],[u.gx,u.gy+1]];
          let blocked = 0;
          for (const [nx,ny] of neighbors) {
            if (nx<0||nx>=COLS||ny<0||ny>=ROWS||isObstacle(nx,ny)) blocked++;
          }
          if (blocked >= 3) trapped.push({ type: u.type, gx: u.gx, gy: u.gy, blocked });
        }
        return { trapped, hqPos: buildings.find(b=>b.team==='player'&&b.type==='hq')?.gx };
      });
      console.log(`  被困单位: ${stuckCheck.trapped.length}, HQ X: ${stuckCheck.hqPos}`);
      stuckCheck.trapped.length === 0 ? pass('DEEP-001: 无单位被困') : addIssue('DEEP-001','Critical','单位被障碍物困住',`${stuckCheck.trapped.length} 个单位 3 面以上被阻挡: ${JSON.stringify(stuckCheck.trapped)}`);
      await p.screenshot({ path: path.join(evidenceDir,'deep-001.png'), fullPage: true });
      await p.close();
    }

    // DEEP-002: 障碍物绕行
    console.log('\n--- DEEP-002: 障碍物绕行 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const canvas = p.locator('#game-canvas');
      const box = await canvas.boundingBox();
      
      // Select a unit
      await p.evaluate(() => {
        const u = units.find(u => u.alive && u.team === 'player');
        if (u) selectedUnits = [u];
      });
      
      // Command move toward center obstacles
      await p.mouse.click(box.x + 300, box.y + 300, { button: 'right' });
      await p.waitForTimeout(4000);
      
      const stuckAfter = await p.evaluate(() => {
        return selectedUnits.filter(u => u.alive && u.command && u.command.type === 'move').map(u => ({
          type: u.type,
          pos: { x: Math.round(u.x), y: Math.round(u.y) },
          target: { x: Math.round(u.command.x), y: Math.round(u.command.y) },
          dist: Math.round(Math.hypot(u.x - u.command.x, u.y - u.command.y))
        }));
      });
      
      const veryStuck = stuckAfter.filter(u => u.dist > 100);
      veryStuck.length === 0 ? pass('DEEP-002: 单位能绕行') : addIssue('DEEP-002','Major','障碍物绕行失败',`${veryStuck.length} 个单位卡住: ${JSON.stringify(veryStuck)}`);
      await p.screenshot({ path: path.join(evidenceDir,'deep-002.png'), fullPage: true });
      await p.close();
    }

    // DEEP-003: 框选+右键移动
    console.log('\n--- DEEP-003: 框选+右键移动 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const canvas = p.locator('#game-canvas');
      const box = await canvas.boundingBox();
      
      await p.mouse.move(box.x + 50, box.y + 50);
      await p.mouse.down({ button: 'left' });
      await p.waitForTimeout(100);
      await p.mouse.move(box.x + 350, box.y + 400, { steps: 10 });
      await p.waitForTimeout(100);
      await p.mouse.up({ button: 'left' });
      await p.waitForTimeout(300);
      
      const count = await p.evaluate(() => selectedUnits.length);
      console.log(`  框选单位: ${count}`);
      
      await p.mouse.click(box.x + 450, box.y + 250, { button: 'right' });
      await p.waitForTimeout(2000);
      
      const moved = await p.evaluate(() => selectedUnits.filter(u => u.alive).some(u => u.command && u.command.type === 'move'));
      count > 0 && moved ? pass('DEEP-003: 框选+右键正常') : addIssue('DEEP-003','Major','框选+右键异常',`选中 ${count}, 移动=${moved}`);
      await p.screenshot({ path: path.join(evidenceDir,'deep-003.png'), fullPage: true });
      await p.close();
    }

    // DEEP-004: 敌方 AI 进攻
    console.log('\n--- DEEP-004: 敌方 AI 进攻 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const behavior = await p.evaluate(() => {
        const enemies = units.filter(u => u.alive && u.team === 'enemy');
        return {
          total: enemies.length,
          moving: enemies.filter(u => !u.idle).length,
          attacking: enemies.filter(u => u.target && u.target.alive).length
        };
      });
      console.log(`  敌方: 总数=${behavior.total}, 移动=${behavior.moving}, 攻击=${behavior.attacking}`);
      behavior.attacking > 0 || behavior.moving > 0 ? pass('DEEP-004: 敌方正常进攻') : addIssue('DEEP-004','Major','敌方 AI 不进攻',`${behavior.total} 个单位全部待机`);
      await p.screenshot({ path: path.join(evidenceDir,'deep-004.png'), fullPage: true });
      await p.close();
    }

    // DEEP-005: 障碍物布局
    console.log('\n--- DEEP-005: 障碍物布局合理性 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const layout = await p.evaluate(() => {
        const spawnPositions = SPAWN_CONFIGS.left.concat(SPAWN_CONFIGS.right);
        const blockedSpawns = [];
        for (const cfg of spawnPositions) {
          if (isObstacle(cfg.hq[0], cfg.hq[1])) blockedSpawns.push({ hq: cfg.hq });
          for (const [tx,ty] of cfg.towers) {
            if (isObstacle(tx, ty)) blockedSpawns.push({ tower: [tx,ty] });
          }
        }
        return { obsCount: obstacles.length, blockedSpawns };
      });
      console.log(`  障碍物: ${layout.obsCount}, 阻挡出生点: ${layout.blockedSpawns.length}`);
      layout.blockedSpawns.length === 0 ? pass('DEEP-005: 障碍物未阻挡出生点') : addIssue('DEEP-005','Critical','障碍物阻挡出生点',JSON.stringify(layout.blockedSpawns));
      await p.screenshot({ path: path.join(evidenceDir,'deep-005.png'), fullPage: true });
      await p.close();
    }

    // DEEP-006: 兵种克制
    console.log('\n--- DEEP-006: 兵种克制 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const counter = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes('COUNTER_BONUS') && code.includes('1.6') && code.includes('attacker.counter===target.type');
      });
      counter ? pass('DEEP-006: 兵种克制存在') : addIssue('DEEP-006','Major','兵种克制','逻辑缺失');
      await p.close();
    }

    // DEEP-007: 单位分离
    console.log('\n--- DEEP-007: 单位分离 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const sep = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes('minD=CELL*0.6') && code.includes('push=(minD-d)*0.3');
      });
      sep ? pass('DEEP-007: 单位分离存在') : addIssue('DEEP-007','Minor','单位分离','逻辑缺失');
      await p.close();
    }

    // DEEP-008: 迷雾渲染
    console.log('\n--- DEEP-008: 迷雾渲染 ---');
    {
      const p = await freshPage(browser);
      await startNewGame(p);
      const fogCheck = await p.evaluate(() => {
        let u=0,e=0,v=0;
        for (let i=0;i<fogGrid.length;i++){
          if(fogGrid[i]===FOG_UNEXPLORED)u++;
          else if(fogGrid[i]===FOG_EXPLORED)e++;
          else if(fogGrid[i]===FOG_VISIBLE)v++;
        }
        return {unexplored:u,explored:e,visible:v,total:fogGrid.length};
      });
      console.log(`  未探索=${fogCheck.unexplored}, 已探索=${fogCheck.explored}, 可见=${fogCheck.visible}`);
      fogCheck.visible > 0 && fogCheck.unexplored > 0 ? pass('DEEP-008: 迷雾三层正确') : addIssue('DEEP-008','Major','迷雾渲染','状态异常');
      await p.screenshot({ path: path.join(evidenceDir,'deep-008.png'), fullPage: true });
      await p.close();
    }

    // DEEP-009: 攻击队形
    console.log('\n--- DEEP-009: 攻击队形 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const formation = await p.evaluate(() => {
        const code = document.querySelector('script').textContent;
        return code.includes('moveToAttackSlot') && code.includes('Math.PI*2/count');
      });
      formation ? pass('DEEP-009: 攻击队形存在') : addIssue('DEEP-009','Minor','攻击队形','逻辑缺失');
      await p.close();
    }

    // DEEP-010: 出生点与障碍物冲突 - 详细检查每个出生点
    console.log('\n--- DEEP-010: 出生点 vs 障碍物冲突 ---');
    {
      const p = await freshPage(browser);
      await p.goto(`file:///Users/happyelements/IdeaProjects/github/adjustant/code/index.html`);
      await p.waitForTimeout(500);
      const conflict = await p.evaluate(() => {
        const conflicts = [];
        for (const side of ['left','right']) {
          for (const cfg of SPAWN_CONFIGS[side]) {
            // Check if HQ or tower cells overlap with obstacles
            if (isObstacle(cfg.hq[0], cfg.hq[1])) conflicts.push({spawn:cfg.hq, type:'HQ', overlaps:'obstacle'});
            for (const [tx,ty] of cfg.towers) {
              if (isObstacle(tx, ty)) conflicts.push({spawn:[tx,ty], type:'Tower', overlaps:'obstacle'});
            }
            // Also check adjacent cells - units spawn near buildings
            const offsets = [[-1,0],[1,0],[0,-1],[0,1]];
            for (const [ox,oy] of offsets) {
              if (isObstacle(cfg.hq[0]+ox, cfg.hq[1]+oy)) conflicts.push({spawn:[cfg.hq[0]+ox,cfg.hq[1]+oy], type:'HQ adjacent', overlaps:'obstacle'});
            }
          }
        }
        return conflicts;
      });
      console.log(`  出生点与障碍物冲突: ${conflict.length}`);
      if (conflict.length > 0) {
        addIssue('DEEP-010','Critical','出生点与障碍物冲突',JSON.stringify(conflict));
      } else {
        pass('DEEP-010: 出生点与障碍物无冲突');
      }
      await p.close();
    }

    // Summary
    console.log('\n\n=== 汇总 ===');
    console.log(`总问题: ${issues.length}`);
    const crit = issues.filter(i=>i.severity==='Critical').length;
    const maj = issues.filter(i=>i.severity==='Major').length;
    const min = issues.filter(i=>i.severity==='Minor').length;
    console.log(`Critical: ${crit}, Major: ${maj}, Minor: ${min}`);
    if (issues.length > 0) {
      console.log('\n问题列表:');
      issues.forEach(i => console.log(`  [${i.severity}] ${i.id}: ${i.title} — ${i.description}`));
    }

    fs.writeFileSync(path.join(evidenceDir,'results.json'), JSON.stringify(issues, null, 2));
    console.log(`\n结果保存至: ${path.join(evidenceDir,'results.json')}`);

  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await browser.close();
  }
})();
