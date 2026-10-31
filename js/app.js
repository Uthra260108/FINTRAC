/* ==========================================================================
   FINTRAC — Shared App UI Utilities, Toast Engine & Modal Manager
   ========================================================================== */

const FINTRAC_APP = {
  // Format Indian Currency (e.g. ₹1,50,00,000 or ₹1.5 Cr)
  formatCurrency(num, short = false) {
    if (isNaN(num)) return '₹0';
    const val = Number(num);

    if (short) {
      if (val >= 10000000) {
        return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
      } else if (val >= 100000) {
        return `₹${(val / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
      }
    }

    return '₹' + val.toLocaleString('en-IN');
  },

  // Format Date for Clean Display
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  // Toast Notification System
  showToast(title, message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="20" height="20" fill="none" stroke="#445D48" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="20" height="20" fill="none" stroke="#5E3023" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="20" height="20" fill="none" stroke="#c48f29" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      iconSvg = '<svg width="20" height="20" fill="none" stroke="#001524" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      <div style="flex-shrink: 0; margin-top: 2px;">${iconSvg}</div>
      <div class="toast-content" style="flex: 1;">
        <h5>${title}</h5>
        <p>${message}</p>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  // Modal Helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // 12-Step Lifecycle Renderer
  renderLifecycleTimeline(currentStage) {
    const stages = [
      'Draft Created',
      'Submitted by Institution',
      'Awaiting Review',
      'Under Verification',
      'Verified in Demo',
      'Discrepancy Identified',
      'Renewal Required',
      'Renewal Submitted',
      'Renewed',
      'Release Requested',
      'Release Under Review',
      'Released in Demo'
    ];

    const currentIndex = stages.indexOf(currentStage);

    let html = '<div class="timeline">';
    stages.forEach((stage, idx) => {
      let stateClass = '';
      if (idx < currentIndex) {
        stateClass = 'completed';
      } else if (idx === currentIndex) {
        stateClass = (stage === 'Discrepancy Identified' || stage === 'Renewal Required') ? 'discrepancy active' : 'active';
      }

      html += `
        <div class="timeline-item ${stateClass}">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-meta">
              <span class="timeline-title">${idx + 1}. ${stage}</span>
              ${idx === currentIndex ? '<span class="badge badge-peach">Current Stage</span>' : ''}
              ${idx < currentIndex ? '<span class="badge badge-active">Completed</span>' : ''}
            </div>
            <div class="timeline-desc">
              ${this.getLifecycleStageDescription(stage)}
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  },

  getLifecycleStageDescription(stage) {
    const descs = {
      'Draft Created': 'Initial instrument record created and saved as draft.',
      'Submitted by Institution': 'Formally submitted by institution authority with supporting FDR receipt.',
      'Awaiting Review': 'Queued in AICTE scrutiny registry pending reviewer allocation.',
      'Under Verification': 'Document scrutiny and simulated core banking verification in progress.',
      'Verified in Demo': 'Instrument confirmed with lien endorsement in prototype demonstration.',
      'Discrepancy Identified': 'Scrutiny observation logged requiring remedial institution submission.',
      'Renewal Required': 'Maturity threshold reached; rollover replacement mandated by regulations.',
      'Renewal Submitted': 'Institution uploaded fresh renewal instrument and bank confirmation letter.',
      'Renewed': 'Replacement FDR accepted; active lifecycle rollover complete.',
      'Release Requested': 'Formal application for deposit refund/release submitted with council NOC.',
      'Release Under Review': 'AICTE approval scrutiny of student clearance and institutional NOC.',
      'Released in Demo': 'Security deposit released and lien revoked in demonstration system.'
    };
    return descs[stage] || '';
  },

  // Status Badge HTML Helper
  getStatusBadge(status, category) {
    let cls = 'badge-navy';
    if (status === 'Verified in Demo' || status === 'Approved in Demo' || category === 'Active') {
      cls = 'badge-forest';
    } else if (status === 'Under Verification' || status === 'Awaiting Review' || category === 'Approaching Maturity') {
      cls = 'badge-olive';
    } else if (status === 'Discrepancy Identified' || status === 'Renewal Required' || category === 'Expiring Soon' || category === 'Matured') {
      cls = 'badge-terracotta';
    } else if (status === 'Released in Demo' || status === 'Renewed') {
      cls = 'badge-peach';
    }

    return `<span class="badge ${cls}"><span class="badge-dot"></span>${status || category}</span>`;
  },

  // Export Table Data to CSV
  exportToCSV(filename, rows, headers) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.map(h => `"${h}"`).join(",") + "\r\n";

    rows.forEach(row => {
      const line = row.map(val => {
        const text = String(val || '').replace(/"/g, '""');
        return `"${text}"`;
      }).join(",");
      csvContent += line + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('CSV Export Ready', `Downloaded ${filename} successfully.`, 'success');
  },

  // Confirm Reset Demo Data
  confirmResetDemo() {
    if (confirm("Reset prototype data to original demo state?\n\nThis will restore all default institutions, FDRs, renewals and audit logs.")) {
      FINTRAC_STORAGE.reset();
      this.showToast('Demo Data Reset', 'All records restored to initial demonstration state.', 'info');
      setTimeout(() => window.location.reload(), 800);
    }
  },

  // Global Initializer
  initGlobalUI() {
    // Backdrop click to close modals
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    // Mobile menu toggle
    const toggleBtn = document.querySelector('.btn-mobile-toggle');
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-open');
        if (backdrop) backdrop.classList.toggle('active');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('sidebar-open');
        backdrop.classList.remove('active');
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  FINTRAC_APP.initGlobalUI();
});
