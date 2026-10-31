/* ==========================================================================
   FINTRAC — Automated Maturity Tracking & Alert Horizon Controller
   ========================================================================== */

const FINTRAC_MATURITY = {
  currentCategoryFilter: 'ALL',

  init() {
    this.renderMaturityMatrix();
    this.renderMaturityTable();
  },

  // Calculate and display tier distribution cards
  renderMaturityMatrix() {
    const fdrs = FINTRAC_STORAGE.getFDRs();

    let countMatured = 0, sumMatured = 0;
    let countExpiring = 0, sumExpiring = 0;
    let countApproaching = 0, sumApproaching = 0;
    let countActive = 0, sumActive = 0;
    let countReleased = 0;

    fdrs.forEach(f => {
      const cat = f.maturityInfo.category;
      if (f.lifecycleStatus === 'Released in Demo') {
        countReleased++;
      } else if (cat === 'Matured') {
        countMatured++;
        sumMatured += f.amount;
      } else if (cat === 'Expiring Soon') {
        countExpiring++;
        sumExpiring += f.amount;
      } else if (cat === 'Approaching Maturity') {
        countApproaching++;
        sumApproaching += f.amount;
      } else if (cat === 'Active') {
        countActive++;
        sumActive += f.amount;
      }
    });

    const setCard = (countId, sumId, count, sum) => {
      const cEl = document.getElementById(countId);
      const sEl = document.getElementById(sumId);
      if (cEl) cEl.textContent = count;
      if (sEl) sEl.textContent = FINTRAC_APP.formatCurrency(sum, true);
    };

    setCard('matrix-count-matured', 'matrix-sum-matured', countMatured, sumMatured);
    setCard('matrix-count-expiring', 'matrix-sum-expiring', countExpiring, sumExpiring);
    setCard('matrix-count-approaching', 'matrix-sum-approaching', countApproaching, sumApproaching);
    setCard('matrix-count-active', 'matrix-sum-active', countActive, sumActive);

    // Overdue banner visibility
    const overdueBanner = document.getElementById('overdue-critical-alert');
    if (overdueBanner) {
      overdueBanner.style.display = countMatured > 0 ? 'flex' : 'none';
      const overdueText = document.getElementById('overdue-banner-text');
      if (overdueText) {
        overdueText.textContent = `${countMatured} financial instrument(s) totaling ${FINTRAC_APP.formatCurrency(sumMatured, true)} have passed maturity date without compliant replacement or renewal.`;
      }
    }
  },

  // Filter by Horizon Bucket
  filterByHorizon(category) {
    this.currentCategoryFilter = category;

    // Update active tab buttons
    document.querySelectorAll('.maturity-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });

    this.renderMaturityTable();
  },

  // Render Table
  renderMaturityTable() {
    const tbody = document.getElementById('maturity-table-tbody');
    if (!tbody) return;

    let fdrs = FINTRAC_STORAGE.getFDRs();

    if (this.currentCategoryFilter !== 'ALL') {
      fdrs = fdrs.filter(f => f.maturityInfo.category === this.currentCategoryFilter);
    }

    // Sort ascending by maturity date (closest to maturity first)
    fdrs.sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));

    if (fdrs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <h4>No Records in this Maturity Tier</h4>
              <p>No financial instruments match the selected maturity threshold.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = fdrs.map(f => {
      const mat = f.maturityInfo;
      const daysText = mat.daysRemaining < 0
        ? `<span class="text-terracotta fw-bold font-mono">${Math.abs(mat.daysRemaining)} Days Overdue</span>`
        : `<span class="font-mono fw-semibold">${mat.daysRemaining} Days Left</span>`;

      return `
        <tr>
          <td>
            <span class="primary-text font-mono">${f.referenceNumber}</span>
            <span class="sub-text">${f.institutionName}</span>
          </td>
          <td>${f.issuingBank}</td>
          <td class="font-mono fw-bold">${FINTRAC_APP.formatCurrency(f.amount, true)}</td>
          <td>${FINTRAC_APP.formatDate(f.issueDate)}</td>
          <td>
            <span class="primary-text font-mono">${FINTRAC_APP.formatDate(f.maturityDate)}</span>
          </td>
          <td>${daysText}</td>
          <td>
            <span class="badge ${mat.badgeClass}"><span class="badge-dot"></span>${mat.label}</span>
          </td>
          <td>
            <div class="d-flex gap-8">
              <button class="btn btn-secondary btn-sm" onclick="FINTRAC_FDR.openDetailsModal('${f.id}')">Inspect</button>
              ${mat.category === 'Matured' || mat.category === 'Expiring Soon' ? `
                <a href="renewal.html?ref=${f.referenceNumber}" class="btn btn-terracotta btn-sm">Renew</a>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // Trigger Configurable Threshold Test
  testReminderAlert(daysThreshold) {
    const fdrs = FINTRAC_STORAGE.getFDRs();
    const matching = fdrs.filter(f => f.maturityInfo.daysRemaining <= daysThreshold && f.maturityInfo.daysRemaining >= 0 && f.lifecycleStatus !== 'Released in Demo');

    FINTRAC_APP.showToast(
      `${daysThreshold}-Day Maturity Audit`,
      `Identified ${matching.length} instrument(s) due within the next ${daysThreshold} days. Notification notices generated in Alert Centre.`,
      'info'
    );
  }
};
