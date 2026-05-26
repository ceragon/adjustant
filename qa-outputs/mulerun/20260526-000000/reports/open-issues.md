# MuleRun 原型遗留问题验收文档

> **项目**: AI 副官：智战 (MuleRun index.html Canvas 2D 单文件原型)
> **生成日期**: 2026-05-26
> **目的**: 汇总当前版本中**待修复**的遗留缺陷，供开发团队逐一验收修复

---

## 待修复问题清单

### BUG-001 [Critical] 撤退单位无法归队 — 无 HP 恢复机制

- **需求**: 撤退单位回满血后自动重新加入战斗队列
- **代码位置**: `code/index.html:774-778`
- **修复建议**: 在撤退逻辑中添加被动回血：`u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.15 * dt)`

---

### BUG-002 [Critical] 集火指令不优先于撤退指令

- **需求**: 集火指令优先于撤退指令（残血单位也应响应集火冲锋）
- **代码位置**: `code/index.html:774-778` vs `801-814`
- **修复建议**: 在下达集火指令时清除 `retreating` 状态，或在撤退检查之前优先处理 focus command

---

### BUG-003 [Major] 开局视野未覆盖整个己方半场

- **需求**: 己方半场 + 己方建筑初始可见，以地图中线为分界
- **代码位置**: `code/index.html:669-678`
- **修复建议**: 在 `initFog` 中添加半场直接标记逻辑，遍历己方半侧所有格子设为 `FOG_VISIBLE`

---

### BUG-004 [Major] 建筑初始视野范围与 Tick 更新不一致

- **需求**: 视野更新平滑，无闪烁
- **代码位置**: `code/index.html:676` vs `692`
- **修复建议**: 移除 `initFog` line 676 的 `+2`，使初始和 Tick 使用相同范围 `BUILDING_VISION_RANGE`

---

### BUG-005 [Major] 视野丢失后单位自动切换新目标

- **需求**: 目标离开视野后不会自动切换攻击视野内的其他敌方单位
- **代码位置**: `code/index.html:829-830`
- **修复建议**: 目标丢失时设置 `u.idle=true; u.target=null`，不调用 `findPriorityTarget`

---

### BUG-006 [Major] 点击空地不是"全军推进"

- **需求**: 点击空地时，确保场上所有非撤退状态的单位都能响应移动指令
- **代码位置**: `code/index.html:1292, 1312-1316`
- **修复建议**: 当 `selectedUnits.length===0` 时，改为对所有非撤退单位下达移动指令

---

### BUG-007 [Minor] 防御塔间距与需求不符

- **需求**: 防御塔永远在 HQ 的上下两侧（Y-1 和 Y+1），形成"口袋阵"
- **代码位置**: `code/index.html:217-228`
- **修复建议**: 修改 `SPAWN_CONFIGS` 中的塔坐标，将 Y 偏移从 ±3 改为 ±1

---

### BUG-008 [Minor] 移动光标消失时机与需求不符

- **需求**: 当单位开始向该目标移动时，小手图标自动消失
- **代码位置**: `code/index.html:789, 965, 1315`
- **修复建议**: 在下达移动指令后立即清除 `moveCursor`，或设置较短超时（如 0.5s）

---

### BUG-009 [Major] 中排单位与防御塔/HQ 位置重合

- **需求**: 开局时所有单位在 HQ 附近按"前中后"阵型展开，不应与建筑重叠
- **代码位置**: `code/index.html:614 (rowOffsets.mid=0)`, `217-228 (塔坐标 Y±1)`
- **修复建议**: 调整 `rowOffsets.mid` 从 0 改为 1.5，或在 `computeFormationPositions` 中增加建筑位置避让逻辑

---

### BUG-011 [Critical] 右键菜单阻止范围不足导致单位无法移动

- **需求**: 游戏区域内右键不弹出浏览器菜单
- **代码位置**: `code/index.html:1249`
- **修复建议**: 将 `contextmenu` 阻止绑定到整个 combat-screen 或 document：
  ```js
  document.addEventListener('contextmenu', e => {
    if (phase === 'combat') e.preventDefault();
  });
  ```

---

### REG-003 [Major] 开局己方半场可见率仅 45.0%

- **需求**: 己方半场应 100% 初始可见（Phase 4 FOW-01）
- **复现步骤**:
  1. 开始游戏，进入战斗
  2. 检查己方半场所有格子的 fog 状态
  3. 统计 `FOG_VISIBLE` 或 `FOG_EXPLORED` 的格子比例
  4. 结果：仅约 45% 的格子可见，远低于预期的 100%
- **代码位置**: `code/index.html:669-678` (`initFog`)
- **修复建议**: 在 `initFog` 中直接遍历己方半侧所有格子标记为 `FOG_VISIBLE`，而不是仅从建筑/单位位置标记菱形视野

---

### DEEP-005 [Critical] 障碍物与出生点重合导致单位卡住

- **需求**: 单位出生后应能自由移动，不被出生点障碍物阻挡
- **复现步骤**:
  1. 开始游戏，进入战斗
  2. 观察出生点位置 `[3,10]`（左中）或 `[17,10]`（右中）
  3. 结果：障碍物正好生成在 HQ 位置，单位被障碍物卡住无法移动
- **代码位置**: `code/index.html:217-228` (`SPAWN_CONFIGS`), `initObstacles()`
- **修复建议**: 在 `initObstacles` 中排除所有 `SPAWN_CONFIGS` 中定义的 HQ/塔位置，确保出生点无障碍物

---

## 已排除问题

| 编号 | 说明 | 状态 |
|------|------|------|
| BUG-010 | 框选后单位移动功能 | **未复现**，E2E 验证正常 |

---

## 问题统计

| 严重等级 | 数量 | 编号 |
|----------|------|------|
| Critical | 4 | BUG-001, BUG-002, BUG-011, DEEP-005 |
| Major | 6 | BUG-003, BUG-004, BUG-005, BUG-006, BUG-009, REG-003 |
| Minor | 2 | BUG-007, BUG-008 |
| **总计** | **12** | |

---

## 回归说明

> **2026-05-26 第二轮回归测试结果** (Playwright 自动化 E2E):
>
> ### DEEP-005 障碍物与出生点重合 — ✅ 已修复
> - 连续 6 局开局，所有出生点（HQ + 防御塔）均无障碍物冲突
> - 单位出生后可正常响应移动指令（5/8 单位在 2 秒内移动）
> - 代码已增加 `spawnCells` Set 排除所有出生点位置（`initObstacles` line 513-520）
>
> ### REG-003 己方半场可见率 — ✅ 已修复
> - 开局 2s/5s/10s 三个时间点检查，己方半场均保持 **100.0%** 可见（231/231 格）
> - 敌方半场仅 1.4% 可见（207 格未探索），迷雾覆盖正确
> - 代码已增加 `initFog` 半场直接标记（line 686-692）+ `updateVision` Tick 持续保持可见（line 711-719）
>
> ### 历史 BUG 回归验证 — 全部通过
> | BUG | 测试项 | 结果 |
> |-----|--------|------|
> | BUG-001 | 撤退单位回血归队 | ✅ 通过（代码 line 808-811 已加被动回血） |
> | BUG-002 | 集火指令优先于撤退 | ✅ 通过（代码 line 802-804 已加 focus 覆盖） |
> | BUG-006 | 未选中时右键空地 = 全军推进 | ✅ 通过（8/8 单位响应移动指令） |
> | BUG-009 | 中排单位不与建筑重叠 | ✅ 通过（0 处重叠，`rowOffsets.mid=1.5` 生效） |
>
> - 回归测试脚本：`/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/regression-deep-reg.spec.js`
> - 截图证据：`/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/evidence/deep005-spawn-*.png`、`reg003-fog-*.png`

---

## 完整测试报告

完整测试报告（含通过项、需求实现状态汇总、残余风险）：
- 路径: `/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/reports/test-report.md`
- 测试用例: `/Users/happyelements/IdeaProjects/github/adjustant/qa-outputs/mulerun/20260526-000000/cases/test-cases.md`
