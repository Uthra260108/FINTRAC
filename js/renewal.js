/* ==========================================================================
   FINTRAC — Renewal and Replacement Module Controller
   ========================================================================== */

const FINTRAC_RENEWAL = {
  init() {
    this.renderRenewalHistory();
    this.initRenewalForm();
  },

  // Populate form with original FDR if passed in query string or dropdown
  initRenewalForm() {
    const originalSelect = document.getElementById('renewal-original-ref');
    if (!originalSelect) return;

    const fdrs = FINTRAC_STORAGE.getFDRs();
    const user = FINTRAC_AUTH.getCurrentUser();

    let eligibleFdrs = fdrs;
    if (user && user.roleKey === 'institution' && user.institutionId) {
      eligibleFdrs = fdrs.filter(f => f.institutionId === user.institutionId);
    }

    // Filter to instruments that are eligible for renewal (matured, expiring, or active)
    eligibleFdrs = eligibleFdrs.filter(f => f.lifecycleStatus !== 'Released in Demo' && f.lifecycleStatus !== 'Renewed');

    originalSelect.innerHTML = '<option value="">-- Select Expiring / Matured FDR --</option>' +
      eligibleFdrs.map(f => `
        <option value="${f.referenceNumber}">
          ${f.referenceNumber} (${f.issuingBank} • ${FINTRAC_APP.formatCurrency(f.amount, true)} • Due: ${FINTRAC_APP.formatDate(f.maturityDate)})
        </option>
      `).join('');

    // Check URL parameters for preselected ref
    const params = new URLSearchParams(window.location.search);
    const prefillRef = params.get('ref');
    if (prefillRef) {
      originalSelect.value = prefillRef;
      this.onOriginalSelect(prefillRef);
    }

    originalSelect.addEventListener('change', (e) => {
      this.onOriginalSelect(e.target.value);
    });

    // Form submission
    const form = document.getElementById('renewal-submission-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitRenewalForm();
      });
    }
  },

  onOriginalSelect(ref) {
    const fdr = FINTRAC_STORAGE.getFDRById(ref);
    const infoBox = document.getElementById('original-fdr-info-card');
    if (!fdr || !infoBox) {
      if (infoBox) infoBox.style.display = 'none';
      return;
    }

    infoBox.style.display = 'block';
    infoBox.innerHTML = `
      <div style="padding: 14px 18px; background: var(--color-peach-light); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); margin-bottom: 20px;">
        <h5 style="color: var(--color-navy); margin-bottom: 8px;">Original Instrument Snapshot</h5>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; font-size: 0.84rem;">
          <div><strong>FDR Reference:</strong> <span class="font-mono">${fdr.referenceNumber}</span></div>
          <div><strong>Bank:</strong> ${fdr.issuingBank}</div>
          <div><strong>Existing Amount:</strong> ${FINTRAC_APP.formatCurrency(fdr.amount)}</div>
          <div><strong>Maturity Date:</strong> ${FINTRAC_APP.formatDate(fdr.maturityDate)} (${fdr.maturityInfo.label})</div>
        </div>
      </div>
    `;

    // Prefill some fields for convenience
    const bankInput = document.getElementById('renewal-new-bank');
    const amountInput = document.getElementById('renewal-new-amount');
    if (bankInput && !bankInput.value) bankInput.value = fdr.issuingBank;
    if (amountInput && !amountInput.value) amountInput.value = fdr.amount;
  },

  // Submit Renewal
  submitRenewalForm() {
    const originalRef = document.getElementById('renewal-original-ref').value;
    const newRef = document.getElementById('renewal-new-ref').value.trim();
    const newBank = document.getElementById('renewal-new-bank').value.trim();
    const amount = parseFloat(document.getElementById('renewal-new-amount').value);
    const newIssueDate = document.getElementById('renewal-new-issue-date').value;
    const newMaturityDate = document.getElementById('renewal-new-maturity-date').value;
    const remarks = document.getElementById('renewal-remarks').value.trim();

    const originalFDR = FINTRAC_STORAGE.getFDRById(originalRef);

    if (!originalRef || !newRef || !newBank || isNaN(amount) || !newIssueDate || !newMaturityDate) {
      FINTRAC_APP.showToast('Validation Error', 'Please complete all required fields.', 'error');
      return;
    }

    if (new Date(newMaturityDate) <= new Date(newIssueDate)) {
      FINTRAC_APP.showToast('Date Error', 'Replacement maturity date must be later than the issue date.', 'error');
      return;
    }

    const renewalData = {
      originalFdrRef: originalRef,
      newFdrRef: newRef,
      institutionId: originalFDR?.institutionId || 'INST-AICTE-1001',
      institutionName: originalFDR?.institutionName || 'Maharashtra Institute of Technology (MIT-WPU)',
      originalBank: originalFDR?.issuingBank || 'Unknown',
      newBank: newBank,
      depositAmount: amount,
      originalMaturityDate: originalFDR?.maturityDate || '',
      newIssueDate: newIssueDate,
      newMaturityDate: newMaturityDate,
      replacementDocName: `${newBank.replace(/\s+/g, '_')}_Renewal_${newRef}.pdf`,
      remarks: remarks || 'Replacement renewal submitted by institution.'
    };

    FINTRAC_STORAGE.submitRenewal(renewalData);
    FINTRAC_APP.showToast('Renewal Submitted', `Replacement instrument ${newRef} queued for regulatory scrutiny.`, 'success');

    this.renderRenewalHistory();
    document.getElementById('renewal-submission-form').reset();
    const infoBox = document.getElementById('original-fdr-info-card');
    if (infoBox) infoBox.style.display = 'none';
  },

  // Render Renewal History Table
  renderRenewalHistory() {
    const tbody = document.getElementById('renewal-history-tbody');
    if (!tbody) return;

    const list = FINTRAC_STORAGE.getRenewals();

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <h4>No Renewal Records Found</h4>
              <p>No replacement FDR submissions have been recorded in this session.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr>
        <td>
          <span class="primary-text font-mono">${r.newFdrRef}</span>
          <span class="sub-text">Replaces: <strong class="font-mono">${r.originalFdrRef}</strong></span>
        </td>
        <td>
          <span class="primary-text">${r.newBank}</span>
          <span class="sub-text">${r.institutionName}</span>
        </td>
        <td class="font-mono fw-bold">${FINTRAC_APP.formatCurrency(r.depositAmount, true)}</td>
        <td>
          <span class="primary-text">${FINTRAC_APP.formatDate(r.newMaturityDate)}</span>
          <span class="sub-text">Issued: ${FINTRAC_APP.formatDate(r.newIssueDate)}</span>
        </td>
        <td>
          <span class="badge ${r.status === 'Approved in Demo' ? 'badge-forest' : (r.status === 'Rejected in Demo' ? 'badge-terracotta' : 'badge-olive')}">
            <span class="badge-dot"></span>${r.status}
          </span>
        </td>
        <td style="max-width: 220px; font-size: 0.8rem; color: var(--text-secondary);">
          ${r.remarks}
        </td>
        <td>
          <div class="d-flex gap-8">
            <button class="btn btn-secondary btn-sm" onclick="FINTRAC_RENEWAL.openRenewalActionModal('${r.id}')">
              Review Action
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  // Admin/Reviewer Renewal Decision Modal
  openRenewalActionModal(renewalId) {
    const list = FINTRAC_STORAGE.getRenewals();
    const item = list.find(r => r.id === renewalId);
    if (!item) return;

    const modalTitle = document.getElementById('renewal-action-modal-title');
    const modalBody = document.getElementById('renewal-action-modal-body');
    if (!modalBody) return;

    if (modalTitle) modalTitle.textContent = `Renewal Scrutiny: ${item.newFdrRef}`;

    modalBody.innerHTML = `
      <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 20px;">
        <h5 style="color: var(--color-navy); margin-bottom: 10px;">Replacement Instrument Relationship</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
          <div><strong>Original Instrument:</strong> <span class="font-mono">${item.originalFdrRef}</span> (${item.originalBank})</div>
          <div><strong>Replacement Instrument:</strong> <span class="font-mono">${item.newFdrRef}</span> (${item.newBank})</div>
          <div><strong>Deposit Amount:</strong> ${FINTRAC_APP.formatCurrency(item.depositAmount)}</div>
          <div><strong>New Maturity Horizon:</strong> ${FINTRAC_APP.formatDate(item.newMaturityDate)}</div>
          <div style="grid-column: span 2;"><strong>Institution:</strong> ${item.institutionName}</div>
          <div style="grid-column: span 2;"><strong>Submitted Remarks:</strong> ${item.remarks}</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="renewal-admin-remarks">Administrative Scrutiny Notes & Justification <span class="required">*</span></label>
        <textarea id="renewal-admin-remarks" class="form-control" rows="3" placeholder="Enter administrative observations or reason for determination...">${item.adminRemarks || 'Joint lien continuity verified in prototype demonstration.'}</textarea>
      </div>

      <div style="background: var(--color-peach-light); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--color-navy); border: 1px solid var(--color-peach-border);">
        *Prototype Demonstration Action: Status update modifies local state and generates an immutable audit entry.
      </div>
    `;

    // Hook buttons
    const approveBtn = document.getElementById('btn-approve-renewal');
    const rejectBtn = document.getElementById('btn-reject-renewal');

    if (approveBtn) {
      approveBtn.onclick = () => {
        const notes = document.getElementById('renewal-admin-remarks')?.value || 'Approved in simulated review.';
        FINTRAC_STORAGE.updateRenewalStatus(item.id, 'Approved in Demo', notes);
        FINTRAC_APP.closeModal('renewal-action-modal');
        FINTRAC_APP.showToast('Renewal Approved', `Replacement FDR ${item.newFdrRef} approved in demo.`, 'success');
        this.renderRenewalHistory();
      };
    }

    if (rejectBtn) {
      rejectBtn.onclick = () => {
        const notes = document.getElementById('renewal-admin-remarks')?.value || 'Rejected in scrutiny.';
        FINTRAC_STORAGE.updateRenewalStatus(item.id, 'Rejected in Demo', notes);
        FINTRAC_APP.closeModal('renewal-action-modal');
        FINTRAC_APP.showToast('Renewal Rejected', `Renewal marked as rejected in demo.`, 'warning');
        this.renderRenewalHistory();
      };
    }

    FINTRAC_APP.openModal('renewal-action-modal');
  }
};
