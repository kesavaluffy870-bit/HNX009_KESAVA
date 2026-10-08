// Initialize PDF.js worker
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/**
 * STATE STORE
 */
const state = {
    documents: [],
    activeDocId: null,
    activeTab: 'synthesis',
    activeSummaryMode: 'tldr',
    charts: {
        category: null,
        sentiment: null
    }
};

/**
 * PRE-POPULATED ENTERPRISE DEMO DATASET
 * Simulates real-world multi-domain document intelligence
 */
const DEMO_DOCUMENTS = [
    {
        id: 'doc-demo-1',
        name: 'Project_Titan_Q3_Strategic_Review.md',
        category: 'Technical',
        content: `# Project Titan — Q3 Strategic Engineering Review & Milestones
Date: September 28, 2026
Author: Engineering Leadership Committee

## Executive Summary
Project Titan has reached Phase 3 deployment across North American and European clusters. However, infrastructure bottlenecks in the distributed caching layer have caused a 14% increase in latency under peak loads. 

## Key Metrics & Financials
- Total Project Budget Allocated: $4,850,000 USD
- Spent to Date: $3,210,000 USD
- Anticipated Q4 Overrun: $420,000 USD due to accelerated GPU server procurement from Nvidia.
- Server fleet uptime achieved: 99.94% (Target was 99.99%).

## Critical Risks & Bottlenecks
- Immediate Risk: Cloud vendor contract with AWS expires on November 15, 2026. If the renewed Enterprise Discount Agreement is not finalized by October 31, 2026, hosting rates will surge by 22%.
- The distributed database migration is currently 3 weeks behind schedule due to unexpected shard rebalancing issues.
- Action Required: Senior SRE lead must execute database optimization run before October 20, 2026. Failure to comply may trigger customer SLA breach penalties of up to $150,000.`,
        dateAdded: new Date()
    },
    {
        id: 'doc-demo-2',
        name: 'Master_Services_Agreement_ApexCorp.txt',
        category: 'Legal',
        content: `MASTER SERVICES AGREEMENT (MSA)
PARTIES: ApexCorp Enterprises ("Provider") AND Helios Global Group ("Client")
EFFECTIVE DATE: June 1, 2026
EXPIRATION DATE: May 31, 2028

1. PAYMENT TERMS & RETAINERS
Client agrees to remit monthly retainer payments of $85,000 USD payable net-30 days upon invoice receipt. Late payments shall accrue interest at a rate of 1.5% per month or the legal maximum allowable.

2. INDEMNIFICATION & LIABILITY CAP
Total liability of either party arising out of or related to this Agreement shall strictly NOT exceed $2,500,000 USD or the aggregate amounts paid by Client in the preceding 12 months, whichever is greater. 

3. TERMINATION & CANCELLATION NOTICE
Either party may terminate this agreement for convenience upon providing sixty (60) days prior written notice. In the event of material breach, cure period is strictly fourteen (14) calendar days. Failure to remedy material breach results in immediate termination and penalty fee forfeiture.

4. CONFIDENTIALITY & NON-SOLICITATION
Both parties agree to protect proprietary trade secrets for a period of five (5) years following termination. Non-solicitation covenants shall remain in effect for 18 months post-engagement.`,
        dateAdded: new Date()
    },
    {
        id: 'doc-demo-3',
        name: 'Annual_Cybersecurity_Audit_Report.json',
        category: 'Security',
        content: `{
  "audit_title": "Enterprise Infrastructure Penetration Test & Security Audit",
  "audit_firm": "CyberSentinel Labs",
  "completed_date": "August 14, 2026",
  "scope": "All public-facing API gateways, internal Kubernetes clusters, and employee IAM portals",
  "findings": {
    "critical_vulnerabilities": 1,
    "high_vulnerabilities": 3,
    "medium_vulnerabilities": 8,
    "remediated": 7
  },
  "critical_alert": {
    "cve_reference": "CVE-2026-8812",
    "description": "Legacy authentication microservice allows JWT secret rotation bypass under specific race conditions.",
    "risk_level": "CRITICAL",
    "remediation_deadline": "October 18, 2026",
    "potential_impact": "Unauthorized access to internal billing databases containing 450,000 customer payment tokens.",
    "action_required": "Deploy patched v4.2.1 auth daemon to all clusters immediately."
  },
  "compliance_status": {
    "SOC2_Type_II": "Compliant",
    "ISO_27001": "Pending remediation of CVE-2026-8812",
    "GDPR_Audit": "Zero non-conformities found"
  }
}`,
        dateAdded: new Date()
    },
    {
        id: 'doc-demo-4',
        name: 'Q4_Financial_Forecast_&_Revenue_Model.csv',
        category: 'Finance',
        content: `Quarter,Revenue_Projected,Expenses_Actual,EBITDA_Margin,Burn_Rate_Monthly,Key_Variance_Note
Q1 2026,$12400000,$9800000,21.0%,$620000,Base operational year
Q2 2026,$14200000,$10500000,26.1%,$580000,International expansion launch
Q3 2026,$16800000,$12100000,28.0%,$650000,Enterprise SaaS contract surge
Q4 2026 Projected,$19500000,$13800000,29.2%,$710000,Anticipated holiday uplift and platform adoption
Full Year Target,$62900000,$46200000,26.5%,$640000,Board target $60,000,000 will be exceeded by 4.8%`,
        dateAdded: new Date()
    },
    {
        id: 'doc-demo-5',
        name: 'Workplace_Remote_Policy_Compliance.md',
        category: 'Operations',
        content: `# Global Workforce & Remote Employment Framework 2026
Applicable: All full-time, part-time, and contracted personnel worldwide.
Version: 3.4
Last Revised: July 12, 2026

## Core Provisions
1. Remote Work Stipend: Employees are eligible for a one-time ergonomic home office allowance of $1,200 USD and an ongoing monthly connectivity subsidy of $100 USD.
2. Data Protection Mandate: Company-issued laptops must remain encrypted at all times with BitLocker/FileVault. Connecting to public unencrypted Wi-Fi without VPN is grounds for disciplinary action.
3. Overtime & Working Hours: Non-exempt workers must not exceed 40 hours per week without prior written authorization from Department Directors. Unauthorized overtime triggers mandatory HR review.
4. International Work Sabbatical: Personnel may work remotely outside their tax jurisdiction for up to thirty (30) business days per calendar year, provided international IP restrictions are strictly respected.`,
        dateAdded: new Date()
    }
];

/**
 * NATURAL LANGUAGE & EXTRACTION UTILITIES
 */
const NLP = {
    stopWords: new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'of', 'for', 'it', 'with', 'as', 'by', 'from', 'or', 'that', 'this', 'be', 'are', 'were', 'was', 'have', 'has', 'had', 'not', 'but', 'what', 'all', 'can', 'your', 'we', 'our', 'you', 'they', 'their', 'will', 'shall']),

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !this.stopWords.has(w));
    },

    splitSentences(text) {
        return text
            .replace(/([.?!])\s+(?=[A-Z0-9])/g, "$1|")
            .split("|")
            .map(s => s.trim())
            .filter(s => s.length > 20);
    },

    extractMetrics(text) {
        const regex = /(?:[\$\€\£\¥]\s?[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|k|M|B))?|\b\d+(?:\.\d+)?%|\b[\d,]+(?:\.\d+)?\s*(?:USD|EUR|GBP))/gi;
        const matches = text.match(regex) || [];
        return Array.from(new Set(matches)).slice(0, 15);
    },

    extractDates(text) {
        const regex = /(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{2,4}|\b\d{4}-\d{2}-\d{2}|\bQ[1-4]\s+\d{4})/gi;
        const matches = text.match(regex) || [];
        return Array.from(new Set(matches)).slice(0, 12);
    },

    extractRisks(text) {
        const riskTerms = [
            'critical', 'vulnerability', 'breach', 'penalty', 'overrun', 'bottleneck',
            'sla breach', 'liability', 'urgent', 'behind schedule', 'disciplinary', 'cve-',
            'unauthorized', 'surge', 'risk', 'forfeiture', 'lawsuit', 'overdue'
        ];
        const sentences = this.splitSentences(text);
        const flagged = [];

        sentences.forEach(s => {
            const lower = s.toLowerCase();
            for (let term of riskTerms) {
                if (lower.includes(term)) {
                    flagged.push({ sentence: s, term: term });
                    break;
                }
            }
        });
        return flagged;
    },

    analyzeSentiment(text) {
        const posWords = ['growth', 'profit', 'exceeded', 'compliant', 'uptime', 'accelerated', 'adoption', 'reliable', 'success', 'approved', 'increase'];
        const negWords = ['risk', 'bottleneck', 'penalty', 'breach', 'overrun', 'behind', 'vulnerability', 'surge', 'unauthorized', 'delay', 'overdue', 'failure'];

        let score = 0;
        const lower = text.toLowerCase();
        posWords.forEach(w => {
            const count = (lower.match(new RegExp('\\b' + w + '\\b', 'g')) || []).length;
            score += count;
        });
        negWords.forEach(w => {
            const count = (lower.match(new RegExp('\\b' + w + '\\b', 'g')) || []).length;
            score -= count * 1.5;
        });

        if (score > 2) return { label: 'Healthy / Positive', class: 'risk-low' };
        if (score < -2) return { label: 'High Risk / Alert', class: 'risk-high' };
        return { label: 'Moderate / Caution', class: 'risk-med' };
    },

    generateKeySummary(text, maxSentences = 3) {
        const sentences = this.splitSentences(text);
        if (sentences.length <= maxSentences) return sentences;

        const wordTokens = this.tokenize(text);
        const freq = {};
        wordTokens.forEach(w => freq[w] = (freq[w] || 0) + 1);

        const scored = sentences.map((sentence, idx) => {
            const words = this.tokenize(sentence);
            let rawScore = 0;
            words.forEach(w => {
                rawScore += (freq[w] || 0);
            });
            const normalized = words.length > 0 ? rawScore / words.length : 0;
            const posBonus = (idx === 0 || idx === 1) ? 1.4 : (idx === sentences.length - 1 ? 1.2 : 1.0);
            return { sentence, score: normalized * posBonus, index: idx };
        });

        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, maxSentences).sort((a, b) => a.index - b.index);
        return top.map(item => item.sentence);
    }
};

/**
 * INITIALIZATION & EVENTS
 */
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initDropzone();
    initModals();
    initSearch();
    initQA();
    initComparator();
    initDocumentSummarizer();

    // Load demo data immediately on startup
    loadDemoData();
});

/**
 * TAB MANAGEMENT
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            const targetPane = document.getElementById(`pane-${target}`);
            if (targetPane) targetPane.classList.add('active');

            state.activeTab = target;

            if (target === 'docsummary') {
                renderSingleDocSummary(state.activeDocId, state.activeSummaryMode);
            } else if (target === 'analytics') {
                renderCharts();
            } else if (target === 'compare') {
                populateCompareDropdowns();
            }
        });
    });
}

function switchToTab(tabName) {
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (tabBtn) tabBtn.click();
}

/**
 * DOCUMENT INGESTION & PARSING
 */
function initDropzone() {
    const dropzone = document.getElementById('dropzoneContainer');
    const fileInput = document.getElementById('fileUploadInput');

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    document.getElementById('btnLoadDemo').addEventListener('click', loadDemoData);
    document.getElementById('btnQuickDemo').addEventListener('click', loadDemoData);
    document.getElementById('btnClearDocs').addEventListener('click', clearAllDocuments);
    document.getElementById('docFilterInput').addEventListener('input', filterDocumentsList);
}

async function handleFiles(fileList) {
    let lastAddedDoc = null;
    showAiToast('AI Reading Documents...', `Parsing ${fileList.length} incoming file(s)`);

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        try {
            let content = '';
            const ext = file.name.split('.').pop().toLowerCase();

            if (ext === 'pdf') {
                content = await readPdfContent(file);
            } else {
                content = await readTextContent(file);
            }

            if (content && content.trim().length > 0) {
                const newDoc = {
                    id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    name: file.name,
                    category: detectCategory(file.name, content),
                    content: content,
                    dateAdded: new Date()
                };
                addDocumentToState(newDoc);
                lastAddedDoc = newDoc;
            }
        } catch (err) {
            console.error('Error reading file:', file.name, err);
            alert('Could not parse ' + file.name + ': ' + err.message);
        }
    }

    recalculateAll();

    if (lastAddedDoc) {
        state.activeDocId = lastAddedDoc.id;
        showAiToast('AI Summarization Complete', `Summarized & analyzed "${lastAddedDoc.name}"`);
        switchToTab('docsummary');
    }
}

function readTextContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

async function readPdfContent(file) {
    if (!window.pdfjsLib) {
        throw new Error('PDF.js library is not loaded');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n` + pageText;
    }
    return fullText;
}

function detectCategory(name, text) {
    const lower = (name + ' ' + text.slice(0, 500)).toLowerCase();
    if (lower.includes('agreement') || lower.includes('contract') || lower.includes('legal') || lower.includes('indemn')) return 'Legal';
    if (lower.includes('revenue') || lower.includes('budget') || lower.includes('ebitda') || lower.includes('financial') || lower.includes('forecast')) return 'Finance';
    if (lower.includes('security') || lower.includes('audit') || lower.includes('cve') || lower.includes('vulnerability')) return 'Security';
    if (lower.includes('engineering') || lower.includes('kubernetes') || lower.includes('architecture') || lower.includes('cluster') || lower.includes('api')) return 'Technical';
    if (lower.includes('policy') || lower.includes('hr') || lower.includes('employee') || lower.includes('operations')) return 'Operations';
    return 'General';
}

function addDocumentToState(doc) {
    state.documents.push(doc);
}

function loadDemoData() {
    state.documents = JSON.parse(JSON.stringify(DEMO_DOCUMENTS));
    state.activeDocId = state.documents[0].id;
    showAiToast('Enterprise Knowledge Base Ready', '5 documents indexed, analyzed, and summarized');
    recalculateAll();
}

function clearAllDocuments() {
    if (confirm('Clear all indexed documents from this workspace?')) {
        state.documents = [];
        state.activeDocId = null;
        recalculateAll();
    }
}

/**
 * RECALCULATION & DASHBOARD UPDATES
 */
function recalculateAll() {
    renderMetricsRibbon();
    renderDocumentList();
    renderExecutiveSynthesis();
    renderEntityMatrix();
    updateSearchDropdown();
    updateSummaryDropdown();
    populateCompareDropdowns();

    if (state.activeTab === 'docsummary') {
        renderSingleDocSummary(state.activeDocId, state.activeSummaryMode);
    } else if (state.activeTab === 'analytics') {
        renderCharts();
    }
}

function renderMetricsRibbon() {
    const docCount = state.documents.length;
    let totalWords = 0;
    let totalRisks = 0;
    let entitySet = new Set();

    state.documents.forEach(doc => {
        const words = doc.content.split(/\s+/).filter(Boolean).length;
        totalWords += words;

        const risks = NLP.extractRisks(doc.content);
        totalRisks += risks.length;

        const metrics = NLP.extractMetrics(doc.content);
        const dates = NLP.extractDates(doc.content);
        metrics.forEach(m => entitySet.add(m));
        dates.forEach(d => entitySet.add(d));
    });

    const minutesSaved = Math.round(totalWords / 220);
    const hoursSaved = (minutesSaved / 60).toFixed(1);
    const displayTime = minutesSaved > 60 ? `${hoursSaved} hrs` : `${minutesSaved} mins`;

    document.getElementById('statDocCount').textContent = docCount;
    document.getElementById('statWordsAnalyzed').textContent = totalWords.toLocaleString();
    document.getElementById('statTimeSaved').textContent = docCount > 0 ? displayTime : '0m';
    document.getElementById('statRisksFound').textContent = totalRisks;
    document.getElementById('statEntitiesCount').textContent = entitySet.size;

    document.getElementById('sidebarDocBadge').textContent = `${docCount} Files`;
}

function renderDocumentList() {
    const container = document.getElementById('docListContainer');
    container.innerHTML = '';

    if (state.documents.length === 0) {
        container.innerHTML = `
      <div style="text-align: center; padding: 24px 10px; color: var(--text-dim); font-size: 0.8rem;">
        No documents indexed yet.<br>Click "Insert Demo" or drop files above.
      </div>
    `;
        return;
    }

    state.documents.forEach(doc => {
        const words = doc.content.split(/\s+/).filter(Boolean).length;
        const sentiment = NLP.analyzeSentiment(doc.content);

        const card = document.createElement('div');
        card.className = `doc-item-card ${state.activeDocId === doc.id ? 'active' : ''}`;
        card.innerHTML = `
      <div class="doc-item-header">
        <div class="doc-title-line" title="${doc.name}">
          <svg class="doc-type-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <span>${doc.name}</span>
        </div>
        <div class="doc-item-actions">
          <button class="doc-action-btn summary-quick-btn" title="View AI Summary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </button>
          <button class="doc-action-btn view-btn" title="View Full Text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button class="doc-action-btn delete delete-btn" title="Remove Document">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div class="doc-meta-row">
        <span class="doc-tag">${doc.category}</span>
        <span class="doc-tag ${sentiment.class}">${sentiment.label}</span>
        <span>${words.toLocaleString()} words</span>
      </div>
    `;

        card.querySelector('.summary-quick-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            state.activeDocId = doc.id;
            switchToTab('docsummary');
        });

        card.querySelector('.view-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openDocumentViewer(doc);
        });

        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            state.documents = state.documents.filter(d => d.id !== doc.id);
            if (state.activeDocId === doc.id) {
                state.activeDocId = state.documents.length > 0 ? state.documents[0].id : null;
            }
            recalculateAll();
        });

        card.addEventListener('click', () => {
            state.activeDocId = doc.id;
            document.querySelectorAll('.doc-item-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            if (state.activeTab === 'docsummary') {
                renderSingleDocSummary(doc.id, state.activeSummaryMode);
            }
        });

        container.appendChild(card);
    });
}

function filterDocumentsList(e) {
    const q = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.doc-item-card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
    });
}

/**
 * DEDICATED PER-DOCUMENT AI SUMMARIZER
 */
function initDocumentSummarizer() {
    const docSelect = document.getElementById('summaryDocSelect');
    if (docSelect) {
        docSelect.addEventListener('change', (e) => {
            state.activeDocId = e.target.value;
            renderSingleDocSummary(state.activeDocId, state.activeSummaryMode);
        });
    }

    // Summary Mode buttons
    document.querySelectorAll('.summary-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.summary-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeSummaryMode = btn.getAttribute('data-mode');
            renderSingleDocSummary(state.activeDocId, state.activeSummaryMode);
        });
    });

    // Copy Summary
    const btnCopy = document.getElementById('btnCopySummary');
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const doc = getActiveDoc();
            if (!doc) return;
            const text = generateFormattedSummaryText(doc, state.activeSummaryMode);
            navigator.clipboard.writeText(text).then(() => {
                const orig = btnCopy.innerHTML;
                btnCopy.innerHTML = '✓ Copied!';
                setTimeout(() => btnCopy.innerHTML = orig, 1800);
            });
        });
    }

    // Download Summary
    const btnDownload = document.getElementById('btnDownloadSummary');
    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            const doc = getActiveDoc();
            if (!doc) return;
            const text = generateFormattedSummaryText(doc, state.activeSummaryMode);
            const blob = new Blob([text], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.name.replace(/\.[^/.]+$/, "")}_AI_Summary.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Text-To-Speech Read Aloud
    const btnSpeak = document.getElementById('btnSpeakSummary');
    if (btnSpeak) {
        btnSpeak.addEventListener('click', () => {
            if (!('speechSynthesis' in window)) {
                alert('Speech synthesis is not supported in this browser.');
                return;
            }
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                btnSpeak.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Read Aloud (Voice)`;
                return;
            }
            const tldr = document.getElementById('singleDocTldrText').innerText;
            const utterance = new SpeechSynthesisUtterance(tldr);
            utterance.rate = 1.0;
            utterance.onend = () => {
                btnSpeak.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Read Aloud (Voice)`;
            };
            window.speechSynthesis.speak(utterance);
            btnSpeak.innerHTML = `⏹ Stop Voice`;
        });
    }

    // Toggle Source Text View
    const btnToggleSide = document.getElementById('btnToggleSideBySide');
    if (btnToggleSide) {
        btnToggleSide.addEventListener('click', () => {
            const container = document.getElementById('sourceTextContainer');
            if (container) {
                container.style.display = container.style.display === 'none' ? 'flex' : 'none';
            }
        });
    }
}

function updateSummaryDropdown() {
    const select = document.getElementById('summaryDocSelect');
    if (!select) return;
    select.innerHTML = '';

    state.documents.forEach(doc => {
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = `${doc.name} (${doc.category})`;
        if (state.activeDocId === doc.id) opt.selected = true;
        select.appendChild(opt);
    });
}

function getActiveDoc() {
    if (!state.activeDocId && state.documents.length > 0) {
        state.activeDocId = state.documents[0].id;
    }
    return state.documents.find(d => d.id === state.activeDocId);
}

function renderSingleDocSummary(docId, mode = 'tldr') {
    const doc = state.documents.find(d => d.id === docId) || getActiveDoc();
    const tldrEl = document.getElementById('singleDocTldrText');
    const takeawaysEl = document.getElementById('singleDocTakeawaysList');
    const alertsEl = document.getElementById('singleDocAlertsList');
    const rawTextEl = document.getElementById('singleDocRawText');
    const wordCountEl = document.getElementById('singleDocWordCount');
    const catBadge = document.getElementById('summaryCategoryBadge');
    const riskBadge = document.getElementById('summaryRiskBadge');
    const selectEl = document.getElementById('summaryDocSelect');

    if (!doc) {
        tldrEl.textContent = 'No documents currently indexed. Please upload or paste documents above.';
        takeawaysEl.innerHTML = '<div style="color:var(--text-dim); font-size:0.85rem;">No document selected.</div>';
        alertsEl.innerHTML = '';
        rawTextEl.textContent = '';
        wordCountEl.textContent = '0 words';
        return;
    }

    if (selectEl) selectEl.value = doc.id;

    // Metadata
    const words = doc.content.split(/\s+/).filter(Boolean).length;
    const sentiment = NLP.analyzeSentiment(doc.content);
    catBadge.textContent = doc.category;
    riskBadge.textContent = sentiment.label;
    riskBadge.className = `doc-tag ${sentiment.class}`;
    wordCountEl.textContent = `${words.toLocaleString()} words`;
    rawTextEl.textContent = doc.content;

    // Extract Summary Sentences
    let sentenceCount = 3;
    if (mode === 'tldr') sentenceCount = 2;
    if (mode === 'takeaways') sentenceCount = 5;
    if (mode === 'full') sentenceCount = 6;

    const topSentences = NLP.generateKeySummary(doc.content, sentenceCount);
    const risks = NLP.extractRisks(doc.content);

    // TLDR Box
    if (mode === 'actions') {
        tldrEl.innerHTML = `<strong>Action-Oriented Summary:</strong> Identified <strong>${risks.length} obligations & alerts</strong> in <em>${escapeHtml(doc.name)}</em> requiring operational or legal review.`;
    } else {
        tldrEl.innerHTML = `<strong>Executive AI Synthesis:</strong> ${escapeHtml(topSentences.slice(0, 2).join(' '))}`;
    }

    // Key Takeaways List
    takeawaysEl.innerHTML = '';
    topSentences.forEach((sentence, idx) => {
        const item = document.createElement('div');
        item.className = 'bullet-point-item';
        item.innerHTML = `
      <div class="bullet-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
      <div>
        <div class="bullet-text">${escapeHtml(sentence)}</div>
        <span class="bullet-source">Confidence: 9${8 - idx}%</span>
      </div>
    `;
        takeawaysEl.appendChild(item);
    });

    // Risk Alerts
    alertsEl.innerHTML = '';
    if (risks.length === 0) {
        alertsEl.innerHTML = `<div style="color:var(--accent-emerald); font-size:0.85rem; padding:10px;">✓ No liabilities, penalties, or critical risks flagged in this document.</div>`;
    } else {
        risks.forEach(alert => {
            const isCritical = ['critical', 'penalty', 'breach', 'sla breach', 'cve-'].includes(alert.term.toLowerCase());
            const card = document.createElement('div');
            card.className = `alert-card ${isCritical ? 'critical' : 'warning'}`;
            card.innerHTML = `
        <div class="alert-card-content">
          <h4>${isCritical ? 'CRITICAL RISK / LIABILITY CLAUSE' : 'ATTENTION REQUIRED'}</h4>
          <p>"${escapeHtml(alert.sentence)}"</p>
          <span class="alert-card-source">Flagged keyword: ${escapeHtml(alert.term)}</span>
        </div>
      `;
            alertsEl.appendChild(card);
        });
    }
}

function generateFormattedSummaryText(doc, mode) {
    const topSentences = NLP.generateKeySummary(doc.content, 4);
    const risks = NLP.extractRisks(doc.content);
    const metrics = NLP.extractMetrics(doc.content);

    let text = `# AI Summary: ${doc.name}\n`;
    text += `Category: ${doc.category} | Generated: ${new Date().toLocaleString()}\n\n`;
    text += `## Executive Brief\n`;
    text += `${topSentences.slice(0, 2).join(' ')}\n\n`;

    text += `## Core Takeaways\n`;
    topSentences.forEach(s => text += `- ${s}\n`);

    if (risks.length > 0) {
        text += `\n## Risk & Action Alerts\n`;
        risks.forEach(r => text += `* [${r.term.toUpperCase()}] ${r.sentence}\n`);
    }

    if (metrics.length > 0) {
        text += `\n## Extracted Metrics & Financial Figures\n`;
        metrics.forEach(m => text += `- ${m}\n`);
    }

    return text;
}

let toastTimeout = null;
function showAiToast(title, subtitle) {
    const toast = document.getElementById('aiToastBanner');
    if (!toast) return;
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastSubtitle').textContent = subtitle;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

/**
 * EXECUTIVE SYNTHESIS (CROSS-DOCUMENT)
 */
function renderExecutiveSynthesis() {
    const insightsList = document.getElementById('synthesisInsightsList');
    const alertsList = document.getElementById('synthesisAlertsList');
    const metricsGrid = document.getElementById('synthesisMetricsGrid');
    const insightsBadge = document.getElementById('insightsCountBadge');
    const riskBadge = document.getElementById('riskCountBadge');

    insightsList.innerHTML = '';
    alertsList.innerHTML = '';
    metricsGrid.innerHTML = '';

    if (state.documents.length === 0) {
        insightsList.innerHTML = `<div style="color:var(--text-dim); font-size:0.85rem; padding:12px;">No documents loaded. Please add documents to generate executive synthesis.</div>`;
        alertsList.innerHTML = `<div style="color:var(--text-dim); font-size:0.85rem; padding:12px;">No critical risks detected.</div>`;
        return;
    }

    let totalInsights = 0;
    state.documents.forEach(doc => {
        const topSentences = NLP.generateKeySummary(doc.content, 2);
        topSentences.forEach(sentence => {
            totalInsights++;
            const item = document.createElement('div');
            item.className = 'bullet-point-item';
            item.innerHTML = `
        <div class="bullet-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
        <div>
          <div class="bullet-text">${escapeHtml(sentence)}</div>
          <span class="bullet-source">${escapeHtml(doc.name)}</span>
        </div>
      `;
            insightsList.appendChild(item);
        });
    });
    insightsBadge.textContent = `${totalInsights} Key Takeaways`;

    let allRisks = [];
    state.documents.forEach(doc => {
        const docRisks = NLP.extractRisks(doc.content);
        docRisks.forEach(r => {
            allRisks.push({ ...r, docName: doc.name });
        });
    });

    riskBadge.textContent = `${allRisks.length} Detected`;
    if (allRisks.length === 0) {
        alertsList.innerHTML = `<div style="color:var(--accent-emerald); font-size:0.85rem; padding:10px;">✓ All clear — No liabilities, compliance flags, or operational bottlenecks detected.</div>`;
    } else {
        allRisks.slice(0, 5).forEach(alert => {
            const card = document.createElement('div');
            const isCritical = alert.term === 'critical' || alert.term === 'breach' || alert.term === 'penalty' || alert.term === 'cve-';
            card.className = `alert-card ${isCritical ? 'critical' : 'warning'}`;
            card.innerHTML = `
        <div class="alert-card-content">
          <h4>${isCritical ? 'CRITICAL RISK / LIABILITY FLAG' : 'OPERATIONAL ATTENTION REQUIRED'}</h4>
          <p>"${escapeHtml(alert.sentence)}"</p>
          <span class="alert-card-source">Found in: ${escapeHtml(alert.docName)} (Flag: ${alert.term})</span>
        </div>
      `;
            alertsList.appendChild(card);
        });
    }

    const seenMetrics = new Set();
    const extractedFigures = [];

    state.documents.forEach(doc => {
        const metrics = NLP.extractMetrics(doc.content);
        metrics.forEach(m => {
            if (!seenMetrics.has(m) && extractedFigures.length < 6) {
                seenMetrics.add(m);
                const sentences = NLP.splitSentences(doc.content);
                const matchingSentence = sentences.find(s => s.includes(m)) || '';
                const context = matchingSentence.length > 80 ? matchingSentence.slice(0, 80) + '...' : matchingSentence;
                extractedFigures.push({ amount: m, context: context, doc: doc.name });
            }
        });
    });

    if (extractedFigures.length === 0) {
        metricsGrid.innerHTML = `<div style="grid-column: span 2; color:var(--text-dim); font-size:0.85rem;">No numeric or currency metrics detected in the current text corpus.</div>`;
    } else {
        extractedFigures.forEach(fig => {
            const pill = document.createElement('div');
            pill.className = 'extracted-stat-pill';
            pill.innerHTML = `
        <div class="stat-amount">${escapeHtml(fig.amount)}</div>
        <div class="stat-context">${escapeHtml(fig.context)}</div>
        <span style="font-size: 0.68rem; color: var(--text-dim); margin-top: 4px;">Source: ${escapeHtml(fig.doc)}</span>
      `;
            metricsGrid.appendChild(pill);
        });
    }
}

/**
 * ENTITY MATRIX
 */
function renderEntityMatrix() {
    const container = document.getElementById('entityMatrixTags');
    container.innerHTML = '';

    if (state.documents.length === 0) {
        container.innerHTML = `<div style="color:var(--text-dim); font-size:0.85rem;">Upload documents to view extracted entity matrix.</div>`;
        return;
    }

    const allMetrics = new Set();
    const allDates = new Set();
    const allOrgs = new Set();

    state.documents.forEach(doc => {
        NLP.extractMetrics(doc.content).forEach(m => allMetrics.add(m));
        NLP.extractDates(doc.content).forEach(d => allDates.add(d));

        const orgMatches = doc.content.match(/\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*(?:\s*(?:Corp|Inc|LLC|Group|Enterprises|Committee|Labs|AWS|Nvidia|SOC2|ISO|GDPR))?)\b/g) || [];
        orgMatches.forEach(o => {
            if (o.length > 3 && !['Executive', 'Summary', 'Section', 'Date', 'Author', 'Parties', 'Client', 'Total'].includes(o)) {
                allOrgs.add(o);
            }
        });
    });

    Array.from(allMetrics).slice(0, 8).forEach(m => {
        const badge = document.createElement('span');
        badge.className = 'entity-badge money';
        badge.innerHTML = `💰 ${escapeHtml(m)}`;
        container.appendChild(badge);
    });

    Array.from(allDates).slice(0, 8).forEach(d => {
        const badge = document.createElement('span');
        badge.className = 'entity-badge date';
        badge.innerHTML = `📅 ${escapeHtml(d)}`;
        container.appendChild(badge);
    });

    Array.from(allOrgs).slice(0, 10).forEach(org => {
        const badge = document.createElement('span');
        badge.className = 'entity-badge org';
        badge.innerHTML = `🏢 ${escapeHtml(org)}`;
        container.appendChild(badge);
    });
}

/**
 * CHARTS VISUALIZATION
 */
function renderCharts() {
    if (!window.Chart || state.documents.length === 0) return;

    const categoryCounts = {};
    state.documents.forEach(d => {
        categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });

    const catCtx = document.getElementById('categoryChart').getContext('2d');
    if (state.charts.category) state.charts.category.destroy();

    state.charts.category = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryCounts),
            datasets: [{
                data: Object.values(categoryCounts),
                backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
                }
            }
        }
    });

    const sentimentCounts = { 'Healthy / Low Risk': 0, 'Caution / Moderate': 0, 'High Risk / Alert': 0 };
    state.documents.forEach(d => {
        const sent = NLP.analyzeSentiment(d.content);
        if (sent.class === 'risk-low') sentimentCounts['Healthy / Low Risk']++;
        else if (sent.class === 'risk-med') sentimentCounts['Caution / Moderate']++;
        else sentimentCounts['High Risk / Alert']++;
    });

    const sentCtx = document.getElementById('sentimentChart').getContext('2d');
    if (state.charts.sentiment) state.charts.sentiment.destroy();

    state.charts.sentiment = new Chart(sentCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(sentimentCounts),
            datasets: [{
                label: 'Documents',
                data: Object.values(sentimentCounts),
                backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: '#64748b' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/**
 * SMART Q&A QUERY
 */
function initQA() {
    const input = document.getElementById('qaInputQuery');
    const submitBtn = document.getElementById('btnSubmitQA');

    submitBtn.addEventListener('click', () => executeQA(input.value));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeQA(input.value);
    });

    document.querySelectorAll('.preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            input.value = query;
            executeQA(query);
        });
    });
}

function executeQA(query) {
    if (!query || query.trim().length === 0) return;
    if (state.documents.length === 0) {
        alert('Please load or upload documents before querying.');
        return;
    }

    const qTokens = NLP.tokenize(query);
    const container = document.getElementById('qaResponseContainer');
    const answerText = document.getElementById('qaAnswerText');
    const citationsGrid = document.getElementById('qaCitationsGrid');

    const candidateSentences = [];

    state.documents.forEach(doc => {
        const sentences = NLP.splitSentences(doc.content);
        sentences.forEach(sentence => {
            const sTokens = NLP.tokenize(sentence);
            let matchCount = 0;
            qTokens.forEach(t => {
                if (sTokens.includes(t)) matchCount++;
                if (sentence.toLowerCase().includes(t)) matchCount += 0.5;
            });
            if (matchCount > 0) {
                candidateSentences.push({
                    sentence,
                    score: matchCount / (Math.sqrt(sTokens.length) + 1),
                    docName: doc.name
                });
            }
        });
    });

    candidateSentences.sort((a, b) => b.score - a.score);
    const topCitations = candidateSentences.slice(0, 4);

    container.style.display = 'flex';
    citationsGrid.innerHTML = '';

    if (topCitations.length === 0) {
        answerText.innerHTML = `No direct statements matching "<strong>${escapeHtml(query)}</strong>" were identified in the corpus. Try querying for specific financial metrics, dates, or liability terms.`;
        return;
    }

    const synthesizedSummary = topCitations.map(c => c.sentence).join(' ');
    answerText.innerHTML = `Based on a cross-document scan of ${state.documents.length} materials, here is the synthesized intelligence: <br><br><strong>Key Findings:</strong> ${escapeHtml(synthesizedSummary)}`;

    topCitations.forEach(c => {
        const card = document.createElement('div');
        card.className = 'citation-card';
        card.innerHTML = `
      <div class="citation-source-name">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        ${escapeHtml(c.docName)}
      </div>
      <div class="citation-quote">"${escapeHtml(c.sentence)}"</div>
    `;
        citationsGrid.appendChild(card);
    });
}

/**
 * GLOBAL DEEP SEARCH
 */
function initSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    const searchBtn = document.getElementById('btnRunSearch');

    searchBtn.addEventListener('click', executeSearch);
    searchInput.addEventListener('input', executeSearch);
}

function updateSearchDropdown() {
    const scope = document.getElementById('searchDocScope');
    if (!scope) return;
    scope.innerHTML = '<option value="all">Scope: All Documents</option>';
    state.documents.forEach(doc => {
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = doc.name;
        scope.appendChild(opt);
    });
}

function executeSearch() {
    const query = document.getElementById('globalSearchInput').value.trim();
    const scopeId = document.getElementById('searchDocScope').value;
    const caseSensitive = document.getElementById('searchMatchExact').checked;
    const container = document.getElementById('searchResultsContainer');

    container.innerHTML = '';

    if (!query) {
        container.innerHTML = `<div style="color:var(--text-dim); font-size:0.85rem; padding:12px;">Type a keyword or phrase above to search across all indexed files simultaneously.</div>`;
        return;
    }

    const targetDocs = scopeId === 'all'
        ? state.documents
        : state.documents.filter(d => d.id === scopeId);

    let totalMatches = 0;

    targetDocs.forEach(doc => {
        const sentences = NLP.splitSentences(doc.content);
        sentences.forEach(sentence => {
            let hasMatch = false;
            let regex;
            try {
                regex = new RegExp(escapeRegExp(query), caseSensitive ? 'g' : 'gi');
                hasMatch = regex.test(sentence);
            } catch (e) {
                hasMatch = sentence.toLowerCase().includes(query.toLowerCase());
            }

            if (hasMatch) {
                totalMatches++;
                const highlighted = sentence.replace(regex, match => `<span class="highlight-match">${escapeHtml(match)}</span>`);

                const card = document.createElement('div');
                card.className = 'search-result-card';
                card.innerHTML = `
          <div class="result-doc-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            ${escapeHtml(doc.name)} (${doc.category})
          </div>
          <div class="result-snippet">${highlighted}</div>
        `;
                container.appendChild(card);
            }
        });
    });

    if (totalMatches === 0) {
        container.innerHTML = `<div style="color:var(--text-dim); font-size:0.85rem; padding:12px;">No matches found for "${escapeHtml(query)}".</div>`;
    }
}

/**
 * CROSS-DOCUMENT COMPARATOR
 */
function initComparator() {
    document.getElementById('btnExecuteCompare').addEventListener('click', executeCompare);
}

function populateCompareDropdowns() {
    const selectA = document.getElementById('compareSelectA');
    const selectB = document.getElementById('compareSelectB');

    selectA.innerHTML = '';
    selectB.innerHTML = '';

    state.documents.forEach((d, index) => {
        const optA = document.createElement('option');
        optA.value = d.id;
        optA.textContent = d.name;
        if (index === 0) optA.selected = true;
        selectA.appendChild(optA);

        const optB = document.createElement('option');
        optB.value = d.id;
        optB.textContent = d.name;
        if (index === 1 || (index === 0 && state.documents.length === 1)) optB.selected = true;
        selectB.appendChild(optB);
    });
}

function executeCompare() {
    const idA = document.getElementById('compareSelectA').value;
    const idB = document.getElementById('compareSelectB').value;

    const docA = state.documents.find(d => d.id === idA);
    const docB = state.documents.find(d => d.id === idB);

    if (!docA || !docB) {
        alert('Please select two valid documents to compare.');
        return;
    }

    document.getElementById('compareTitleA').textContent = docA.name + ` (${docA.category})`;
    document.getElementById('compareTitleB').textContent = docB.name + ` (${docB.category})`;

    const summaryA = NLP.generateKeySummary(docA.content, 3).map(s => `<li>${escapeHtml(s)}</li>`).join('');
    const metricsA = NLP.extractMetrics(docA.content).join(', ') || 'None';
    const risksA = NLP.extractRisks(docA.content).length;

    document.getElementById('compareBodyA').innerHTML = `
    <div style="margin-bottom: 12px;">
      <strong style="color: #818cf8;">Executive Takeaways:</strong>
      <ul style="padding-left: 20px; margin-top: 6px;">${summaryA}</ul>
    </div>
    <div style="margin-bottom: 8px;"><strong>Financial & Numeric Entities:</strong> ${escapeHtml(metricsA)}</div>
    <div><strong>Risk / Liability Flags:</strong> ${risksA} items flagged</div>
  `;

    const summaryB = NLP.generateKeySummary(docB.content, 3).map(s => `<li>${escapeHtml(s)}</li>`).join('');
    const metricsB = NLP.extractMetrics(docB.content).join(', ') || 'None';
    const risksB = NLP.extractRisks(docB.content).length;

    document.getElementById('compareBodyB').innerHTML = `
    <div style="margin-bottom: 12px;">
      <strong style="color: #38bdf8;">Executive Takeaways:</strong>
      <ul style="padding-left: 20px; margin-top: 6px;">${summaryB}</ul>
    </div>
    <div style="margin-bottom: 8px;"><strong>Financial & Numeric Entities:</strong> ${escapeHtml(metricsB)}</div>
    <div><strong>Risk / Liability Flags:</strong> ${risksB} items flagged</div>
  `;
}

/**
 * MODAL DIALOGS & EXPORTS
 */
function initModals() {
    const pasteModal = document.getElementById('pasteModal');
    document.getElementById('btnPasteText').addEventListener('click', () => {
        document.getElementById('pasteDocTitle').value = '';
        document.getElementById('pasteDocContent').value = '';
        pasteModal.classList.add('open');
    });
    document.getElementById('closePasteModal').addEventListener('click', () => pasteModal.classList.remove('open'));
    document.getElementById('cancelPasteModal').addEventListener('click', () => pasteModal.classList.remove('open'));

    document.getElementById('savePasteDoc').addEventListener('click', () => {
        const title = document.getElementById('pasteDocTitle').value.trim() || 'Pasted_Document_' + (state.documents.length + 1) + '.txt';
        const category = document.getElementById('pasteDocCategory').value;
        const content = document.getElementById('pasteDocContent').value.trim();

        if (!content) {
            alert('Please enter or paste document content.');
            return;
        }

        const newDoc = {
            id: 'doc-paste-' + Date.now(),
            name: title,
            category: category,
            content: content,
            dateAdded: new Date()
        };

        addDocumentToState(newDoc);
        state.activeDocId = newDoc.id;
        pasteModal.classList.remove('open');
        recalculateAll();

        showAiToast('AI Ingestion Complete', `Synthesized pasted notes for "${title}"`);
        switchToTab('docsummary');
    });

    const viewModal = document.getElementById('viewDocModal');
    document.getElementById('closeViewModal').addEventListener('click', () => viewModal.classList.remove('open'));
    document.getElementById('doneViewModal').addEventListener('click', () => viewModal.classList.remove('open'));

    document.getElementById('btnExportReport').addEventListener('click', exportSynthesisBrief);
}

function openDocumentViewer(doc) {
    const modal = document.getElementById('viewDocModal');
    document.getElementById('viewModalTitle').textContent = doc.name;
    document.getElementById('viewModalMeta').textContent = `Category: ${doc.category}`;
    const words = doc.content.split(/\s+/).filter(Boolean).length;
    document.getElementById('viewModalStats').textContent = `${words.toLocaleString()} words`;
    document.getElementById('viewModalContent').textContent = doc.content;
    modal.classList.add('open');
}

function exportSynthesisBrief() {
    if (state.documents.length === 0) {
        alert('Please add documents before generating an export brief.');
        return;
    }

    let report = `# OmniDoc AI — Consolidated Executive Briefing Report\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Total Documents Processed: ${state.documents.length}\n\n`;

    report += `## 1. Executive Summary & Core Insights\n`;
    state.documents.forEach(doc => {
        report += `### Document: ${doc.name} (${doc.category})\n`;
        const summary = NLP.generateKeySummary(doc.content, 2);
        summary.forEach(s => report += `- ${s}\n`);
        report += `\n`;
    });

    report += `## 2. Critical Risks, Deadlines & Action Items\n`;
    state.documents.forEach(doc => {
        const risks = NLP.extractRisks(doc.content);
        if (risks.length > 0) {
            report += `From [${doc.name}]:\n`;
            risks.forEach(r => report += `  * [${r.term.toUpperCase()}] ${r.sentence}\n`);
        }
    });

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniDoc_Synthesis_Report_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * SANITIZATION HELPERS
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
