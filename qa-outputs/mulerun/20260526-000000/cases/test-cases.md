# MuleRun 原型验收测试用例

> **项目**: AI 副官：智战 (MuleRun index.html Canvas 2D 单文件原型)
> **需求来源**: doc/20260525-mulerun-prototype-iteration.md (Phase 1-3)、doc/20260526-mulerun-fog-of-war.md (Phase 4)、doc/20260526-mulerun-deployment-enhancement.md (Phase 5)
> **测试日期**: 2026-05-26
> **测试环境**: 浏览器 (Chrome/Edge/Safari)，本地文件 index.html

---

## Phase 1-3: 核心交互优化

### TC-001 伤害数字从头顶飘出
- **Source**: 20260525-mulerun-prototype-iteration.md 任务1
- **Requirement**: 伤害数字应从单位正上方浮现并向上飘散，不遮挡单位主体
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**:
  - 完成部署并进入战斗阶段
  - 选中我方单位并右键攻击敌方单位
- **Test Steps**:
  1. 开始一局游戏，选择兵种组合并进入战斗
  2. 选中我方单位，右键点击敌方单位发起攻击
  3. 观察伤害数字出现的位置和动画效果
- **Expected Result**:
  - 伤害数字出现在受击单位正上方（非中心位置）
  - 数字有向上飘升动画（transform: translateY 向上移动）
  - 飘升过程中不遮挡单位主体 emoji
- **Evidence to Capture**: 截图/录屏伤害数字出现位置
- **Pass/Fail Criteria**:
  - Pass: 数字从单位上方出现并上飘
  - Fail: 数字出现在单位中心或遮挡主体
- **Residual Risk / Notes**: 代码中 `applyDamage` 使用 `oy = -CELL*0.7` 偏移，已实现

### TC-002 选中光晕颜色区分敌我
- **Source**: 20260525-mulerun-prototype-iteration.md 任务2
- **Requirement**: 己方单位黄色光晕，敌方单位红色光晕，敌方塔橙色光晕，敌方 HQ 红色加粗光晕
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 左键点击选中我方单位，观察光晕颜色
  2. 左键点击选中敌方单位（可见时），观察光晕颜色
  3. 左键点击选中敌方塔（可见时），观察光晕颜色
  4. 左键点击选中敌方 HQ（可见时），观察光晕颜色
- **Expected Result**:
  - 己方单位：黄色 (#fbbf24) 光圈
  - 敌方单位：红色 (#ef4444) 光圈
  - 敌方塔：橙色 (#f97316) 光圈
  - 敌方 HQ：红色加粗光圈 (lineWidth 4px)
- **Evidence to Capture**: 截图各种选中状态光晕
- **Pass/Fail Criteria**:
  - Pass: 所有类型光晕颜色正确且可区分
  - Fail: 颜色混淆或无光晕
- **Residual Risk / Notes**: 代码中 `drawSelectionGlow` 己方用黄色，`selectedTarget` 敌方单位红色、塔橙色、HQ 红色加粗

### TC-003 点击敌人全军集火
- **Source**: 20260525-mulerun-prototype-iteration.md 任务4
- **Requirement**: 右键点击敌方目标，所有被选中的单位自动攻击该目标
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，选中多个我方单位
- **Test Steps**:
  1. 框选或点击选中多个我方单位
  2. 右键点击敌方单位
  3. 观察被选中单位的行动
- **Expected Result**:
  - 所有被选中的单位转向目标并发起攻击
  - 点击反馈环显示红色 (attack class)
  - 目标显示红色光晕
- **Evidence to Capture**: 录屏单位集火行为
- **Pass/Fail Criteria**:
  - Pass: 所有选中单位集火同一目标
  - Fail: 部分单位无响应或攻击不同目标
- **Residual Risk / Notes**: 代码中 `mouseup` 右键逻辑遍历 selectedUnits 设置 focus command

### TC-004 攻击队形不重叠
- **Source**: 20260525-mulerun-prototype-iteration.md 任务4
- **Requirement**: 多个单位攻击同一目标时自动分散站位，呈包围/散开态势
- **Priority**: P1
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，选中多个近战单位
- **Test Steps**:
  1. 选中多个近战单位（步兵/骑兵）
  2. 右键集火同一敌方目标
  3. 观察攻击时单位站位
- **Expected Result**:
  - 单位围绕目标呈不同角度分布（`moveToAttackSlot` 计算圆周角度）
  - 不重叠在同一像素点
- **Evidence to Capture**: 截图攻击站位
- **Pass/Fail Criteria**:
  - Pass: 单位分散站位
  - Fail: 单位重叠在一起
- **Residual Risk / Notes**: `moveToAttackSlot` 按 `attackers.indexOf(u)` 分配角度

### TC-005 点击空地全军推进
- **Source**: 20260525-mulerun-prototype-iteration.md 任务3
- **Requirement**: 点击空地，所有选中的非撤退单位向目标点移动
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，选中多个单位
- **Test Steps**:
  1. 框选多个我方单位
  2. 右键点击空地区域
  3. 观察单位移动行为
- **Expected Result**:
  - 所有被选中单位向目标点移动
  - 目标点显示小手图标（moveCursor）
  - 小手图标在单位开始移动后消失
- **Evidence to Capture**: 录屏移动行为和小手光标
- **Pass/Fail Criteria**:
  - Pass: 所有选中单位响应移动指令
  - Fail: 部分单位无响应
- **Residual Risk / Notes**: 代码中右键空地遍历 selectedUnits 设置 move command

### TC-006 点击友军单兵撤退
- **Source**: 20260525-mulerun-prototype-iteration.md 任务3
- **Requirement**: 右键点击己方单位，仅该单位执行撤退
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，已选中部分单位
- **Test Steps**:
  1. 选中多个我方单位
  2. 右键点击一个未被选中的己方单位
  3. 观察被点击单位的行动和其他选中单位的行动
- **Expected Result**:
  - 被右键点击的己方单位进入撤退状态（绿色虚线光圈）
  - 其他已选中的单位不受影响，保持原有行为
  - 点击反馈环显示绿色 (retreat class)
- **Evidence to Capture**: 录屏撤退行为
- **Pass/Fail Criteria**:
  - Pass: 仅被点击单位撤退
  - Fail: 所有单位撤退或无响应
- **Residual Risk / Notes**: 代码中右键检测 `clickedFriendly` 并设置 `retreating=true`

### TC-007 障碍物阻挡移动和视线
- **Source**: 20260525-mulerun-prototype-iteration.md 任务5
- **Requirement**: 障碍物阻挡单位移动，也阻挡防御塔攻击视线
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，地图上有障碍物
- **Test Steps**:
  1. 观察地图上障碍物分布（岩石图标）
  2. 命令单位向障碍物另一侧移动，观察路径
  3. 观察防御塔是否能攻击障碍物后方的敌方单位
- **Expected Result**:
  - 单位无法穿过障碍物（`isObstacleAt` 检测）
  - 防御塔无法攻击障碍物后方的目标（`hasLineOfSight` 检测）
- **Evidence to Capture**: 录屏绕行行为和塔攻击行为
- **Pass/Fail Criteria**:
  - Pass: 障碍物同时阻挡移动和视线
  - Fail: 单位穿过障碍或塔隔墙攻击
- **Residual Risk / Notes**: 代码中 `initObstacles` 定义了 16 个障碍块

### TC-008 撤退归队（满血自动归队）
- **Source**: 20260525-mulerun-prototype-iteration.md 交互逻辑
- **Requirement**: 撤退单位回满血后自动重新加入战斗
- **Priority**: P1
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，有单位受损
- **Test Steps**:
  1. 右键点击我方受损单位使其撤退
  2. 观察单位向 HQ 移动并回血
  3. 等待 HP 回满
- **Expected Result**:
  - 撤退单位移动到 HQ 附近
  - HP 回满后 `retreating` 自动设为 false
  - 单位重新参与战斗
- **Evidence to Capture**: 录屏撤退→回血→归队全过程
- **Pass/Fail Criteria**:
  - Pass: 满血后自动归队
  - Fail: 满血后仍停留在 HQ 不归队
- **Residual Risk / Notes**: 代码中 `updateUnits` 撤退逻辑检查 `hp >= maxHp` 时退出撤退

---

## Phase 4: 战争迷雾

### TC-009 开局视野（FOW-01）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-01
- **Requirement**: 开局只看到己方半场 + 己方建筑，敌方半场被云雾覆盖
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 开始一局游戏，进入战斗
  2. 观察地图左右两侧的可见性
  3. 观察己方建筑和敌方建筑的可见性
- **Expected Result**:
  - 己方半场清晰可见（地形、单位、建筑正常渲染）
  - 敌方半场被云雾覆盖（FOG_UNEXPLORED 状态）
  - 己方建筑始终可见
  - 敌方建筑不可见（除非在己方半场）
- **Evidence to Capture**: 开局截图
- **Pass/Fail Criteria**:
  - Pass: 己方半场可见，敌方半场有云雾
  - Fail: 全图可见或己方不可见
- **Residual Risk / Notes**: `initFog` 从己方建筑+单位标记初始可见区域

### TC-010 单位前出侦察（FOW-02）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-02
- **Requirement**: 敌方单位进入菱形视野范围时可见，离开后立即消失
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 选中我方单位，右键向敌方区域移动
  2. 观察单位前进过程中敌方单位的出现/消失
  3. 让单位后退远离敌方单位
- **Expected Result**:
  - 敌方单位进入菱形视野范围时突然可见
  - 敌方单位离开视野时立即消失（不保留最后已知位置）
  - 视野范围符合 `attackRange + 1` 菱形
- **Evidence to Capture**: 录屏侦察过程
- **Pass/Fail Criteria**:
  - Pass: 敌方单位随视野动态出现/消失
  - Fail: 敌方单位始终可见或永远不可见
- **Residual Risk / Notes**: `updateVision` 每 0.1s 更新，`markDiamond` 使用曼哈顿距离

### TC-011 建筑黑影轮廓（FOW-03）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-03
- **Requirement**: 敌方建筑首次暴露后，脱离视野仍保留去色剪影，血量不更新
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 指挥单位前出侦察到敌方建筑
  2. 观察建筑从"不可见"变为"可见"
  3. 让单位后退使建筑脱离视野
  4. 观察建筑黑影状态
- **Expected Result**:
  - 建筑首次被侦察到时正常渲染（带血条）
  - 脱离视野后在已探索阴影区保留灰色剪影（去色 + 40% 透明度）
  - 黑影不显示血条
  - 黑影状态不随实际血量变化
- **Evidence to Capture**: 截图建筑黑影
- **Pass/Fail Criteria**:
  - Pass: 建筑黑影正确渲染且不更新血量
  - Fail: 黑影不出现或血量实时更新
- **Residual Risk / Notes**: `exploredBuildings` Map 追踪已探索建筑，`drawBuildingShadows` 渲染

### TC-012 迷雾中单位不可交互（FOW-04）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-04
- **Requirement**: 无法点击/选中迷雾中的敌方单位
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，有敌方单位在迷雾中
- **Test Steps**:
  1. 确认有敌方单位在迷雾区域（通过后续侦察验证）
  2. 尝试左键点击迷雾区域（已知有敌方单位的位置）
  3. 尝试右键攻击迷雾区域
- **Expected Result**:
  - 左键点击迷雾区域不选中任何敌方单位
  - 无法对迷雾中的单位下达攻击指令
- **Evidence to Capture**: 录屏交互尝试
- **Pass/Fail Criteria**:
  - Pass: 迷雾中单位不可被选中/攻击
  - Fail: 迷雾中单位可被选中
- **Residual Risk / Notes**: `isEntityVisibleToPlayer` 检测控制可见性和交互

### TC-013 黑影建筑可交互（FOW-05）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-05
- **Requirement**: 可以点击/选中已探索阴影中的建筑黑影
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 已侦察过敌方建筑并使其脱离视野
- **Test Steps**:
  1. 确认敌方建筑在已探索阴影区（显示黑影）
  2. 左键点击建筑黑影
  3. 右键点击建筑黑影
- **Expected Result**:
  - 左键点击可选中建筑黑影（显示光晕）
  - 右键点击可命令选中单位攻击黑影建筑
- **Evidence to Capture**: 录屏交互
- **Pass/Fail Criteria**:
  - Pass: 黑影建筑可被选中和攻击
  - Fail: 黑影建筑无法交互
- **Residual Risk / Notes**: `isBuildingExplored` 检测 + `mouseup` 中 `clickedEBldg` 逻辑

### TC-014 视野丢失攻击中断（FOW-06）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-06
- **Requirement**: 目标离开视野后自动攻击停止，移动指令继续执行
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，单位正在攻击敌方目标
- **Test Steps**:
  1. 命令单位攻击敌方单位
  2. 让目标敌方单位离开视野范围
  3. 观察攻击行为
  4. 观察移动指令是否继续
- **Expected Result**:
  - 目标离开视野后，我方单位停止攻击
  - 移动指令（如果有）继续执行
  - 目标重新进入视野不会自动恢复攻击
- **Evidence to Capture**: 录屏攻击中断行为
- **Pass/Fail Criteria**:
  - Pass: 攻击停止，移动继续
  - Fail: 继续攻击不可见目标或移动也停止
- **Residual Risk / Notes**: `findNearestVisibleEnemy` 过滤不可见目标

### TC-015 未探索区域点击 = 移动（FOW-07）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-07
- **Requirement**: 点击云雾区域 = 移动指令，遭遇敌人不自动攻击
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，有未探索区域
- **Test Steps**:
  1. 选中单位
  2. 右键点击云雾覆盖的未探索区域
  3. 观察单位移动过程中经过敌方单位时的行为
- **Expected Result**:
  - 单位向云雾区域移动
  - 移动过程中即使经过敌方单位攻击范围也不自动攻击
  - 到达目的地后才自动索敌
- **Evidence to Capture**: 录屏移动过程
- **Pass/Fail Criteria**:
  - Pass: 移动优先，遭遇不攻击
  - Fail: 移动中自动攻击
- **Residual Risk / Notes**: 移动中只执行 `moveToward`，到达后才 `findNearestVisibleEnemy`

### TC-016 移动-攻击优先级（FOW-08）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-08
- **Requirement**: 单位优先到达目的地，到达后才自动索敌攻击
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 选中单位，右键命令移动到远处空地（途经敌方单位）
  2. 观察单位行为
  3. 等待单位到达目的地
  4. 观察到达后的行为
- **Expected Result**:
  - 移动过程中不停下来攻击
  - 到达目的地后自动搜索攻击范围内的敌方单位
  - 范围内无敌方单位则保持待机
- **Evidence to Capture**: 录屏移动→到达→索敌全过程
- **Pass/Fail Criteria**:
  - Pass: 移动优先，到达后索敌
  - Fail: 移动中自动停下攻击
- **Residual Risk / Notes**: 代码中 `updateUnits` move command 到达后才触发 auto-engage

### TC-017 云雾纹理（FOW-09）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-09
- **Requirement**: 未探索区域呈现自然云雾状，非均匀纯色
- **Priority**: P1
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 观察未探索区域的视觉表现
  2. 与已探索阴影区对比
- **Expected Result**:
  - 未探索区域有程序化云雾纹理（非纯色）
  - 已探索阴影区为半透明深蓝灰色覆盖
  - 两种状态视觉可区分
- **Evidence to Capture**: 截图云雾区域
- **Pass/Fail Criteria**:
  - Pass: 云雾有纹理变化
  - Fail: 均匀纯色填充
- **Residual Risk / Notes**: `generateCloudTexture` 使用双层 Value Noise 生成

### TC-018 建筑提供视野（FOW-10）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-10
- **Requirement**: 防御塔/HQ 也贡献视野
- **Priority**: P1
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 观察己方塔和 HQ 周围的可见区域
  2. 观察单位移动远离建筑后可见区域的变化
  3. （如可能）摧毁己方防御塔，观察视野变化
- **Expected Result**:
  - 建筑和单位共同提供视野
  - 摧毁建筑后可见区域减少
- **Evidence to Capture**: 截图建筑周边视野
- **Pass/Fail Criteria**:
  - Pass: 建筑贡献视野
  - Fail: 只有单位提供视野
- **Residual Risk / Notes**: `updateVision` 同时遍历单位和建筑标记视野

### TC-019 视野更新流畅（FOW-11）
- **Source**: 20260526-mulerun-fog-of-war.md FOW-11
- **Requirement**: 视野变化平滑，无闪烁，10Hz 更新流畅
- **Priority**: P1
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 指挥单位在战场移动
  2. 观察迷雾边界变化
  3. 持续观察 30 秒以上
- **Expected Result**:
  - 视野变化无明显闪烁
  - 迷雾状态切换流畅
  - 游戏帧率无明显下降
- **Evidence to Capture**: 录屏 30 秒 gameplay
- **Pass/Fail Criteria**:
  - Pass: 无明显闪烁，帧率稳定
  - Fail: 频繁闪烁或卡顿
- **Residual Risk / Notes**: `FOG_TICK_INTERVAL = 0.1` 对应 10Hz

---

## Phase 5: 战前部署与交互升级

### TC-020 出生点随机（DEP-01）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-01
- **Requirement**: 每局开局 HQ+塔+单位随机出现在 6 个点位之一
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 无
- **Test Steps**:
  1. 连续开始 5 局游戏
  2. 每局记录玩家 HQ 位置
  3. 验证玩家和敌方始终分处地图两侧
- **Expected Result**:
  - 多局游戏中玩家出生点有变化
  - 玩家在左侧时敌方在右侧，反之亦然
  - 6 个预设点位：左上/左中/左下/右上/右中/右下
- **Evidence to Capture**: 每局截图 HQ 位置
- **Pass/Fail Criteria**:
  - Pass: 出生点随机且敌我分侧
  - Fail: 固定出生点或敌我同侧
- **Residual Risk / Notes**: 代码中 `SPAWN_CONFIGS` 有 3 left + 3 right，`pickSpawnConfigs` 随机选取

### TC-021 地图尺寸 21x21（DEP-02）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-02
- **Requirement**: 21x21 网格，相机拉远后视觉单位缩小，视野内约 15x15 格
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 进入战斗，观察 Canvas 尺寸和网格数量
  2. 验证视口显示约 15x15 格子
  3. 验证世界尺寸为 840x840 (21*40)
- **Expected Result**:
  - 地图为 21x21 网格
  - 视口显示 15x15 格子（600x600 像素）
  - 单位尺寸相对网格适当缩小
- **Evidence to Capture**: 截图地图全貌
- **Pass/Fail Criteria**:
  - Pass: 21x21 网格，视口 15x15
  - Fail: 网格数量或视口不符
- **Residual Risk / Notes**: 代码中 `COLS=21, ROWS=21, VIEWPORT_CELLS=15`

### TC-022 框选操作（DEP-03）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-03
- **Requirement**: 左键拖拽画出选择框，框内己方单位被选中，显示黄色光晕
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 左键按住并拖拽画一个矩形框
  2. 释放鼠标
  3. 观察框内单位选中状态
- **Expected Result**:
  - 拖拽时显示半透明蓝色选择框
  - 释放后框内己方单位被选中
  - 选中单位显示黄色光晕
  - 敌方单位不被框选
- **Evidence to Capture**: 录屏框选过程
- **Pass/Fail Criteria**:
  - Pass: 框选功能正常，己方单位选中
  - Fail: 框选无效或选中敌方
- **Residual Risk / Notes**: `mouseup` 中 box select 逻辑过滤 `team==='player'`

### TC-023 右键指令（DEP-04）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-04
- **Requirement**: 右键点击空地/敌人，被选中的单位响应移动/攻击
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段，选中单位
- **Test Steps**:
  1. 选中单位
  2. 右键点击空地
  3. 右键点击敌方单位
  4. 右键点击敌方建筑
- **Expected Result**:
  - 右键空地：选中单位移动到目标
  - 右键敌方单位：选中单位集火目标
  - 右键敌方建筑：选中单位集火建筑
- **Evidence to Capture**: 录屏三种右键场景
- **Pass/Fail Criteria**:
  - Pass: 三种场景均正确响应
  - Fail: 任一场景无响应
- **Residual Risk / Notes**: 代码中 `mouseup` button===2 处理三种情况

### TC-024 右键菜单禁用（DEP-05）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-05
- **Requirement**: 游戏区域内右键不弹出浏览器菜单
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 在 Canvas 区域右键点击
  2. 观察是否弹出浏览器默认菜单
- **Expected Result**:
  - 不弹出浏览器右键菜单
  - `contextmenu` 事件被阻止
- **Evidence to Capture**: 录屏右键行为
- **Pass/Fail Criteria**:
  - Pass: 无浏览器菜单弹出
  - Fail: 弹出默认右键菜单
- **Residual Risk / Notes**: `canvas.addEventListener('contextmenu', e=>e.preventDefault())`

### TC-025 阵型分配（DEP-06）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-06
- **Requirement**: 布阵界面可分配前/中/后排，允许空排
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 完成兵种选择，进入布阵阶段
- **Test Steps**:
  1. 选择 8 个兵种
  2. 点击"部署阵型"进入布阵界面
  3. 点击单位图标切换前/中/后排
  4. 尝试将 8 个单位全放在一排
- **Expected Result**:
  - 单位图标显示所属排（红色=前，黄色=中，蓝色=后）
  - 点击可循环切换前→中→后→前
  - 允许空排，界面有警告提示（如"前排为空，无肉盾保护"）
  - 右侧显示各排单位数量
- **Evidence to Capture**: 截图布阵界面
- **Pass/Fail Criteria**:
  - Pass: 阵型分配功能完整
  - Fail: 无法切换或不允许空排
- **Residual Risk / Notes**: `cycleFormationRow` 实现循环切换，`formation-warnings` 显示警告

### TC-026 阵型展开（DEP-07）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-07
- **Requirement**: 开局单位按阵型在 HQ 附近展开，朝向地图中心
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 完成布阵，确认开战
- **Test Steps**:
  1. 在布阵界面分配前/中/后排
  2. 点击"确认开战"
  3. 观察单位在地图上的初始位置
- **Expected Result**:
  - 前排单位在距离 HQ 较远、靠近中线方向
  - 中排单位在 HQ 旁边
  - 后排单位在 HQ 后方（远离中线）
  - 阵型方向根据出生点自动旋转
- **Evidence to Capture**: 截图开局阵型
- **Pass/Fail Criteria**:
  - Pass: 单位按阵型正确展开
  - Fail: 阵型混乱或不按分配展开
- **Residual Risk / Notes**: `computeFormationPositions` 根据 `frontDir` 和 `rowOffsets` 计算

### TC-027 优先集火按钮（DEP-08）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-08
- **Requirement**: 战术面板"优先集火后排/前排"Toggle 生效
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 观察右上角战术面板
  2. 点击"集火后排"按钮
  3. 点击"集火前排"按钮
  4. 再次点击同一按钮取消
- **Expected Result**:
  - 两个按钮互斥（开启 A 自动关闭 B）
  - 点击按钮高亮显示激活状态
  - 再次点击同一按钮取消激活
  - 默认状态无优先级
- **Evidence to Capture**: 录屏按钮切换
- **Pass/Fail Criteria**:
  - Pass: Toggle 互斥且生效
  - Fail: 按钮不互斥或无效果
- **Residual Risk / Notes**: 代码中 `tacticalPriority` null/'back'/'front' 切换

### TC-028 固定标签（DEP-09）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-09
- **Requirement**: 敌方单位前后排标签固定，不因位置移动而改变
- **Priority**: P1
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 开启"优先集火后排"
  2. 观察单位攻击目标选择
  3. 注意敌方射手（原本后排）即使冲到前线仍被识别为"后排"
- **Expected Result**:
  - 优先集火后排时，系统优先攻击敌方后排单位
  - 敌方单位即使移动到前线，仍保留原始 formationRow 标签
  - 标签不因位置变化而改变
- **Evidence to Capture**: 录屏攻击目标选择
- **Pass/Fail Criteria**:
  - Pass: 标签固定，优先级正确
  - Fail: 标签随位置变化
- **Residual Risk / Notes**: 代码中 `formationRow` 在 Unit 构造时设定，永不改变

### TC-029 默认待命（DEP-10）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-10
- **Requirement**: 单位开局不自动推进，等待玩家指令
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 进入战斗后观察我方单位
  2. 等待 10 秒，不执行任何操作
  3. 观察单位行为
- **Expected Result**:
  - 我方单位保持原地待命（idle = true）
  - 不自动向前推进
  - 不自动攻击范围内敌人
  - 只有玩家下达指令后才行动
- **Evidence to Capture**: 录屏 10 秒静止观察
- **Pass/Fail Criteria**:
  - Pass: 单位待命不动
  - Fail: 单位自动推进
- **Residual Risk / Notes**: 代码中我方单位 `idle=true`，enemy 单位 `idle=false` 自动索敌

### TC-030 相机平移（DEP-11）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-11
- **Requirement**: 鼠标边缘滚动/WSAD 可平移相机查看全图
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 将鼠标移至屏幕左边缘，观察相机移动
  2. 按 W/A/S/D 键，观察相机移动
  3. 按方向键，观察相机移动
  4. 验证相机不会移出地图边界
- **Expected Result**:
  - 鼠标边缘触发相机滚动
  - WSAD 键控制相机平移
  - 方向键控制相机平移
  - 相机被限制在地图范围内（clampCamera）
- **Evidence to Capture**: 录屏相机平移
- **Pass/Fail Criteria**:
  - Pass: 三种方式均可平移相机
  - Fail: 任一方式无效或相机越界
- **Residual Risk / Notes**: `updateCamera` 处理边缘滚动和键盘输入

### TC-031 小地图跳转（DEP-12）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-12
- **Requirement**: 点击小地图相机瞬间跳转，迷雾区域同步
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 观察右下角小地图
  2. 点击小地图上远离当前视口的位置
  3. 观察相机跳转
  4. 验证小地图上迷雾区域显示为黑色
- **Expected Result**:
  - 点击小地图后相机瞬间跳转到对应位置
  - 小地图迷雾区域显示为黑色（FOG_UNEXPLORED）
  - 小地图显示已探索区域（深蓝灰）和可见区域（亮色）
  - 小地图显示视口白色框
- **Evidence to Capture**: 截图小地图并录屏跳转
- **Pass/Fail Criteria**:
  - Pass: 跳转正确，迷雾同步
  - Fail: 跳转无效或迷雾不同步
- **Residual Risk / Notes**: `handleMinimapClick` + `drawMinimap` 实现

### TC-032 布阵阶段地形可见（DEP-13）
- **Source**: 20260526-mulerun-deployment-enhancement.md DEP-13
- **Requirement**: 布阵阶段全图障碍物可见，敌方单位/建筑被迷雾遮盖
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入布阵阶段
- **Test Steps**:
  1. 完成兵种选择，进入布阵界面
  2. 观察 formation-preview 中的地图
  3. 验证障碍物可见
  4. 验证敌方区域被迷雾遮盖
- **Expected Result**:
  - 预览地图中障碍物（岩石）清晰可见
  - 己方建筑（HQ + 塔）可见
  - 敌方区域有半透明迷雾覆盖
  - 敌方单位和建筑不可见
- **Evidence to Capture**: 截图布阵预览
- **Pass/Fail Criteria**:
  - Pass: 地形可见，敌方被迷雾遮盖
  - Fail: 全图可见或障碍物不可见
- **Residual Risk / Notes**: `renderFormationPreview` 中绘制障碍物和半透明迷雾

---

## 副官系统

### TC-033 副官建议弹出与采纳/拒绝
- **Source**: code/index.html 副官系统
- **Requirement**: 副官定期弹出建议，玩家可采纳或拒绝
- **Priority**: P1
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 等待副官建议弹出（首次约 10-15 秒）
  2. 观察建议内容
  3. 点击"采纳"按钮
  4. 再次等待建议弹出
  5. 点击"拒绝"按钮
- **Expected Result**:
  - 副官建议面板在屏幕下方弹出
  - 建议内容包含战术提示
  - 采纳后执行对应战术动作
  - 拒绝后面板关闭
- **Evidence to Capture**: 录屏副官交互
- **Pass/Fail Criteria**:
  - Pass: 建议正常弹出，采纳/拒绝生效
  - Fail: 建议不弹出或按钮无效

---

## 通用功能

### TC-034 兵种克制系统
- **Source**: code/index.html UNIT_DEFS + COUNTER_BONUS
- **Requirement**: 步兵克骑兵、射手克步兵、骑兵克射手，克制时 1.6x 伤害
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 派步兵攻击骑兵
  2. 派射手攻击步兵
  3. 派骑兵攻击射手
  4. 观察伤害数值
- **Expected Result**:
  - 克制关系触发时伤害为 1.6 倍基础攻击
  - 非克制关系时伤害为基础值
- **Evidence to Capture**: 截图伤害数字
- **Pass/Fail Criteria**:
  - Pass: 克制伤害正确
  - Fail: 克制伤害无加成

### TC-035 胜负判定
- **Source**: code/index.html checkWinCondition
- **Requirement**: 摧毁敌方 HQ 胜利，己方 HQ 被毁战败，时间到按战力判定
- **Priority**: P0
- **Type**: Web E2E
- **Preconditions**: 进入战斗阶段
- **Test Steps**:
  1. 正常对战直至一方 HQ 被摧毁
  2. 或等待 180 秒倒计时结束
  3. 观察结果界面
- **Expected Result**:
  - 敌方 HQ 被毁：显示"胜利"
  - 己方 HQ 被毁：显示"战败"
  - 时间到：按战力判定胜/败/平
  - 结果界面显示用时、双方损失等统计
- **Evidence to Capture**: 截图结果界面
- **Pass/Fail Criteria**:
  - Pass: 胜负判定正确
  - Fail: 判定错误

### TC-036 再来一局
- **Source**: code/index.html btn-replay
- **Requirement**: 结果界面点击"再来一局"重新开始
- **Priority**: P1
- **Type**: Web E2E
- **Preconditions**: 游戏结束，在结果界面
- **Test Steps**:
  1. 点击"再来一局"按钮
  2. 观察是否回到部署界面
  3. 重新开始一局游戏
- **Expected Result**:
  - 回到兵种选择界面
  - 游戏状态完全重置
  - 可正常开始新游戏
- **Evidence to Capture**: 录屏重开流程
- **Pass/Fail Criteria**:
  - Pass: 重开功能正常
  - Fail: 重开后状态异常

---

## 测试用例汇总统计

| 优先级 | 数量 | TC-IDs |
|--------|------|--------|
| P0 | 24 | TC-001~008, 009~016, 020~025, 027, 029~032, 034, 035 |
| P1 | 12 | TC-004, 008, 017~019, 028, 033, 036 |
| **总计** | **36** | |

---

## 需求-测试用例追溯矩阵

| TC-ID | 需求来源 | 需求编号/条目 | 场景分类 | 优先级 | 证据类型 |
|-------|----------|---------------|----------|--------|----------|
| TC-001 | Phase 1-3 | 任务1 | 伤害反馈 | P0 | 截图 |
| TC-002 | Phase 1-3 | 任务2 | 选中反馈 | P0 | 截图 |
| TC-003 | Phase 1-3 | 任务4 | 集火攻击 | P0 | 录屏 |
| TC-004 | Phase 1-3 | 任务4 | 攻击队形 | P1 | 截图 |
| TC-005 | Phase 1-3 | 任务3 | 全军推进 | P0 | 录屏 |
| TC-006 | Phase 1-3 | 交互逻辑 | 单兵撤退 | P0 | 录屏 |
| TC-007 | Phase 1-3 | 任务5 | 障碍物 | P0 | 录屏 |
| TC-008 | Phase 1-3 | 交互逻辑 | 撤退归队 | P1 | 录屏 |
| TC-009 | Phase 4 | FOW-01 | 开局视野 | P0 | 截图 |
| TC-010 | Phase 4 | FOW-02 | 侦察可见 | P0 | 录屏 |
| TC-011 | Phase 4 | FOW-03 | 建筑黑影 | P0 | 截图 |
| TC-012 | Phase 4 | FOW-04 | 迷雾交互 | P0 | 录屏 |
| TC-013 | Phase 4 | FOW-05 | 黑影交互 | P0 | 录屏 |
| TC-014 | Phase 4 | FOW-06 | 攻击中断 | P0 | 录屏 |
| TC-015 | Phase 4 | FOW-07 | 未探索移动 | P0 | 录屏 |
| TC-016 | Phase 4 | FOW-08 | 移动优先 | P0 | 录屏 |
| TC-017 | Phase 4 | FOW-09 | 云雾纹理 | P1 | 截图 |
| TC-018 | Phase 4 | FOW-10 | 建筑视野 | P1 | 截图 |
| TC-019 | Phase 4 | FOW-11 | 更新频率 | P1 | 录屏 |
| TC-020 | Phase 5 | DEP-01 | 出生点随机 | P0 | 截图 |
| TC-021 | Phase 5 | DEP-02 | 地图尺寸 | P0 | 截图 |
| TC-022 | Phase 5 | DEP-03 | 框选操作 | P0 | 录屏 |
| TC-023 | Phase 5 | DEP-04 | 右键指令 | P0 | 录屏 |
| TC-024 | Phase 5 | DEP-05 | 右键菜单 | P0 | 录屏 |
| TC-025 | Phase 5 | DEP-06 | 阵型分配 | P0 | 截图 |
| TC-026 | Phase 5 | DEP-07 | 阵型展开 | P0 | 截图 |
| TC-027 | Phase 5 | DEP-08 | 集火按钮 | P0 | 录屏 |
| TC-028 | Phase 5 | DEP-09 | 固定标签 | P1 | 录屏 |
| TC-029 | Phase 5 | DEP-10 | 默认待命 | P0 | 录屏 |
| TC-030 | Phase 5 | DEP-11 | 相机平移 | P0 | 录屏 |
| TC-031 | Phase 5 | DEP-12 | 小地图 | P0 | 截图+录屏 |
| TC-032 | Phase 5 | DEP-13 | 地形可见 | P0 | 截图 |
| TC-033 | 代码 | 副官系统 | 副官建议 | P1 | 录屏 |
| TC-034 | 代码 | 兵种克制 | 克制伤害 | P0 | 截图 |
| TC-035 | 代码 | 胜负判定 | 结果判定 | P0 | 截图 |
| TC-036 | 代码 | 重开功能 | 再来一局 | P1 | 录屏 |

---

## 残余风险

1. **性能测试**：未在低性能设备/低版本浏览器上验证帧率和响应延迟
2. **浏览器兼容性**：测试基于主流现代浏览器，未覆盖 IE/旧版浏览器
3. **随机性覆盖**：出生点随机和 AI 组合随机无法穷举所有组合
4. **边界条件**：极端情况如全同种兵种、0 秒时间等未专门测试
5. **无障碍访问**：未进行屏幕阅读器和键盘完全导航测试
