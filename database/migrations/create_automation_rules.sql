-- Automation Rules System
-- Enables scheduled and trigger-based push notifications
-- Run this in Supabase SQL Editor

-- ============================================
-- AUTOMATION RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    
    -- Rule identification
    name TEXT NOT NULL,
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN (
        'birthday',           -- Triggered on customer birthday
        'weekday_schedule',   -- Triggered on specific day/time
        'inactivity',         -- Triggered after X days without scan
        'custom'              -- Custom trigger conditions
    )),
    
    -- Rule configuration (JSON format varies by rule_type)
    -- 
    -- Birthday: { "days_before": 0, "send_time": "09:00" }
    -- Weekday: { "weekdays": [1,3,5], "time": "12:00" }
    -- Inactivity: { "days_inactive": 14 }
    -- Custom: { "trigger_field": "...", "condition": "...", "value": "..." }
    config JSONB DEFAULT '{}'::jsonb,
    
    -- Message template (supports placeholders)
    -- Available: {{name}}, {{stamps}}, {{reward}}, {{points}}
    message_template TEXT NOT NULL,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTOMATION EXECUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE NOT NULL,
    pass_id UUID REFERENCES passes(id) ON DELETE CASCADE,
    
    -- Execution details
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
    error_message TEXT,
    
    -- Message that was actually sent (after placeholder replacement)
    sent_message TEXT,
    
    -- Prevent duplicate sends for same rule/pass/day
    execution_date DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- INDEXES
-- ============================================

-- Fast lookup by campaign
CREATE INDEX IF NOT EXISTS idx_automation_rules_campaign 
    ON automation_rules(campaign_id);

-- Filter by rule type and status
CREATE INDEX IF NOT EXISTS idx_automation_rules_type_enabled 
    ON automation_rules(rule_type, is_enabled) 
    WHERE is_enabled = true;

-- Prevent duplicate executions for same rule/pass/day
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_executions_unique 
    ON automation_executions(rule_id, pass_id, execution_date);

-- Lookup execution history by rule
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule 
    ON automation_executions(rule_id, executed_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for automation_rules (POS system access)
CREATE POLICY "Allow public access automation_rules" ON automation_rules
    FOR ALL USING (true) WITH CHECK (true);

-- Allow public read/write for automation_executions (cron job access)
CREATE POLICY "Allow public access automation_executions" ON automation_executions
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- AUTO-UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_automation_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_automation_rules_timestamp ON automation_rules;
CREATE TRIGGER trigger_update_automation_rules_timestamp
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_rules_timestamp();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE automation_rules IS 'Stores automation rule configurations for scheduled push notifications';
COMMENT ON COLUMN automation_rules.rule_type IS 'Type of automation: birthday, weekday_schedule, inactivity, or custom';
COMMENT ON COLUMN automation_rules.config IS 'JSON configuration specific to the rule type';
COMMENT ON COLUMN automation_rules.message_template IS 'Message template with placeholders like {{name}}, {{stamps}}';

COMMENT ON TABLE automation_executions IS 'Tracks executed automations to prevent duplicates and for analytics';
COMMENT ON COLUMN automation_executions.execution_date IS 'Date of execution, used with unique index to prevent same-day duplicates';
