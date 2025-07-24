-- 添加 approval 状态到 cases 表的 status 字段约束
-- 删除现有的 check 约束
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_status_check;

-- 添加新的 check 约束，包含 approval 状态
ALTER TABLE public.cases ADD CONSTRAINT cases_status_check 
  CHECK (status IN ('draft', 'published', 'archived', 'approval'));

-- 添加注释说明状态含义
COMMENT ON COLUMN public.cases.status IS '案例状态: draft=草稿, published=已发布, archived=已归档, approval=待审批';

-- 为 approval 状态创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_cases_status_approval ON public.cases(status) WHERE status = 'approval';