/* ==========================================================================
   FINTRAC — Central FDR Registry & Lifecycle Controller
   ========================================================================== */

const FINTRAC_FDR = {
  activeList: [],

  // Load and render FDR list
  renderRegistryTable(tableBodyId, filterOptions = {}) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    let records = FINTRAC_STORAGE.getFDRs();

    // Institution constraint if logged in as institution admin
    const currentUser = FINTRAC_AUTH.getCurrentUser();
    if (currentUser && currentUser.roleKey === 'institution' && currentUser.institutionId) {
      records = records.filter(r => r.institutionId === currentUser.institutionId);
    }

    // Filters
    if (filterOptions.searchTerm) {
      const term = filterOptions.searchTerm.toLowerCase();
      records = records.filter(r =>
        r.referenceNumber.toLowerCase().includes(term) ||
        r.issuingBank.toLowerCase().includes(term) ||
        r.institutionName.toLowerCase().includes(term)
      );
    }

    if (filterOptions.status && filterOptions.status !== 'ALL') {
      records = records.filter(r => r.lifecycleStatus === filterOptions.status);
    }

    if (filterOptions.maturityCategory && filterOptions.maturityCategory !== 'ALL') {
      records = records.filter(r => r.maturityInfo.category === filterOptions.maturityCategory);
    }

    if (filterOptions.bank && filterOptions.bank !== 'ALL') {
      records = records.filter(r => r.issuingBank === filterOptions.bank);
    }

    // Sort by maturity date
    if (filterOptions.sortBy === 'maturity_asc') {
      records.sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));
    } else if (filterOptions.sortBy === 'maturity_desc') {
      records.sort((a, b) => new Date(b.maturityDate) - new Date(a.maturityDate));
    } else if (filterOptions.sortBy === 'amount_desc') {
      records.sort((a, b) => b.amount - a.amount);
    }

    this.activeList = records;

    if (records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h4>No FDR Records Found</h4>
              <p>Try adjusting your search criteria or register a new deposit instrument.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = records.map(r => {
      const mat = r.maturityInfo;
      return `
        <tr>
          <td>
            <span class="primary-text font-mono">${r.referenceNumber}</span>
            <span class="sub-text">${r.institutionName}</span>
          </td>
          <td>
            <span class="primary-text">${r.issuingBank}</span>
            <span class="sub-text">${r.bankBranch}</span>
          </td>
          <td>
            <span class="primary-text font-mono fw-bold">${FINTRAC_APP.formatCurrency(r.amount)}</span>
            <span class="sub-text">${FINTRAC_APP.formatCurrency(r.amount, true)}</span>
          </td>
          <td>
            <span class="primary-text">${FINTRAC_APP.formatDate(r.issueDate)}</span>
          </td>
          <td>
            <span class="primary-text">${FINTRAC_APP.formatDate(r.maturityDate)}</span>
            <span class="badge ${mat.badgeClass} mt-4"><span class="badge-dot"></span>${mat.label}</span>
          </td>
          <td>
            ${FINTRAC_APP.getStatusBadge(r.lifecycleStatus)}
          </td>
          <td>
            ${FINTRAC_APP.getStatusBadge(r.verificationStatus)}
          </td>
          <td>
            <div class="d-flex gap-8 align-center">
              <button class="btn btn-secondary btn-sm" onclick="FINTRAC_FDR.openDetailsModal('${r.id}')" title="View Full Details">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                View
              </button>
              <button class="btn btn-outline btn-sm" onclick="FINTRAC_FDR.openEditModal('${r.id}')" title="Edit Permitted Info">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-sm btn-icon-only text-terracotta" onclick="FINTRAC_FDR.confirmDelete('${r.id}')" title="Delete Demo Record">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // View Details Modal with 12-Step Lifecycle
  openDetailsModal(fdrId) {
    const fdr = FINTRAC_STORAGE.getFDRById(fdrId);
    if (!fdr) return;

    const modalBody = document.getElementById('fdr-details-modal-body');
    const modalTitle = document.getElementById('fdr-details-modal-title');
    if (!modalBody) return;

    if (modalTitle) {
      modalTitle.textContent = `Instrument Dossier: ${fdr.referenceNumber}`;
    }

    const mat = fdr.maturityInfo;

    modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-light);">
        <div>
          <h4 style="font-size: 1.2rem; color: var(--color-navy); margin-bottom: 4px;">${fdr.referenceNumber}</h4>
          <p style="font-size: 0.86rem; color: var(--text-secondary);">${fdr.institutionName} (${fdr.institutionId})</p>
        </div>
        <div style="text-align: right;">
          <div style="font-family: var(--font-serif); font-size: 1.45rem; font-weight: 700; color: var(--color-forest-dark);">
            ${FINTRAC_APP.formatCurrency(fdr.amount)}
          </div>
          <div style="margin-top: 4px;">
            ${FINTRAC_APP.getStatusBadge(fdr.lifecycleStatus)}
          </div>
        </div>
      </div>

      <!-- Scrutiny Split Comparison -->
      <div class="scrutiny-comparison-grid">
        <div class="scrutiny-panel panel-submitted">
          <div class="scrutiny-panel-title">
            <h4>Institution Submitted Details</h4>
            <span class="badge badge-navy">Portal Record</span>
          </div>
          <div class="info-pair-list">
            <div class="info-pair">
              <span class="info-label">Issuing Bank</span>
              <span class="info-val">${fdr.issuingBank}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Branch</span>
              <span class="info-val">${fdr.bankBranch}</span>
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
              <span class="info-label">Maturity Horizon</span>
              <span class="info-val"><span class="badge ${mat.badgeClass}">${mat.label}</span></span>
            </div>
            <div class="info-pair">
              <span class="info-label">Deposit Holder</span>
              <span class="info-val">${fdr.depositHolder}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Instrument Document</span>
              <span class="info-val">
                <a href="javascript:void(0)" onclick="FINTRAC_FDR.previewDocument('${fdr.documentName}')" style="text-decoration: underline;">
                  📄 ${fdr.documentName}
                </a> (${fdr.documentSize || '1.2 MB'})
              </span>
            </div>
          </div>
        </div>

        <div class="scrutiny-panel panel-confirmed">
          <div class="scrutiny-panel-title">
            <h4>Independently Confirmed (Bank Demo)</h4>
            <span class="scrutiny-badge-demo">Demo Simulator</span>
          </div>
          <div class="info-pair-list">
            <div class="info-pair">
              <span class="info-label">Bank Confirmation</span>
              <span class="info-val">${fdr.independentConfirmed?.bankConfirmed ? '✅ Confirmed in Prototype' : '⚠️ Pending Confirmation'}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Confirmation Date</span>
              <span class="info-val">${fdr.independentConfirmed?.confirmedDate || 'Not connected — demo only'}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Joint Lien Status</span>
              <span class="info-val">${fdr.independentConfirmed?.lienMarked ? '🔒 Marked in AICTE Favor' : '⚠️ Lien Unverified'}</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Core Banking Channel</span>
              <span class="info-val">Simulated SFMS API / Demo Gate</span>
            </div>
            <div class="info-pair">
              <span class="info-label">Officer Observation</span>
              <span class="info-val" style="font-style: italic;">"${fdr.independentConfirmed?.officerRemarks || 'No discrepancies flagged in demonstration registry.'}"</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lifecycle Progress Timeline -->
      <div style="margin-top: 24px;">
        <h4 style="font-size: 1.05rem; color: var(--color-navy); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Instrument Lifecycle Progression (12 Stages)
        </h4>
        ${FINTRAC_APP.renderLifecycleTimeline(fdr.lifecycleStatus)}
      </div>
    `;

    FINTRAC_APP.openModal('fdr-details-modal');
  },

  // Edit Permitted Fields Modal
  openEditModal(fdrId) {
    const fdr = FINTRAC_STORAGE.getFDRById(fdrId);
    if (!fdr) return;

    document.getElementById('edit-fdr-id').value = fdr.id;
    document.getElementById('edit-fdr-ref').value = fdr.referenceNumber;
    document.getElementById('edit-fdr-bank').value = fdr.issuingBank;
    document.getElementById('edit-fdr-branch').value = fdr.bankBranch;
    document.getElementById('edit-fdr-amount').value = fdr.amount;
    document.getElementById('edit-fdr-issue-date').value = fdr.issueDate;
    document.getElementById('edit-fdr-maturity-date').value = fdr.maturityDate;
    document.getElementById('edit-fdr-holder').value = fdr.depositHolder;
    document.getElementById('edit-fdr-remarks').value = fdr.remarks || '';

    FINTRAC_APP.openModal('fdr-edit-modal');
  },

  // Handle Edit Submit
  handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-fdr-id').value;
    const branch = document.getElementById('edit-fdr-branch').value;
    const holder = document.getElementById('edit-fdr-holder').value;
    const remarks = document.getElementById('edit-fdr-remarks').value;

    FINTRAC_STORAGE.updateFDR(id, {
      bankBranch: branch,
      depositHolder: holder,
      remarks: remarks
    });

    FINTRAC_APP.closeModal('fdr-edit-modal');
    FINTRAC_APP.showToast('Record Updated', 'FDR details updated successfully in prototype registry.', 'success');

    // Re-render
    const table = document.getElementById('fdr-table-body') || document.getElementById('institution-fdr-tbody');
    if (table) {
      this.renderRegistryTable(table.id);
    }
  },

  // Delete Demo Record
  confirmDelete(fdrId) {
    const fdr = FINTRAC_STORAGE.getFDRById(fdrId);
    if (!fdr) return;

    if (confirm(`Delete demonstration FDR record [${fdr.referenceNumber}]?\n\nThis will remove the item from local demo storage and log the deletion in the audit trail.`)) {
      FINTRAC_STORAGE.deleteFDR(fdrId);
      FINTRAC_APP.showToast('FDR Deleted', `Record ${fdr.referenceNumber} deleted.`, 'warning');
      const table = document.getElementById('fdr-table-body') || document.getElementById('institution-fdr-tbody');
      if (table) {
        this.renderRegistryTable(table.id);
      }
    }
  },

  // Document Preview Modal
  previewDocument(docName) {
    const modal = document.getElementById('doc-preview-modal');
    const title = document.getElementById('doc-preview-modal-title');
    const body = document.getElementById('doc-preview-modal-body');
    if (!modal || !body) return;

    if (title) title.textContent = `Document Viewer: ${docName}`;

    body.innerHTML = `
      <div style="text-align: center; padding: 20px; background: var(--bg-card-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-medium);">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--color-peach); color: var(--color-forest); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        </div>
        <h4 style="font-size: 1.1rem; color: var(--color-navy);">${docName}</h4>
        <p style="font-size: 0.84rem; color: var(--text-muted); margin-top: 4px;">Simulated PDF Document Preview • Secure Prototype Sandbox</p>

        <!-- Mock Certificate Container -->
        <div style="background: #FFFFFF; border: 2px solid var(--border-medium); border-radius: var(--radius-sm); padding: 24px; margin-top: 20px; text-align: left; box-shadow: var(--shadow-sm); position: relative;">
          <div style="position: absolute; top: 12px; right: 12px; border: 2px solid var(--color-forest); color: var(--color-forest); padding: 4px 10px; font-weight: 800; font-size: 0.72rem; text-transform: uppercase; transform: rotate(-5deg); border-radius: 4px;">
            AICTE JOINT LIEN CONFIRMED (DEMO)
          </div>
          <div style="border-bottom: 2px solid var(--color-navy); padding-bottom: 8px; margin-bottom: 16px;">
            <h3 style="font-size: 1.1rem; color: var(--color-navy); text-transform: uppercase; letter-spacing: 0.05em;">State Bank of India / Scheduled Commercial Bank</h3>
            <p style="font-size: 0.76rem; color: var(--text-muted);">TERM DEPOSIT RECEIPT & LIEN ENDORSEMENT CERTIFICATE</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
            <div><strong>Deposit Ref:</strong> <span class="font-mono">SBI-FDR-982341-A</span></div>
            <div><strong>Deposit Category:</strong> AICTE Statutory Guarantee</div>
            <div><strong>Principal Deposit:</strong> ₹1,50,00,000/-</div>
            <div><strong>Tenure:</strong> 36 Months</div>
            <div><strong>Maturity Date:</strong> End of Regulatory Cycle</div>
            <div><strong>Lien Holder:</strong> Member Secretary, AICTE New Delhi</div>
          </div>
          <div style="margin-top: 18px; padding-top: 12px; border-top: 1px dashed var(--border-light); font-size: 0.76rem; color: var(--text-muted);">
            *This is a simulated document viewer for hackathon demonstration. Real financial documents are not processed or stored.
          </div>
        </div>
      </div>
    `;

    FINTRAC_APP.openModal('doc-preview-modal');
  }
};
