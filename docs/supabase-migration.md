# Supabase 数据迁移计划

为了彻底摆脱 IndexedDB，本项目需要分阶段将剩余模块迁移至 Supabase。以下为建议路线。

## 现状梳理
- **opportunityStore**：销售机会与阶段信息仍保存在浏览器 IndexedDB。
- **scriptStore**：话术模板本地存储，无法多人共享。
- **teamStore**：团队成员、消息、冲突记录均为本地数据。
- **utils/storage.ts**：封装了 IndexedDB 操作，是上述模块的公共依赖。

## 迁移步骤
1. **定义后端模型**
   - 在 `database/database-schema.sql` 中新增对应表结构，例如 `sales_opportunities`、`sales_stages`、`script_templates`、`team_members`、`team_messages`、`customer_conflicts` 等。
   - 为每张表设计 RLS 策略，确保用户隔离。

2. **抽象客户端映射**
   - 借鉴 `customerStore`、`communicationStore`、`reminderStore` 的实现，为每个模块编写 `mapFromDb` / `buildInsertPayload` 等工具，统一 snake_case 与 camelCase 的转换。
   - 在 `src/lib/supabase.ts` 中集中维护 Supabase row 类型，方便复用。

3. **分模块替换状态管理**
   - 先迁移机会与阶段（`useOpportunityStore`），验证拖拽看板、漏斗统计等功能。
   - 再迁移话术模块（`useScriptStore`），确保分类、搜索、复制等功能支持多人使用。
   - 最后迁移团队模块（`useTeamStore`），补充通知、冲突检测所需的后台逻辑。

4. **历史数据迁移策略**
   - 提供一次性脚本，将 IndexedDB 中的数据导出并写入 Supabase（可在开发者工具中读取后手动上传，或编写临时迁移页面）。
   - 为生产环境准备回滚机制，确保迁移失败时可恢复本地方案。

5. **测试与回归**
   - 为每个模块补充最小可行的端到端用例（如新增-编辑-删除流程）。
   - 在 README 中更新可选的 `seed` 数据，便于团队成员快速体验。

## 里程碑
- ✅ 客户、提醒、沟通模块已接入 Supabase。
- ⬜ 销售机会 & 阶段同步到 Supabase。
- ⬜ 话术库同步到 Supabase。
- ⬜ 团队协作、消息中心同步到 Supabase。
- ⬜ 移除 IndexedDB 存储层与相关工具。

完成以上步骤后，可移除 `utils/storage.ts`，并将 PWA 离线模式调整为只读能力或基于 Supabase 缓存的策略。
