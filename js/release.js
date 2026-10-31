/* ==========================================================================
   FINTRAC — Security Deposit Release & Refund Workflow Controller
   ========================================================================== */

const FINTRAC_RELEASE = {
  init() {
    this.renderRequestsTable();
    this.initRequestForm();
  },

  // Initialize institution request form
  initRequestForm() {
    const fdrSelect = document.getElementById('release-fdr-select');
    if (!fdrSelect) return;

    const fdrs = FINTRAC_STORAGE.getFDRs();
    const user = FINTRAC_AUTH.getCurrentUser();

    let eligible = fdrs.filter(f => f.lifecycleStatus !== 'Released in Demo');
    if (user && user.roleKey === 'institution' && user.institutionId) {
      eligible = eligible.filter(f => f.institutionId === user.institutionId);
    }

    fdrSelect.innerHTML = '<option value="">-- Choose FDR to Release / Refund --</option>' +
      eligible.map(f => `
        <option value="${f.referenceNumber}">
          ${f.referenceNumber} (${f.issuingBank} • ${FINTRAC_APP.formatCurrency(f.amount, true)} • Current: ${f.lifecycleStatus})
        </option>
      `).join('');

    const form = document.getElementById('release-request-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitReleaseRequest();
      });
    }
  },

  submitReleaseRequest() {
    const fdrRef = document.getElementById('release-fdr-select').value;
    const reqType = document.getElementById('release-type').value;
    const reason = document.getElementById('release-reason').value.trim();
    const remarks = document.getElementById('release-remarks').value.trim();

    if (!fdrRef || !reqType || !reason) {
      FINTRAC_APP.showToast('Validation Error', 'Please select an FDR, request type, and enter a valid reason.', 'error');
      return;
    }

    const fdr = FINTRAC_STORAGE.getFDRById(fdrRef);

    const requestData = {
      fdrReferenceNumber: fdrRef,
      institutionId: fdr?.institutionId || 'INST-AICTE-1001',
      institutionName: fdr?.institutionName || 'Maharashtra Institute of Technology (MIT-WPU)',
      requestType: reqType,
      depositAmount: fdr?.amount || 0,
      reason: reason,
      supportingDocName: `Release_Petition_${fdrRef.replace(/\s+/g, '_')}.pdf`,
      remarks: remarks || 'Formal release petition submitted with council clearance justification.',
      reviewerObservation: 'Pending scrutiny by AICTE Regulation Bureau.'
    };

    FINTRAC_STORAGE.submitReleaseRequest(requestData);
    FINTRAC_APP.showToast('Release Petition Filed', `Petition for FDR ${fdrRef} registered.`, 'success');

    this.renderRequestsTable();
    document.getElementById('release-request-form').reset();
  },

  // Render Table
  renderRequestsTable() {
    const tbody = document.getElementById('release-requests-tbody');
    if (!tbody) return;

    const list = FINTRAC_STORAGE.getReleaseRequests();

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <h4>No Release Petitions Logged</h4>
              <p>There are no active release or refund requests on record.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(req => {
      let badgeCls = 'badge-olive';
      if (req.status === 'Released in Demo') badgeCls = 'badge-forest';
      if (req.status === 'Rejected in Demo') badgeCls = 'badge-terracotta';

      return `
        <tr>
          <td>
            <span class="primary-text font-mono">${req.fdrReferenceNumber}</span>
            <span class="sub-text">${req.institutionName}</span>
          </td>
          <td>
            <span class="primary-text">${req.requestType}</span>
            <span class="sub-text">Filed: ${FINTRAC_APP.formatDate(req.requestDate)}</span>
          </td>
          <td class="font-mono fw-bold">${FINTRAC_APP.formatCurrency(req.depositAmount, true)}</td>
          <td style="max-width: 200px; font-size: 0.8rem; color: var(--text-secondary);">
            ${req.reason}
          </td>
          <td>
            <span class="badge ${badgeCls}"><span class="badge-dot"></span>${req.status}</span>
          </td>
          <td style="max-width: 200px; font-size: 0.8rem; color: var(--text-muted); font-style: italic;">
            "${req.reviewerObservation || 'Pending scrutiny'}"
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="FINTRAC_RELEASE.openDecisionModal('${req.id}')">
              Review Case
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // Admin Decision Modal
  openDecisionModal(reqId) {
    const list = FINTRAC_STORAGE.getReleaseRequests();
    const item = list.find(r => r.id === reqId);
    if (!item) return;

    const modalTitle = document.getElementById('release-decision-modal-title');
    const modalBody = document.getElementById('release-decision-modal-body');
    if (!modalBody) return;

    if (modalTitle) modalTitle.textContent = `Release Case Scrutiny: ${item.fdrReferenceNumber}`;

    modalBody.innerHTML = `
      <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
          <div><strong>FDR Reference:</strong> <span class="font-mono">${item.fdrReferenceNumber}</span></div>
          <div><strong>Deposit Principal:</strong> ${FINTRAC_APP.formatCurrency(item.depositAmount)}</div>
          <div><strong>Petition Type:</strong> ${item.requestType}</div>
          <div><strong>Petition Date:</strong> ${FINTRAC_APP.formatDate(item.requestDate)}</div>
          <div style="grid-column: span 2;"><strong>Institution:</strong> ${item.institutionName}</div>
          <div style="grid-column: span 2;"><strong>Official Justification:</strong> ${item.reason}</div>
          <div style="grid-column: span 2;">
            <strong>Attached Council Clearance:</strong>
            <a href="javascript:void(0)" onclick="FINTRAC_FDR.previewDocument('${item.supportingDocName}')" style="text-decoration: underline;">
              📄 ${item.supportingDocName}
            </a>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="release-decision-notes">Regulatory Scrutiny Observations & Orders <span class="required">*</span></label>
        <textarea id="release-decision-notes" class="form-control" rows="3" placeholder="Enter administrative observations, student clearance confirmation, or justification...">${item.reviewerObservation || ''}</textarea>
      </div>

      <div style="background: var(--color-peach-light); border: 1px solid var(--color-peach-border); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.76rem; color: var(--color-navy); margin-top: 12px;">
        ⚠️ <strong>Regulatory Disclaimer:</strong> All release operations in this prototype are demonstration simulations and do not execute monetary transactions or actual bank lien revocations.
      </div>
    `;

    // Hook buttons
    const approveBtn = document.getElementById('btn-approve-release');
    const rejectBtn = document.getElementById('btn-reject-release');
    const infoBtn = document.getElementById('btn-more-info-release');

    if (approveBtn) {
      approveBtn.onclick = () => {
        const obs = document.getElementById('release-decision-notes')?.value || 'Clearance confirmed. Released in prototype demo.';
        FINTRAC_STORAGE.updateReleaseStatus(item.id, 'Released in Demo', obs);
        FINTRAC_APP.closeModal('release-decision-modal');
        FINTRAC_APP.showToast('Release Authorized', `Deposit release for ${item.fdrReferenceNumber} approved in demo.`, 'success');
        this.renderRequestsTable();
      };
    }

    if (rejectBtn) {
      rejectBtn.onclick = () => {
        const obs = document.getElementById('release-decision-notes')?.value || 'Insufficient compliance documentation.';
        FINTRAC_STORAGE.updateReleaseStatus(item.id, 'Rejected in Demo', obs);
        FINTRAC_APP.closeModal('release-decision-modal');
        FINTRAC_APP.showToast('Release Rejected', `Release petition rejected.`, 'warning');
        this.renderRequestsTable();
      };
    }

    if (infoBtn) {
      infoBtn.onclick = () => {
        const obs = document.getElementById('release-decision-notes')?.value || 'Additional audit proof requested.';
        FINTRAC_STORAGE.updateReleaseStatus(item.id, 'Release Under Review', obs);
        FINTRAC_APP.closeModal('release-decision-modal');
        FINTRAC_APP.showToast('Action Logged', `Case marked for additional scrutiny.`, 'info');
        this.renderRequestsTable();
      };
    }

    FINTRAC_APP.openModal('release-decision-modal');
  }
};
