/* ==========================================================================
   FINTRAC — AICTE Regulation Bureau Command Centre Controller
   ========================================================================== */

const FINTRAC_ADMIN = {
  init() {
    this.renderStats();
    this.renderFinancialOverview();
    this.renderMaturityBuckets();
    this.renderRecentActivities();
    this.renderPendingActions();
    this.renderInstitutionMonitoring();
  },

  // Render Headline Metric Cards
  renderStats() {
    const fdrs = FINTRAC_STORAGE.getFDRs();
    const releases = FINTRAC_STORAGE.getReleaseRequests();
    const verifications = FINTRAC_STORAGE.getVerificationQueue();

    // Calculate real dynamic counts from storage to combine with macro institutional totals
    const expiringCount = fdrs.filter(f => f.maturityInfo.category === 'Expiring Soon' || f.maturityInfo.category === 'Matured').length;
    const pendingVerifCount = fdrs.filter(f => f.verificationStatus === 'Under Verification' || f.verificationStatus === 'Awaiting Review').length;
    const pendingReleaseCount = releases.filter(r => r.status === 'Release Under Review').length;

    // Elements
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('stat-total-inst', '1,248');
    setVal('stat-active-instruments', '3,860');
    setVal('stat-total-deposit-value', '₹245 Crore');
    setVal('stat-expiring-soon', String(42 + expiringCount));
    setVal('stat-pending-verification', String(28 + pendingVerifCount));
    setVal('stat-pending-release', String(16 + pendingReleaseCount));
  },

  // Financial Overview breakdown
  renderFinancialOverview() {
    const fdrs = FINTRAC_STORAGE.getFDRs();

    let activeSum = 0, maturedSum = 0, releasedSum = 0;
    let activeCount = 0, maturedCount = 0, releasedCount = 0;

    fdrs.forEach(f => {
      const cat = f.maturityInfo.category;
      if (f.lifecycleStatus === 'Released in Demo') {
        releasedSum += f.amount;
        releasedCount++;
      } else if (cat === 'Matured') {
        maturedSum += f.amount;
        maturedCount++;
      } else {
        activeSum += f.amount;
        activeCount++;
      }
    });

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('fin-active-sum', FINTRAC_APP.formatCurrency(activeSum, true));
    setVal('fin-active-count', `${activeCount} Instruments`);
    setVal('fin-matured-sum', FINTRAC_APP.formatCurrency(maturedSum, true));
    setVal('fin-matured-count', `${maturedCount} Overdue/Matured`);
    setVal('fin-released-sum', FINTRAC_APP.formatCurrency(releasedSum, true));
    setVal('fin-released-count', `${releasedCount} Released`);
  },

  // Maturity Monitoring Buckets
  renderMaturityBuckets() {
    const fdrs = FINTRAC_STORAGE.getFDRs();

    const due30 = fdrs.filter(f => f.maturityInfo.daysRemaining <= 30 && f.maturityInfo.daysRemaining >= 0 && f.lifecycleStatus !== 'Released in Demo');
    const due60 = fdrs.filter(f => f.maturityInfo.daysRemaining > 30 && f.maturityInfo.daysRemaining <= 60 && f.lifecycleStatus !== 'Released in Demo');
    const due90 = fdrs.filter(f => f.maturityInfo.daysRemaining > 60 && f.maturityInfo.daysRemaining <= 90 && f.lifecycleStatus !== 'Released in Demo');
    const matured = fdrs.filter(f => f.maturityInfo.category === 'Matured' && f.lifecycleStatus !== 'Released in Demo');

    const setEl = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };

    setEl('count-due-30', due30.length);
    setEl('count-due-60', due60.length);
    setEl('count-due-90', due90.length);
    setEl('count-matured', matured.length);

    // Populate rapid maturity preview table
    const tableBody = document.getElementById('maturity-preview-tbody');
    if (tableBody) {
      const combined = [...matured, ...due30, ...due60].slice(0, 5);
      tableBody.innerHTML = combined.map(f => `
        <tr>
          <td>
            <span class="primary-text font-mono">${f.referenceNumber}</span>
            <span class="sub-text">${f.institutionName}</span>
          </td>
          <td>${f.issuingBank}</td>
          <td class="font-mono fw-bold">${FINTRAC_APP.formatCurrency(f.amount, true)}</td>
          <td>${FINTRAC_APP.formatDate(f.maturityDate)}</td>
          <td><span class="badge ${f.maturityInfo.badgeClass}">${f.maturityInfo.label}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="FINTRAC_FDR.openDetailsModal('${f.id}')">Inspect</button>
          </td>
        </tr>
      `).join('');
    }
  },

  // Recent Activities
  renderRecentActivities() {
    const container = document.getElementById('recent-activities-list');
    if (!container) return;

    const audit = FINTRAC_STORAGE.getAuditHistory().slice(0, 6);
    container.innerHTML = audit.map(a => `
      <div style="display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--border-light); align-items: flex-start;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-peach-light); border: 1px solid var(--color-olive); color: var(--color-forest); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.8rem; font-weight: 700;">
          ${a.role.startsWith('AICTE') ? 'AC' : (a.role.startsWith('Inst') ? 'IN' : 'RV')}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 700; font-size: 0.88rem; color: var(--color-navy);">${a.action}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${a.timestamp}</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">${a.remarks}</p>
          <div style="display: flex; gap: 8px; font-size: 0.74rem;">
            <span class="badge badge-navy">${a.fdrReference}</span>
            <span class="badge badge-olive">${a.role}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  // Pending Actions
  renderPendingActions() {
    const container = document.getElementById('pending-actions-list');
    if (!container) return;

    const fdrs = FINTRAC_STORAGE.getFDRs();
    const pendingItems = [];

    fdrs.forEach(f => {
      if (f.lifecycleStatus === 'Discrepancy Identified') {
        pendingItems.push({
          title: `Discrepancy: ${f.referenceNumber}`,
          desc: f.discrepancyNotes || 'Scrutiny observation logged. Action needed.',
          badge: 'Discrepancy',
          badgeClass: 'badge-terracotta',
          fdrId: f.id
        });
      } else if (f.lifecycleStatus === 'Renewal Required' || f.maturityInfo.category === 'Matured') {
        pendingItems.push({
          title: `Renewal Overdue: ${f.referenceNumber}`,
          desc: `${f.institutionName} — Matured on ${FINTRAC_APP.formatDate(f.maturityDate)}`,
          badge: 'Matured',
          badgeClass: 'badge-terracotta',
          fdrId: f.id
        });
      } else if (f.verificationStatus === 'Under Verification') {
        pendingItems.push({
          title: `Verification Queue: ${f.referenceNumber}`,
          desc: `Submitted by ${f.institutionName} on ${FINTRAC_APP.formatDate(f.uploadDate)}`,
          badge: 'Review Pending',
          badgeClass: 'badge-olive',
          fdrId: f.id
        });
      }
    });

    if (pendingItems.length === 0) {
      container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); padding: 12px 0;">All action items cleared.</p>';
      return;
    }

    container.innerHTML = pendingItems.slice(0, 5).map(item => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-card-subtle); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 8px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 700; font-size: 0.88rem; color: var(--color-navy);">${item.title}</span>
            <span class="badge ${item.badgeClass}">${item.badge}</span>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${item.desc}</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="FINTRAC_FDR.openDetailsModal('${item.fdrId}')">Take Action</button>
      </div>
    `).join('');
  },

  // Institution Monitoring Table
  renderInstitutionMonitoring() {
    const tbody = document.getElementById('institutions-table-body');
    if (!tbody) return;

    const institutions = FINTRAC_STORAGE.getInstitutions();
    const fdrs = FINTRAC_STORAGE.getFDRs();

    tbody.innerHTML = institutions.map(inst => {
      const instFdrs = fdrs.filter(f => f.institutionId === inst.id);
      const activeCount = instFdrs.filter(f => f.lifecycleStatus !== 'Released in Demo').length;
      const expiringCount = instFdrs.filter(f => f.maturityInfo.category === 'Expiring Soon' || f.maturityInfo.category === 'Matured').length;
      const pendingRequests = instFdrs.filter(f => f.lifecycleStatus === 'Renewal Submitted' || f.lifecycleStatus === 'Release Requested').length;

      let statusBadge = '<span class="badge badge-active"><span class="badge-dot"></span>Compliant</span>';
      if (expiringCount > 0) {
        statusBadge = '<span class="badge badge-terracotta"><span class="badge-dot"></span>Action Req</span>';
      } else if (pendingRequests > 0) {
        statusBadge = '<span class="badge badge-olive"><span class="badge-dot"></span>Under Review</span>';
      }

      return `
        <tr>
          <td>
            <span class="primary-text fw-bold">${inst.name}</span>
            <span class="sub-text">${inst.city}, ${inst.state} • ${inst.type}</span>
          </td>
          <td>
            <span class="primary-text font-mono">${inst.id}</span>
            <span class="sub-text">${inst.approvalRef}</span>
          </td>
          <td class="text-center font-mono">${instFdrs.length}</td>
          <td class="text-center font-mono fw-bold">${activeCount}</td>
          <td class="text-center font-mono ${expiringCount > 0 ? 'text-terracotta fw-bold' : ''}">${expiringCount}</td>
          <td class="text-center font-mono">${pendingRequests}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }
};
