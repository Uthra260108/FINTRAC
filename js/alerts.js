/* ==========================================================================
   FINTRAC — Alerts & Notification Centre Controller
   ========================================================================== */

const FINTRAC_ALERTS = {
  currentPriorityFilter: 'ALL',
  currentTypeFilter: 'ALL',

  init() {
    this.renderAlertCards();
    this.renderAlertsTable();
  },

  renderAlertCards() {
    const alerts = FINTRAC_STORAGE.getAlerts();

    const critical = alerts.filter(a => a.priority === 'Critical').length;
    const high = alerts.filter(a => a.priority === 'High').length;
    const medium = alerts.filter(a => a.priority === 'Medium').length;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('alert-stat-critical', critical);
    setVal('alert-stat-high', high);
    setVal('alert-stat-medium', medium);
    setVal('alert-stat-total', alerts.length);
  },

  filterAlerts(priority, type) {
    if (priority !== undefined) this.currentPriorityFilter = priority;
    if (type !== undefined) this.currentTypeFilter = type;
    this.renderAlertsTable();
  },

  renderAlertsTable() {
    const container = document.getElementById('alerts-container');
    if (!container) return;

    let alerts = FINTRAC_STORAGE.getAlerts();

    if (this.currentPriorityFilter !== 'ALL') {
      alerts = alerts.filter(a => a.priority === this.currentPriorityFilter);
    }

    if (this.currentTypeFilter !== 'ALL') {
      alerts = alerts.filter(a => a.type.toLowerCase().includes(this.currentTypeFilter.toLowerCase()));
    }

    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h4>No Active Alerts</h4>
          <p>No alerts matching current filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = alerts.map(a => {
      let borderLeft = 'var(--color-forest)';
      let badgeCls = 'badge-forest';
      if (a.priority === 'Critical') {
        borderLeft = 'var(--color-terracotta)';
        badgeCls = 'badge-terracotta';
      } else if (a.priority === 'High') {
        borderLeft = '#c48f29';
        badgeCls = 'badge-olive';
      } else if (a.priority === 'Medium') {
        borderLeft = 'var(--color-navy)';
        badgeCls = 'badge-navy';
      }

      return `
        <div style="background: #FFFFFF; border: 1px solid var(--border-light); border-left: 5px solid ${borderLeft}; border-radius: var(--radius-sm); padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; box-shadow: var(--shadow-sm);">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span class="badge ${badgeCls}">${a.priority} Priority</span>
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--color-navy);">${a.type}</span>
              <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: auto;">${FINTRAC_APP.formatDate(a.date)}</span>
            </div>
            <div style="font-size: 0.86rem; color: var(--color-navy); font-weight: 600; margin-bottom: 4px;">
              ${a.institution} — <span class="font-mono text-forest">${a.fdrRef}</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 8px;">
              <strong>Action Required:</strong> ${a.actionRequired}
            </p>
          </div>
          <div style="flex-shrink: 0; display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="FINTRAC_FDR.openDetailsModal('${a.fdrRef}')">
              Examine
            </button>
            <button class="btn btn-outline btn-sm" onclick="this.closest('div[style*=background]').remove(); FINTRAC_APP.showToast('Alert Acknowledged', 'Alert dismissed from active queue.', 'info');">
              Dismiss
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};
