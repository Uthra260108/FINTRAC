/* ==========================================================================
   FINTRAC — Reports, Analytics & HTML5 Canvas Visualization Engine
   ========================================================================== */

const FINTRAC_REPORTS = {
  init() {
    this.renderSummaryCards();
    this.drawStatusChart();
    this.drawBankDistributionChart();
    this.drawMaturityHorizonChart();
    this.renderInstitutionSummaryTable();
    this.renderBankSummaryTable();
  },

  renderSummaryCards() {
    const fdrs = FINTRAC_STORAGE.getFDRs();

    let totalVal = 0;
    let activeVal = 0;
    let pendingCount = 0;

    fdrs.forEach(f => {
      totalVal += f.amount;
      if (f.lifecycleStatus !== 'Released in Demo') {
        activeVal += f.amount;
      }
      if (f.verificationStatus === 'Under Verification') {
        pendingCount++;
      }
    });

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('rep-total-val', FINTRAC_APP.formatCurrency(totalVal, true));
    setVal('rep-active-val', FINTRAC_APP.formatCurrency(activeVal, true));
    setVal('rep-total-count', fdrs.length);
    setVal('rep-pending-verif', pendingCount);
  },

  // HTML5 Canvas Donut Chart: Lifecycle / Deposit Status Distribution
  drawStatusChart() {
    const canvas = document.getElementById('chart-status-donut');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const fdrs = FINTRAC_STORAGE.getFDRs();
    let active = 0, matured = 0, renewed = 0, released = 0;

    fdrs.forEach(f => {
      if (f.lifecycleStatus === 'Released in Demo') released++;
      else if (f.lifecycleStatus === 'Renewed') renewed++;
      else if (f.maturityInfo.category === 'Matured') matured++;
      else active++;
    });

    const data = [
      { label: 'Active', count: active, color: '#445D48' },
      { label: 'Approaching/Matured', count: matured, color: '#5E3023' },
      { label: 'Renewed', count: renewed, color: '#D6C699' },
      { label: 'Released', count: released, color: '#e59a67' }
    ];

    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 10;
    const innerRadius = outerRadius * 0.58;

    let startAngle = -Math.PI / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.forEach(slice => {
      const sliceAngle = (slice.count / total) * (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = '#001524';
    ctx.font = 'bold 22px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${total}`, centerX, centerY - 6);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#788a96';
    ctx.fillText('Instruments', centerX, centerY + 14);

    // Legend
    const legendContainer = document.getElementById('chart-status-legend');
    if (legendContainer) {
      legendContainer.innerHTML = data.map(d => `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; margin-bottom: 6px;">
          <span style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 12px; height: 12px; border-radius: 3px; background: ${d.color}; display: inline-block;"></span>
            ${d.label}
          </span>
          <strong class="font-mono">${d.count} (${Math.round((d.count / total) * 100)}%)</strong>
        </div>
      `).join('');
    }
  },

  // HTML5 Canvas Bar Chart: Bank-wise Deposit Distribution
  drawBankDistributionChart() {
    const canvas = document.getElementById('chart-banks-bar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const fdrs = FINTRAC_STORAGE.getFDRs();
    const bankTotals = {};

    fdrs.forEach(f => {
      bankTotals[f.issuingBank] = (bankTotals[f.issuingBank] || 0) + f.amount;
    });

    const banks = Object.keys(bankTotals).slice(0, 6);
    const amounts = banks.map(b => bankTotals[b] / 10000000); // in Crores
    const maxVal = Math.max(...amounts, 5);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const padding = 45;
    const chartHeight = canvas.height - padding * 2;
    const chartWidth = canvas.width - padding * 2;
    const barWidth = chartWidth / (banks.length * 1.6);
    const gap = chartWidth / banks.length;

    // Draw grid lines
    ctx.strokeStyle = '#EBE4D8';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      ctx.fillStyle = '#788a96';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      const labelVal = (maxVal * (1 - i / 4)).toFixed(1);
      ctx.fillText(`₹${labelVal}Cr`, padding - 6, y + 3);
    }

    // Draw bars
    banks.forEach((bank, i) => {
      const x = padding + i * gap + (gap - barWidth) / 2;
      const h = (amounts[i] / maxVal) * chartHeight;
      const y = padding + chartHeight - h;

      ctx.fillStyle = '#445D48';
      ctx.fillRect(x, y, barWidth, h);

      // Value label on top
      ctx.fillStyle = '#001524';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`₹${amounts[i].toFixed(1)}Cr`, x + barWidth / 2, y - 6);

      // Short bank name
      ctx.fillStyle = '#001524';
      ctx.font = '11px sans-serif';
      const shortName = bank.replace('State Bank of India', 'SBI')
        .replace('Punjab National Bank', 'PNB')
        .replace('Bank of Baroda', 'BOB')
        .replace('Union Bank of India', 'UBI');
      ctx.fillText(shortName, x + barWidth / 2, canvas.height - padding + 16);
    });
  },

  // HTML5 Canvas Maturity Horizon Distribution
  drawMaturityHorizonChart() {
    const canvas = document.getElementById('chart-maturity-horizon');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const fdrs = FINTRAC_STORAGE.getFDRs();
    let m30 = 0, m60 = 0, m90 = 0, mFar = 0, matured = 0;

    fdrs.forEach(f => {
      const d = f.maturityInfo.daysRemaining;
      if (f.lifecycleStatus === 'Released in Demo') return;
      if (d < 0) matured++;
      else if (d <= 30) m30++;
      else if (d <= 60) m60++;
      else if (d <= 90) m90++;
      else mFar++;
    });

    const tiers = [
      { label: 'Overdue', count: matured, color: '#5E3023' },
      { label: '1-30 Days', count: m30, color: '#e59a67' },
      { label: '31-60 Days', count: m60, color: '#D6C699' },
      { label: '61-90 Days', count: m90, color: '#725c1e' },
      { label: '>90 Days', count: mFar, color: '#445D48' }
    ];

    const maxCount = Math.max(...tiers.map(t => t.count), 4);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 45;
    const chartHeight = canvas.height - padding * 2;
    const chartWidth = canvas.width - padding * 2;
    const barWidth = chartWidth / (tiers.length * 1.6);
    const gap = chartWidth / tiers.length;

    tiers.forEach((t, i) => {
      const x = padding + i * gap + (gap - barWidth) / 2;
      const h = (t.count / maxCount) * chartHeight;
      const y = padding + chartHeight - h;

      ctx.fillStyle = t.color;
      ctx.fillRect(x, y, barWidth, h);

      ctx.fillStyle = '#001524';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${t.count}`, x + barWidth / 2, y - 6);

      ctx.font = '10px sans-serif';
      ctx.fillText(t.label, x + barWidth / 2, canvas.height - padding + 16);
    });
  },

  // Institution-wise Summary Table
  renderInstitutionSummaryTable() {
    const tbody = document.getElementById('rep-inst-tbody');
    if (!tbody) return;

    const institutions = FINTRAC_STORAGE.getInstitutions();
    const fdrs = FINTRAC_STORAGE.getFDRs();

    tbody.innerHTML = institutions.map(inst => {
      const instFdrs = fdrs.filter(f => f.institutionId === inst.id);
      const totalAmount = instFdrs.reduce((sum, f) => sum + f.amount, 0);
      const activeCount = instFdrs.filter(f => f.lifecycleStatus !== 'Released in Demo').length;
      const expiringCount = instFdrs.filter(f => f.maturityInfo.category === 'Expiring Soon' || f.maturityInfo.category === 'Matured').length;

      return `
        <tr>
          <td>
            <span class="primary-text fw-bold">${inst.name}</span>
            <span class="sub-text">${inst.city}, ${inst.state}</span>
          </td>
          <td class="font-mono text-center">${instFdrs.length}</td>
          <td class="font-mono text-center">${activeCount}</td>
          <td class="font-mono text-center ${expiringCount > 0 ? 'text-terracotta fw-bold' : ''}">${expiringCount}</td>
          <td class="font-mono fw-bold text-right">${FINTRAC_APP.formatCurrency(totalAmount)}</td>
        </tr>
      `;
    }).join('');
  },

  // Bank-wise Summary Table
  renderBankSummaryTable() {
    const tbody = document.getElementById('rep-bank-tbody');
    if (!tbody) return;

    const fdrs = FINTRAC_STORAGE.getFDRs();
    const bankMap = {};

    fdrs.forEach(f => {
      if (!bankMap[f.issuingBank]) {
        bankMap[f.issuingBank] = { count: 0, total: 0, active: 0 };
      }
      bankMap[f.issuingBank].count++;
      bankMap[f.issuingBank].total += f.amount;
      if (f.lifecycleStatus !== 'Released in Demo') {
        bankMap[f.issuingBank].active++;
      }
    });

    tbody.innerHTML = Object.entries(bankMap).map(([bank, data]) => `
      <tr>
        <td class="primary-text fw-semibold">${bank}</td>
        <td class="font-mono text-center">${data.count}</td>
        <td class="font-mono text-center">${data.active}</td>
        <td class="font-mono fw-bold text-right">${FINTRAC_APP.formatCurrency(data.total)}</td>
      </tr>
    `).join('');
  },

  // CSV Export
  exportFDRDataCSV() {
    const fdrs = FINTRAC_STORAGE.getFDRs();
    const headers = [
      'FDR Reference',
      'Institution Name',
      'Institution ID',
      'Issuing Bank',
      'Branch',
      'Deposit Amount (INR)',
      'Issue Date',
      'Maturity Date',
      'Days to Maturity',
      'Maturity Tier',
      'Lifecycle Status',
      'Verification Status'
    ];

    const rows = fdrs.map(f => [
      f.referenceNumber,
      f.institutionName,
      f.institutionId,
      f.issuingBank,
      f.bankBranch,
      f.amount,
      f.issueDate,
      f.maturityDate,
      f.maturityInfo.daysRemaining,
      f.maturityInfo.category,
      f.lifecycleStatus,
      f.verificationStatus
    ]);

    FINTRAC_APP.exportToCSV('FINTRAC_AICTE_FDR_Master_Report.csv', rows, headers);
  }
};
