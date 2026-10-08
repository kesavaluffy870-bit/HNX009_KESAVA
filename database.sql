-- =====================================================================
-- OmniDoc AI / STRAW HAT - Intelligent Document Intelligence Database
-- Compatible with PostgreSQL 13+ and MySQL 8.0+
-- Description: Schema for storing uploaded documents, automated AI
--              summaries, extracted entities, and cross-document synthesis.
-- =====================================================================

-- 1. Organizations / Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'Enterprise',
    max_file_size_mb INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150),
    role VARCHAR(50) DEFAULT 'Analyst',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Uploaded Documents Table
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    uploaded_by VARCHAR(64) REFERENCES users(user_id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_extension VARCHAR(20) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    word_count INT DEFAULT 0,
    estimated_read_time_mins INT DEFAULT 0,
    raw_content LONGTEXT,
    sentiment_label VARCHAR(30) DEFAULT 'Neutral',
    sentiment_score DECIMAL(5, 2) DEFAULT 0.00,
    processing_status VARCHAR(30) DEFAULT 'COMPLETED', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    checksum_hash VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Automated AI Document Summaries Table
CREATE TABLE IF NOT EXISTS document_summaries (
    summary_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    summary_mode VARCHAR(40) DEFAULT 'Executive_TLDR', -- 'Executive_TLDR', 'Bullet_Takeaways', 'Action_Items', 'Deep_Dive'
    tldr_overview TEXT NOT NULL,
    key_takeaways_json JSON,
    reading_time_saved_mins INT DEFAULT 0,
    confidence_score DECIMAL(4, 2) DEFAULT 0.95,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Extracted Entities & Metrics Table (People, Organizations, Money, Dates)
CREATE TABLE IF NOT EXISTS extracted_entities (
    entity_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    entity_type VARCHAR(40) NOT NULL, -- 'CURRENCY', 'DATE', 'ORGANIZATION', 'PERCENTAGE', 'PERSON', 'RISK'
    entity_value VARCHAR(255) NOT NULL,
    context_sentence TEXT,
    frequency_count INT DEFAULT 1,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Critical Alerts, Liabilities & Risk Flags Table
CREATE TABLE IF NOT EXISTS document_risk_alerts (
    alert_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL, -- 'CRITICAL', 'WARNING', 'INFO'
    trigger_keyword VARCHAR(100) NOT NULL,
    flagged_sentence TEXT NOT NULL,
    remediation_required BOOLEAN DEFAULT TRUE,
    deadline_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Cross-Document Executive Syntheses (Multi-Doc Reports)
CREATE TABLE IF NOT EXISTS corpus_syntheses (
    synthesis_id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    total_docs_analyzed INT NOT NULL,
    total_words_processed BIGINT NOT NULL,
    overall_reduction_percentage DECIMAL(5, 2) DEFAULT 94.00,
    executive_brief_markdown LONGTEXT,
    generated_by VARCHAR(64) REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Document Ingestion Logs & Audit Trail
CREATE TABLE IF NOT EXISTS ingestion_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES documents(document_id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL, -- 'UPLOAD', 'PARSING', 'NLP_EXTRACTION', 'SUMMARIZATION'
    status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'WARNING', 'ERROR'
    message TEXT,
    execution_duration_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & RETRIEVAL
-- =====================================================================
CREATE INDEX idx_docs_workspace ON documents(workspace_id);
CREATE INDEX idx_docs_category ON documents(category);
CREATE INDEX idx_docs_status ON documents(processing_status);
CREATE INDEX idx_summaries_doc ON document_summaries(document_id);
CREATE INDEX idx_entities_doc ON extracted_entities(document_id);
CREATE INDEX idx_entities_type ON extracted_entities(entity_type);
CREATE INDEX idx_risks_severity ON document_risk_alerts(severity);

-- =====================================================================
-- SAMPLE SEED DATA
-- =====================================================================
INSERT INTO workspaces (workspace_id, name, plan_tier) 
VALUES ('ws-prod-01', 'Straw Hat Intelligence Workspace', 'Enterprise')
ON CONFLICT (workspace_id) DO NOTHING;

INSERT INTO users (user_id, workspace_id, email, full_name, role)
VALUES ('user-01', 'ws-prod-01', 'analyst@strawhat.ai', 'Chief Knowledge Officer', 'Lead Analyst')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO documents (document_id, workspace_id, uploaded_by, file_name, file_extension, file_size_bytes, category, word_count, estimated_read_time_mins, processing_status)
VALUES 
('doc-01', 'ws-prod-01', 'user-01', 'Project_Titan_Q3_Strategic_Review.md', 'md', 1840, 'Technical', 420, 2, 'COMPLETED'),
('doc-02', 'ws-prod-01', 'user-01', 'Master_Services_Agreement_ApexCorp.txt', 'txt', 2150, 'Legal', 480, 2, 'COMPLETED'),
('doc-03', 'ws-prod-01', 'user-01', 'Annual_Cybersecurity_Audit_Report.json', 'json', 1420, 'Security', 310, 1, 'COMPLETED')
ON CONFLICT (document_id) DO NOTHING;
