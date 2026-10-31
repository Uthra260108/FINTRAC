/* ==========================================================================
   FINTRAC — Document Scrutiny & Bank Verification Simulator
   ========================================================================== */

const FINTRAC_VERIFICATION = {
  currentFdrId: null,

  init() {
    this.renderQueue();
  },

  // Render Verification Requests Queue
  renderQueue(filter = 'ALL') {
    const tbody = document.getElementById('verification-queue-tbody');
    if (!tbody) return;

    let fdrs = FINTRAC_STORAGE.getFDRs();

    if (filter === 'PENDING') {
      fdrs = fdrs.filter(f => f.verificationStatus === 'Under Verification' || f.verificationStatus === 'Awaiting Review');
    } else if (filter === 'DISCREPANCY') {
      fdrs = fdrs.filter(f => f.verificationStatus === 'Discrepancy Found');
    } else if (filter === 'VERIFIED') {
      fdrs = fdrs.filter(f => f.verificationStatus === 'Verified in Demo');
    }

    if (fdrs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <h4>No Items in Verification Queue</h4>
              <p>All submitted instruments have been processed or no matching records found.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = fdrs.map(f => `
      <tr>
        <td>
          <span class="primary-text font-mono">${f.referenceNumber}</span>
          <span class="sub-text">${f.institutionName}</span>
        </td>
        <td>
          <span class="primary-text">${f.issuingBank}</span>
          <span class="sub-text">${f.bankBranch}</span>
        </td>
        <td class="font-mono fw-bold">${FINTRAC_APP.formatCurrency(f.amount, true)}</td>
        <td>
          <span class="primary-text">${FINTRAC_APP.formatDate(f.issueDate)}</span>
          <span class="sub-text">Matures: ${FINTRAC_APP.formatDate(f.maturityDate)}</span>
        </td>
        <td>
          <a href="javascript:void(0)" onclick="FINTRAC_FDR.previewDocument('${f.documentName}')" class="btn btn-secondary btn-sm" style="display: inline-flex;">
            📄 ${f.documentName.length > 18 ? f.documentName.substring(0, 16) + '...' : f.documentName}
          </a>
        </td>
        <td>${FINTRAC_APP.getStatusBadge(f.verificationStatus)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="FINTRAC_VERIFICATION.openScrutinyModal('${f.id}')">
            Scrutinize
          </button>
        </td>
      </tr>
    `).join('');
  },

  // Open Scrutiny Modal
  openScrutinyModal(fdrId) {
    const fdr = FINTRAC_STORAGE.getFDRById(fdrId);
    if (!fdr) return;

    this.currentFdrId = fdr.id;

    const modalTitle = document.getElementById('scrutiny-modal-title');
    const modalBody = document.getElementById('scrutiny-modal-body');
    if (!modalBody) return;

    if (modalTitle) {
      modalTitle.textContent = `Scrutiny Dossier: ${fdr.referenceNumber}`;
    }

    modalBody.innerHTML = `
      <!-- Notice Banner -->
      <div style="background: var(--color-peach-light); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
        <svg width="22" height="22" fill="none" stroke="var(--color-terracotta)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div style="font-size: 0.82rem; color: var(--color-navy);">
          <strong>Independent Verification Prototype:</strong> All confirmation states below are simulated demonstration controls. FINTRAC does not claim live bank API connectivity or financial clearing.
        </div>
      </div>

      <!-- Side-by-side comparison -->
      <div class="scrutiny-comparison-grid">
        <div class="scrutiny-panel panel-submitted">
          <div class="scrutiny-panel-title">
            <h4>Institution Submitted Details</h4>
            <span class="badge badge-navy">Uploaded Data</span>
          </div>
          <div class="info-pair-list">
            <div class="info-pair">
              <span class="info-label">Institution</span>
              <span class="info-val">${fdr.institutionName}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">FDR Reference</span>
              <span class="info-val font-mono">${fdr.referenceNumber}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Bank & Branch</span>
              <span class="info-val">${fdr.issuingBank}, ${fdr.bankBranch}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Deposit Amount</span>
              <span class="info-val font-mono fw-bold">${FINTRAC_APP.formatCurrency(fdr.amount)}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Issue Date</span>
              <span class="info-val">${FINTRAC_APP.formatDate(fdr.issueDate)}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Maturity Date</span>
              <span class="info-val">${FINTRAC_APP.formatDate(fdr.maturityDate)}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Document Proof</span>
              <span class="info-val">
                <a href="javascript:void(0)" onclick="FINTRAC_FDR.previewDocument('${fdr.documentName}')" style="text-decoration: underline;">
                  📄 Preview Document
                </a>
              </span>
            </div>
          </div>
        </div>

        <div class="scrutiny-panel panel-confirmed">
          <div class="scrutiny-panel-title">
            <h4>Independently Confirmed Information</h4>
            <span class="scrutiny-badge-demo">Demo Scrutiny</span>
          </div>
          <div class="info-pair-list">
            <div class="info-pair">
              <span class="info-label">Bank Confirmation Status</span>
              <span class="info-val">${fdr.independentConfirmed?.bankConfirmed ? 'Confirmed in Demo' : 'Not connected — demo only'}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">AICTE Joint Lien Registration</span>
              <span class="info-val">${fdr.independentConfirmed?.lienMarked ? 'Registered (Demo)' : 'Pending Review'}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Core Banking Reference</span>
              <span class="info-val font-mono">${fdr.independentConfirmed?.officerRemarks ? 'SFMS-DEMO-VALIDATED' : 'Not connected — demo only'}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Last Audit Action</span>
              <span class="info-val">${fdr.independentConfirmed?.confirmedDate || 'Awaiting initial check'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Scrutiny Decision Options -->
      <div style="margin-top: 18px;">
        <label class="form-label">Record Scrutiny Determination <span class="required">*</span></label>
        <div class="decision-cards">
          <label class="decision-card" onclick="FINTRAC_VERIFICATION.selectDecision(this, 'Verified in Demo')">
            <input type="radio" name="scrutiny-decision" value="Verified in Demo">
            <div class="decision-card-title">
              Verified in Demo
              <span style="color: var(--color-forest);">✓</span>
            </div>
            <div class="decision-card-desc">FDR authenticated with active lien marked.</div>
          </label>

          <label class="decision-card" onclick="FINTRAC_VERIFICATION.selectDecision(this, 'Information Complete')">
            <input type="radio" name="scrutiny-decision" value="Information Complete">
            <div class="decision-card-title">Information Complete</div>
            <div class="decision-card-desc">Documents and details align with AICTE norms.</div>
          </label>

          <label class="decision-card decision-pending" onclick="FINTRAC_VERIFICATION.selectDecision(this, 'Missing Information')">
            <input type="radio" name="scrutiny-decision" value="Missing Information">
            <div class="decision-card-title">Missing Info</div>
            <div class="decision-card-desc">Supporting bank endorsement letter missing.</div>
          </label>

          <label class="decision-card decision-discrepancy" onclick="FINTRAC_VERIFICATION.selectDecision(this, 'Discrepancy Found')">
            <input type="radio" name="scrutiny-decision" value="Discrepancy Found">
            <div class="decision-card-title">Discrepancy Found</div>
            <div class="decision-card-desc">Amount or tenure mismatch detected.</div>
          </label>

          <label class="decision-card decision-pending" onclick="FINTRAC_VERIFICATION.selectDecision(this, 'Further Verification Required')">
            <input type="radio" name="scrutiny-decision" value="Further Verification Required">
            <div class="decision-card-title">Further Scrutiny</div>
            <div class="decision-card-desc">Requires bank branch manager re-confirmation.</div>
          </label>
        </div>
      </div>

      <!-- Observations Input -->
      <div class="form-group" style="margin-top: 16px;">
        <label class="form-label" for="scrutiny-notes">Scrutinizer Observations & Remarks <span class="required">*</span></label>
        <textarea id="scrutiny-notes" class="form-control" rows="3" placeholder="Enter objective scrutiny findings, reason for discrepancy, or verification memo notes...">${fdr.discrepancyNotes || ''}</textarea>
      </div>
    `;

    FINTRAC_APP.openModal('scrutiny-modal');
  },

  selectDecision(cardEl, value) {
    document.querySelectorAll('.decision-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    const radio = cardEl.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  },

  // Save Scrutiny
  saveScrutiny() {
    const selectedRadio = document.querySelector('input[name="scrutiny-decision"]:checked');
    const notesInput = document.getElementById('scrutiny-notes');
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!selectedRadio) {
      FINTRAC_APP.showToast('Select Decision', 'Please choose a scrutiny determination option.', 'warning');
      return;
    }

    if (!notes) {
      FINTRAC_APP.showToast('Observation Required', 'Please enter scrutiny remarks or observations.', 'warning');
      return;
    }

    const outcome = selectedRadio.value;
    FINTRAC_STORAGE.recordVerificationOutcome(this.currentFdrId, outcome, notes);

    FINTRAC_APP.closeModal('scrutiny-modal');
    FINTRAC_APP.showToast('Scrutiny Recorded', `Instrument marked as [${outcome}].`, 'success');

    this.renderQueue();
  }
};
