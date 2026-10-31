/* ==========================================================================
   FINTRAC — Institution Financial Workspace Controller
   ========================================================================== */

const FINTRAC_INSTITUTION = {
  selectedFile: null,

  init() {
    this.renderHeaderAndStats();
    this.renderFDRTable();
    this.initAddFDRForm();
  },

  // Render Institution Header & Metrics
  renderHeaderAndStats() {
    const user = FINTRAC_AUTH.getCurrentUser();
    const instId = user?.institutionId || 'INST-AICTE-1001';
    const institution = FINTRAC_STORAGE.getInstitutionById(instId);

    const nameEl = document.getElementById('inst-display-name');
    const idEl = document.getElementById('inst-display-id');
    const detailsEl = document.getElementById('inst-display-details');

    if (nameEl && institution) nameEl.textContent = institution.name;
    if (idEl && institution) idEl.textContent = institution.id;
    if (detailsEl && institution) {
      detailsEl.textContent = `${institution.city}, ${institution.state} • ${institution.type} • Approval Ref: ${institution.approvalRef}`;
    }

    // Filter FDRs for this institution
    const allFdrs = FINTRAC_STORAGE.getFDRs();
    const instFdrs = allFdrs.filter(f => f.institutionId === instId);

    let totalDeposit = 0;
    let activeCount = 0;
    let expiringCount = 0;
    let pendingVerifCount = 0;

    instFdrs.forEach(f => {
      totalDeposit += f.amount;
      if (f.lifecycleStatus !== 'Released in Demo') {
        activeCount++;
      }
      if (f.maturityInfo.category === 'Expiring Soon' || f.maturityInfo.category === 'Matured') {
        expiringCount++;
      }
      if (f.verificationStatus === 'Under Verification' || f.verificationStatus === 'Awaiting Review') {
        pendingVerifCount++;
      }
    });

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('inst-stat-total-fdrs', instFdrs.length);
    setVal('inst-stat-active-fdrs', activeCount);
    setVal('inst-stat-expiring-fdrs', expiringCount);
    setVal('inst-stat-pending-verif', pendingVerifCount);
    setVal('inst-stat-total-deposit', FINTRAC_APP.formatCurrency(totalDeposit, true));
  },

  // Render FDR records table with filters & sorting
  renderFDRTable() {
    const searchInput = document.getElementById('inst-fdr-search');
    const statusSelect = document.getElementById('inst-status-filter');
    const sortSelect = document.getElementById('inst-sort-filter');

    const filterOptions = {
      searchTerm: searchInput ? searchInput.value : '',
      status: statusSelect ? statusSelect.value : 'ALL',
      sortBy: sortSelect ? sortSelect.value : 'maturity_asc'
    };

    FINTRAC_FDR.renderRegistryTable('inst-fdr-table-body', filterOptions);
  },

  // Add New FDR Form Handler
  initAddFDRForm() {
    const form = document.getElementById('add-fdr-form');
    if (!form) return;

    // Prefill Institution details from active session
    const user = FINTRAC_AUTH.getCurrentUser();
    const instId = user?.institutionId || 'INST-AICTE-1001';
    const inst = FINTRAC_STORAGE.getInstitutionById(instId);

    if (inst) {
      const nameInput = document.getElementById('fdr-inst-name');
      const idInput = document.getElementById('fdr-inst-id');
      const addressInput = document.getElementById('fdr-inst-address');

      if (nameInput) nameInput.value = inst.name;
      if (idInput) idInput.value = inst.id;
      if (addressInput) addressInput.value = `${inst.city}, ${inst.state}, India`;
    }

    // File Dropzone handlers
    const dropzone = document.getElementById('fdr-dropzone');
    const fileInput = document.getElementById('fdr-file-input');
    const previewBox = document.getElementById('fdr-file-preview');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          this.selectedFile = file;
          this.displayFilePreview(file, previewBox);
        }
      });
    }

    // Form submit handlers
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFDRSubmission('Submitted by Institution');
    });

    const draftBtn = document.getElementById('btn-save-draft');
    if (draftBtn) {
      draftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleFDRSubmission('Draft Created');
      });
    }
  },

  displayFilePreview(file, container) {
    if (!container) return;
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeStr = sizeKB > 1024 ? (sizeKB / 1024).toFixed(2) + ' MB' : sizeKB + ' KB';
    const ext = file.name.split('.').pop().toUpperCase();

    container.innerHTML = `
      <div class="doc-preview-card">
        <div class="doc-info">
          <div class="doc-badge">${ext}</div>
          <div>
            <div class="doc-name">${file.name}</div>
            <div class="doc-size">${sizeStr} • Ready for upload</div>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline text-terracotta" onclick="FINTRAC_INSTITUTION.removeFile()">
          Remove
        </button>
      </div>
    `;
    container.style.display = 'block';
  },

  removeFile() {
    this.selectedFile = null;
    const fileInput = document.getElementById('fdr-file-input');
    const previewBox = document.getElementById('fdr-file-preview');
    if (fileInput) fileInput.value = '';
    if (previewBox) {
      previewBox.innerHTML = '';
      previewBox.style.display = 'none';
    }
  },

  // Handle Form Submission with Validation
  handleFDRSubmission(initialStatus) {
    const ref = document.getElementById('fdr-ref').value.trim();
    const bank = document.getElementById('fdr-bank').value.trim();
    const branch = document.getElementById('fdr-branch').value.trim();
    const amountVal = parseFloat(document.getElementById('fdr-amount').value);
    const issueDate = document.getElementById('fdr-issue-date').value;
    const maturityDate = document.getElementById('fdr-maturity-date').value;
    const instType = document.getElementById('fdr-type').value;
    const holder = document.getElementById('fdr-holder').value.trim();
    const remarks = document.getElementById('fdr-remarks').value.trim();
    const user = FINTRAC_AUTH.getCurrentUser();
    const instId = user?.institutionId || 'INST-AICTE-1001';
    const inst = FINTRAC_STORAGE.getInstitutionById(instId);

    // Validations
    if (!ref || !bank || !branch || isNaN(amountVal) || !issueDate || !maturityDate || !holder) {
      FINTRAC_APP.showToast('Validation Error', 'Please fill in all mandatory fields marked with an asterisk (*).', 'error');
      return;
    }

    if (amountVal <= 0) {
      FINTRAC_APP.showToast('Invalid Amount', 'Deposit amount must be a positive number greater than ₹0.', 'error');
      return;
    }

    const issueD = new Date(issueDate);
    const maturityD = new Date(maturityDate);

    if (maturityD <= issueD) {
      FINTRAC_APP.showToast('Invalid Dates', 'Maturity date must be later than the instrument issue date.', 'error');
      return;
    }

    const docName = this.selectedFile ? this.selectedFile.name : `${bank.replace(/\s+/g, '_')}_FDR_Receipt.pdf`;
    const docSize = this.selectedFile ? `${(this.selectedFile.size / 1024).toFixed(0)} KB` : '1.2 MB';

    const newRecord = {
      referenceNumber: ref,
      institutionId: instId,
      institutionName: inst ? inst.name : 'Maharashtra Institute of Technology (MIT-WPU)',
      issuingBank: bank,
      bankBranch: branch,
      amount: amountVal,
      issueDate: issueDate,
      maturityDate: maturityDate,
      instrumentType: instType || 'Security Deposit (FDR)',
      depositHolder: holder,
      documentName: docName,
      documentSize: docSize,
      uploadDate: new Date().toISOString().split('T')[0],
      lifecycleStatus: initialStatus,
      verificationStatus: initialStatus === 'Draft Created' ? 'Awaiting Review' : 'Under Verification',
      remarks: remarks || 'Deposit instrument registered via institution portal.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: false,
        confirmedDate: 'Demo - Not connected',
        lienMarked: false,
        officerRemarks: 'Submitted to AICTE Regulation Bureau demonstration queue.'
      }
    };

    FINTRAC_STORAGE.saveFDR(newRecord);

    FINTRAC_APP.showToast(
      initialStatus === 'Draft Created' ? 'Draft Saved' : 'Deposit Submitted',
      `FDR [${ref}] has been recorded successfully.`,
      'success'
    );

    // Redirect to institution dashboard or reset
    setTimeout(() => {
      window.location.href = 'institution.html';
    }, 1200);
  }
};
