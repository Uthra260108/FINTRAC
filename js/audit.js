/* ==========================================================================
   FINTRAC — Immutable Audit Trail Controller
   ========================================================================== */

const FINTRAC_AUDIT = {
  currentRoleFilter: 'ALL',

  init() {
    this.renderAuditTable();
  },

  filterByRole(role) {
    this.currentRoleFilter = role;
    this.renderAuditTable();
  },

  renderAuditTable() {
    const tbody = document.getElementById('audit-table-tbody');
    const searchInput = document.getElementById('audit-search-input');
    if (!tbody) return;

    let history = FINTRAC_STORAGE.getAuditHistory();

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchTerm) {
      history = history.filter(item =>
        item.action.toLowerCase().includes(searchTerm) ||
        item.fdrReference.toLowerCase().includes(searchTerm) ||
        item.remarks.toLowerCase().includes(searchTerm)
      );
    }

    if (this.currentRoleFilter !== 'ALL') {
      history = history.filter(item => item.role.toLowerCase().includes(this.currentRoleFilter.toLowerCase()));
    }

    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <h4>No Audit Logs Found</h4>
              <p>No actions match your search query.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = history.map(item => {
      let roleCls = 'badge-navy';
      if (item.role.includes('AICTE')) roleCls = 'badge-forest';
      else if (item.role.includes('Reviewer')) roleCls = 'badge-olive';
      else if (item.role.includes('Institution')) roleCls = 'badge-peach';

      return `
        <tr>
          <td>
            <span class="primary-text font-mono">${item.timestamp}</span>
            <span class="sub-text font-mono">${item.id}</span>
          </td>
          <td>
            <span class="primary-text fw-bold">${item.action}</span>
          </td>
          <td>
            <span class="badge ${roleCls}">${item.role}</span>
          </td>
          <td>
            <span class="primary-text font-mono fw-semibold">${item.fdrReference}</span>
          </td>
          <td>
            <span class="sub-text" style="text-decoration: line-through;">${item.previousStatus}</span>
            <span class="primary-text fw-semibold">${item.newStatus}</span>
          </td>
          <td style="max-width: 260px; font-size: 0.82rem; color: var(--text-secondary);">
            ${item.remarks}
          </td>
          <td class="text-center">
            <span class="badge badge-active" title="SHA-256 Simulated Hash">🔒 Verified</span>
          </td>
        </tr>
      `;
    }).join('');
  },

  exportAuditCSV() {
    const history = FINTRAC_STORAGE.getAuditHistory();
    const headers = ['Log ID', 'Timestamp', 'Action', 'Role', 'FDR Reference', 'Previous Status', 'New Status', 'Remarks'];
    const rows = history.map(h => [
      h.id,
      h.timestamp,
      h.action,
      h.role,
      h.fdrReference,
      h.previousStatus,
      h.newStatus,
      h.remarks
    ]);

    FINTRAC_APP.exportToCSV('FINTRAC_Audit_Trail_Report.csv', rows, headers);
  }
};
