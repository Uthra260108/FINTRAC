/* ==========================================================================
   FINTRAC — LocalStorage Data Engine & State Management
   ========================================================================== */

const STORAGE_KEYS = {
  FDRS: 'fintrac_fdrs_v1',
  INSTITUTIONS: 'fintrac_institutions_v1',
  RENEWALS: 'fintrac_renewals_v1',
  RELEASES: 'fintrac_releases_v1',
  VERIFICATIONS: 'fintrac_verifications_v1',
  AUDIT: 'fintrac_audit_v1',
  ALERTS: 'fintrac_alerts_v1',
  SETTINGS: 'fintrac_settings_v1',
  INITIALIZED: 'fintrac_initialized_v1'
};

// Date Offset Helpers (generates dates relative to today so demo always displays active/expiring/matured accurately)
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Maturity Status Dynamic Calculator
function calculateMaturity(maturityDateStr, currentStatus) {
  if (currentStatus === 'Released in Demo') {
    return { daysRemaining: 0, category: 'Released', badgeClass: 'badge-released', label: 'Released (Demo)' };
  }
  if (currentStatus === 'Renewed') {
    return { daysRemaining: 0, category: 'Renewed', badgeClass: 'badge-renewed', label: 'Renewed' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(maturityDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      category: 'Matured',
      badgeClass: 'badge-matured',
      label: `Matured (${Math.abs(daysRemaining)}d ago)`
    };
  } else if (daysRemaining <= 30) {
    return {
      daysRemaining,
      category: 'Expiring Soon',
      badgeClass: 'badge-expiring',
      label: `Expiring Soon (${daysRemaining}d)`
    };
  } else if (daysRemaining <= 90) {
    return {
      daysRemaining,
      category: 'Approaching Maturity',
      badgeClass: 'badge-approaching',
      label: `Approaching (${daysRemaining}d)`
    };
  } else {
    return {
      daysRemaining,
      category: 'Active',
      badgeClass: 'badge-active',
      label: `Active (${daysRemaining}d)`
    };
  }
}

// Seed Institutions List
const SEED_INSTITUTIONS = [
  {
    id: 'INST-AICTE-1001',
    name: 'Maharashtra Institute of Technology (MIT-WPU)',
    city: 'Pune',
    state: 'Maharashtra',
    type: 'Private University',
    approvalRef: 'AICTE/WR/1-4291823/2024',
    contactPerson: 'Dr. S. K. Kulkarni',
    email: 'admin.fdr@mitwpu.edu.in',
    phone: '+91 20 2543 1795',
    totalInstruments: 5,
    activeDepositValue: 35000000
  },
  {
    id: 'INST-AICTE-1002',
    name: 'College of Engineering Pune (COEP Tech Univ)',
    city: 'Pune',
    state: 'Maharashtra',
    type: 'State Autonomous',
    approvalRef: 'AICTE/WR/1-3004812/2023',
    contactPerson: 'Prof. Ramesh Deshmukh',
    email: 'accounts@coep.ac.in',
    phone: '+91 20 2550 7000',
    totalInstruments: 4,
    activeDepositValue: 40000000
  },
  {
    id: 'INST-AICTE-1003',
    name: 'BITS Pilani - Hyderabad Campus',
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'Deemed University',
    approvalRef: 'AICTE/SC/1-8932144/2024',
    contactPerson: 'Mr. Arvind Sharma',
    email: 'fdr.desk@hyderabad.bits-pilani.ac.in',
    phone: '+91 40 6630 3999',
    totalInstruments: 4,
    activeDepositValue: 60000000
  },
  {
    id: 'INST-AICTE-1004',
    name: 'SRM Institute of Science and Technology',
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'Deemed University',
    approvalRef: 'AICTE/SR/1-9982411/2024',
    contactPerson: 'Dr. C. Muthusamy',
    email: 'finance@srmist.edu.in',
    phone: '+91 44 2745 5510',
    totalInstruments: 3,
    activeDepositValue: 45000000
  },
  {
    id: 'INST-AICTE-1005',
    name: 'Manipal Institute of Technology (MIT Manipal)',
    city: 'Manipal',
    state: 'Karnataka',
    type: 'Deemed University',
    approvalRef: 'AICTE/SW/1-7729102/2024',
    contactPerson: 'Mr. Rajesh Hegde',
    email: 'registrar.fdr@manipal.edu',
    phone: '+91 82 0292 2011',
    totalInstruments: 3,
    activeDepositValue: 35000000
  },
  {
    id: 'INST-AICTE-1006',
    name: 'RV College of Engineering',
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'Private Autonomous',
    approvalRef: 'AICTE/SW/1-5510293/2023',
    contactPerson: 'Dr. K. N. Subramanya',
    email: 'finance@rvce.edu.in',
    phone: '+91 80 6717 8000',
    totalInstruments: 2,
    activeDepositValue: 20000000
  },
  {
    id: 'INST-AICTE-1007',
    name: 'Delhi Technological University (DTU Delhi)',
    city: 'New Delhi',
    state: 'Delhi',
    type: 'State University',
    approvalRef: 'AICTE/NW/1-1192847/2023',
    contactPerson: 'Shri A. K. Verma',
    email: 'fdr-audit@dtu.ac.in',
    phone: '+91 11 2787 1018',
    totalInstruments: 3,
    activeDepositValue: 30000000
  },
  {
    id: 'INST-AICTE-1008',
    name: 'PSG College of Technology',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    type: 'Govt Aided Autonomous',
    approvalRef: 'AICTE/SR/1-6649102/2024',
    contactPerson: 'Dr. P. Radhakrishnan',
    email: 'deposit@psgtech.ac.in',
    phone: '+91 42 2257 2177',
    totalInstruments: 2,
    activeDepositValue: 20000000
  }
];

// Seed FDR Records across all lifecycle stages
function generateSeedFDRs() {
  return [
    {
      id: 'FDR-2024-001',
      referenceNumber: 'SBI-FDR-982341-A',
      institutionId: 'INST-AICTE-1001',
      institutionName: 'Maharashtra Institute of Technology (MIT-WPU)',
      issuingBank: 'State Bank of India',
      bankBranch: 'Paud Road Branch, Kothrud, Pune',
      amount: 15000000, // ₹1.5 Cr
      issueDate: getDateOffset(-700),
      maturityDate: getDateOffset(4), // Expiring in 4 days! (Urgent)
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: Member Secretary, AICTE & Registrar, MIT-WPU',
      documentName: 'SBI_FDR_Receipt_982341.pdf',
      documentSize: '1.4 MB',
      uploadDate: getDateOffset(-700),
      lifecycleStatus: 'Renewal Required',
      verificationStatus: 'Verified in Demo',
      remarks: 'Approval guarantee deposit for new Engineering & Tech divisions.',
      discrepancyNotes: 'Approaching absolute maturity date. Renewal notice dispatched.',
      independentConfirmed: {
        bankConfirmed: true,
        confirmedDate: getDateOffset(-650),
        lienMarked: true,
        officerRemarks: 'Fictional demo verification record: Instrument registered with SBI Core Banking.'
      }
    },
    {
      id: 'FDR-2024-002',
      referenceNumber: 'HDFC-FDR-871239-B',
      institutionId: 'INST-AICTE-1001',
      institutionName: 'Maharashtra Institute of Technology (MIT-WPU)',
      issuingBank: 'HDFC Bank',
      bankBranch: 'Law College Road Branch, Pune',
      amount: 10000000, // ₹1.0 Cr
      issueDate: getDateOffset(-500),
      maturityDate: getDateOffset(22), // Expiring in 22 days! (30-day bucket)
      instrumentType: 'Fixed Deposit Receipt',
      depositHolder: 'Joint: Regional Officer, AICTE WRO & MIT-WPU',
      documentName: 'HDFC_FDR_Cert_871239.pdf',
      documentSize: '890 KB',
      uploadDate: getDateOffset(-500),
      lifecycleStatus: 'Renewal Submitted',
      verificationStatus: 'Under Verification',
      remarks: 'Mandatory endowment deposit for Architecture & Design faculty.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: false,
        confirmedDate: 'Demo - Not connected',
        lienMarked: false,
        officerRemarks: 'Simulated pending bank confirmation.'
      }
    },
    {
      id: 'FDR-2024-003',
      referenceNumber: 'ICICI-FDR-554109-C',
      institutionId: 'INST-AICTE-1001',
      institutionName: 'Maharashtra Institute of Technology (MIT-WPU)',
      issuingBank: 'ICICI Bank',
      bankBranch: 'Senapati Bapat Road, Pune',
      amount: 10000000, // ₹1.0 Cr
      issueDate: getDateOffset(-365),
      maturityDate: getDateOffset(55), // Approaching in 55 days! (60-day bucket)
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: Member Secretary, AICTE & MIT-WPU',
      documentName: 'ICICI_FDR_Instrument_554109.pdf',
      documentSize: '2.1 MB',
      uploadDate: getDateOffset(-365),
      lifecycleStatus: 'Verified in Demo',
      verificationStatus: 'Verified in Demo',
      remarks: 'Endowment security for School of Pharmacy accreditation.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: true,
        confirmedDate: getDateOffset(-350),
        lienMarked: true,
        officerRemarks: 'Confirmed lien marked in favor of AICTE in demo simulation.'
      }
    },
    {
      id: 'FDR-2024-004',
      referenceNumber: 'PNB-FDR-332910-D',
      institutionId: 'INST-AICTE-1002',
      institutionName: 'College of Engineering Pune (COEP Tech Univ)',
      issuingBank: 'Punjab National Bank',
      bankBranch: 'Shivajinagar Branch, Pune',
      amount: 20000000, // ₹2.0 Cr
      issueDate: getDateOffset(-800),
      maturityDate: getDateOffset(-12), // Already Matured 12 days ago!
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: Member Secretary, AICTE & Director, COEP',
      documentName: 'PNB_Deposit_Receipt_332910.pdf',
      documentSize: '1.8 MB',
      uploadDate: getDateOffset(-800),
      lifecycleStatus: 'Discrepancy Identified',
      verificationStatus: 'Discrepancy Found',
      remarks: 'Mandatory corpus deposit. Matured without automated rollover.',
      discrepancyNotes: 'Maturity date expired without submission of renewed instrument or bank extension memo.',
      independentConfirmed: {
        bankConfirmed: true,
        confirmedDate: getDateOffset(-750),
        lienMarked: true,
        officerRemarks: 'Instrument marked overdue in core banking simulator.'
      }
    },
    {
      id: 'FDR-2024-005',
      referenceNumber: 'BOB-FDR-448201-E',
      institutionId: 'INST-AICTE-1002',
      institutionName: 'College of Engineering Pune (COEP Tech Univ)',
      issuingBank: 'Bank of Baroda',
      bankBranch: 'FC Road Branch, Pune',
      amount: 20000000, // ₹2.0 Cr
      issueDate: getDateOffset(-180),
      maturityDate: getDateOffset(185), // Active (> 90 days)
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: AICTE & COEP Tech University',
      documentName: 'BOB_Fixed_Receipt_448201.pdf',
      documentSize: '1.2 MB',
      uploadDate: getDateOffset(-180),
      lifecycleStatus: 'Verified in Demo',
      verificationStatus: 'Verified in Demo',
      remarks: 'PG Diploma and Doctoral research wing approval guarantee.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: true,
        confirmedDate: getDateOffset(-170),
        lienMarked: true,
        officerRemarks: 'Active lien confirmed in prototype registry.'
      }
    },
    {
      id: 'FDR-2024-006',
      referenceNumber: 'CAN-FDR-902318-F',
      institutionId: 'INST-AICTE-1003',
      institutionName: 'BITS Pilani - Hyderabad Campus',
      issuingBank: 'Canara Bank',
      bankBranch: 'Jawahar Nagar, Shamirpet, Hyderabad',
      amount: 25000000, // ₹2.5 Cr
      issueDate: getDateOffset(-1000),
      maturityDate: getDateOffset(78), // Approaching in 78 days (90-day bucket)
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: Member Secretary, AICTE & Director, BITS Pilani',
      documentName: 'Canara_FDR_Cert_902318.pdf',
      documentSize: '1.5 MB',
      uploadDate: getDateOffset(-1000),
      lifecycleStatus: 'Release Requested',
      verificationStatus: 'Verified in Demo',
      remarks: 'Deposit for closure of erstwhile mechanical specialisation.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: true,
        confirmedDate: getDateOffset(-950),
        lienMarked: true,
        officerRemarks: 'Release request pending scrutiny by AICTE Competent Authority.'
      }
    },
    {
      id: 'FDR-2024-007',
      referenceNumber: 'AXIS-FDR-119283-G',
      institutionId: 'INST-AICTE-1003',
      institutionName: 'BITS Pilani - Hyderabad Campus',
      issuingBank: 'Axis Bank',
      bankBranch: 'Secunderabad Main Branch',
      amount: 35000000, // ₹3.5 Cr
      issueDate: getDateOffset(-90),
      maturityDate: getDateOffset(275), // Active (> 90 days)
      instrumentType: 'Fixed Deposit Receipt',
      depositHolder: 'Joint: AICTE & BITS Pilani',
      documentName: 'Axis_Deposit_Doc_119283.pdf',
      documentSize: '2.5 MB',
      uploadDate: getDateOffset(-90),
      lifecycleStatus: 'Verified in Demo',
      verificationStatus: 'Verified in Demo',
      remarks: 'Corpus guarantee for newly sanctioned AI & Data Science intake.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: true,
        confirmedDate: getDateOffset(-80),
        lienMarked: true,
        officerRemarks: 'Verified.'
      }
    },
    {
      id: 'FDR-2024-008',
      referenceNumber: 'SBI-FDR-771829-H',
      institutionId: 'INST-AICTE-1004',
      institutionName: 'SRM Institute of Science and Technology',
      issuingBank: 'State Bank of India',
      bankBranch: 'Kattankulathur Branch, Chengalpattu',
      amount: 25000000, // ₹2.5 Cr
      issueDate: getDateOffset(-400),
      maturityDate: getDateOffset(15), // Expiring in 15 days!
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: Member Secretary, AICTE & Registrar, SRMIST',
      documentName: 'SBI_SRM_Deposit_771829.pdf',
      documentSize: '1.9 MB',
      uploadDate: getDateOffset(-400),
      lifecycleStatus: 'Awaiting Review',
      verificationStatus: 'Under Verification',
      remarks: 'Mandatory technical approval deposit for postgraduate division.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: false,
        confirmedDate: 'Demo - Pending Reviewer Action',
        lienMarked: false,
        officerRemarks: 'Assigned to Authorized Reviewer queue.'
      }
    },
    {
      id: 'FDR-2024-009',
      referenceNumber: 'UBI-FDR-663810-J',
      institutionId: 'INST-AICTE-1004',
      institutionName: 'SRM Institute of Science and Technology',
      issuingBank: 'Union Bank of India',
      bankBranch: 'Anna Salai Branch, Chennai',
      amount: 20000000, // ₹2.0 Cr
      issueDate: getDateOffset(-1200),
      maturityDate: getDateOffset(-45), // Released
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: AICTE & SRMIST',
      documentName: 'UBI_FDR_Release_Cert.pdf',
      documentSize: '850 KB',
      uploadDate: getDateOffset(-1200),
      lifecycleStatus: 'Released in Demo',
      verificationStatus: 'Verified in Demo',
      remarks: 'Course discontinued with council NOC; full deposit refund completed in prototype.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: true,
        confirmedDate: getDateOffset(-50),
        lienMarked: false,
        officerRemarks: 'Lien revoked in simulation upon authorized administrative release.'
      }
    },
    {
      id: 'FDR-2024-010',
      referenceNumber: 'HDFC-FDR-220194-K',
      institutionId: 'INST-AICTE-1005',
      institutionName: 'Manipal Institute of Technology (MIT Manipal)',
      issuingBank: 'HDFC Bank',
      bankBranch: 'Tiger Circle Branch, Manipal',
      amount: 35000000, // ₹3.5 Cr
      issueDate: getDateOffset(-15),
      maturityDate: getDateOffset(350), // Active
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: Member Secretary, AICTE & Director, MIT Manipal',
      documentName: 'HDFC_Manipal_Deposit.pdf',
      documentSize: '1.6 MB',
      uploadDate: getDateOffset(-15),
      lifecycleStatus: 'Submitted by Institution',
      verificationStatus: 'Awaiting Review',
      remarks: 'Submitted for annual regulatory compliance renewal.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: false,
        confirmedDate: 'Demo - Not connected',
        lienMarked: false,
        officerRemarks: 'Awaiting initial administrative scrutiny.'
      }
    },
    {
      id: 'FDR-2024-011',
      referenceNumber: 'SBI-FDR-440182-L',
      institutionId: 'INST-AICTE-1006',
      institutionName: 'RV College of Engineering',
      issuingBank: 'State Bank of India',
      bankBranch: 'Mysore Road, Bengaluru',
      amount: 20000000, // ₹2.0 Cr
      issueDate: getDateOffset(-5),
      maturityDate: getDateOffset(360),
      instrumentType: 'Fixed Deposit Receipt',
      depositHolder: 'Joint: AICTE & RVCE Bengaluru',
      documentName: 'RVCE_SBI_FDR_Receipt.pdf',
      documentSize: '920 KB',
      uploadDate: getDateOffset(-5),
      lifecycleStatus: 'Draft Created',
      verificationStatus: 'Awaiting Review',
      remarks: 'Draft record prepared by institution finance officer.',
      discrepancyNotes: '',
      independentConfirmed: {
        bankConfirmed: false,
        confirmedDate: 'Demo - Not submitted',
        lienMarked: false,
        officerRemarks: 'Document upload pending review submission.'
      }
    },
    {
      id: 'FDR-2024-012',
      referenceNumber: 'BOB-FDR-991204-M',
      institutionId: 'INST-AICTE-1007',
      institutionName: 'Delhi Technological University (DTU Delhi)',
      issuingBank: 'Bank of Baroda',
      bankBranch: 'Bawana Road, Shahbad Daulatpur, Delhi',
      amount: 30000000, // ₹3.0 Cr
      issueDate: getDateOffset(-850),
      maturityDate: getDateOffset(-3), // Matured 3 days ago
      instrumentType: 'Security Deposit (FDR)',
      depositHolder: 'Joint: Member Secretary, AICTE & Registrar, DTU',
      documentName: 'DTU_BOB_FDR_Doc.pdf',
      documentSize: '2.0 MB',
      uploadDate: getDateOffset(-850),
      lifecycleStatus: 'Renewal Required',
      verificationStatus: 'Verified in Demo',
      remarks: 'Corpus deposit for Computer Engineering second shift division.',
      discrepancyNotes: 'Maturity threshold passed without renewal certificate.',
      independentConfirmed: {
        bankConfirmed: true,
        confirmedDate: getDateOffset(-800),
        lienMarked: true,
        officerRemarks: 'Renewal notice logged.'
      }
    }
  ];
}

// Initial Renewal Requests
function generateSeedRenewals() {
  return [
    {
      id: 'REN-2024-01',
      originalFdrRef: 'HDFC-FDR-871239-B',
      newFdrRef: 'HDFC-REN-991002-X',
      institutionId: 'INST-AICTE-1001',
      institutionName: 'Maharashtra Institute of Technology (MIT-WPU)',
      originalBank: 'HDFC Bank',
      newBank: 'HDFC Bank',
      depositAmount: 10000000,
      originalMaturityDate: getDateOffset(22),
      newIssueDate: getDateOffset(-2),
      newMaturityDate: getDateOffset(730), // 2-year rollover
      replacementDocName: 'HDFC_Renewed_Receipt_991002.pdf',
      remarks: 'Automated 2-year tenure rollover submitted with interest capitalization.',
      status: 'Under Review',
      submittedDate: getDateOffset(-2)
    },
    {
      id: 'REN-2024-02',
      originalFdrRef: 'SBI-FDR-982341-A',
      newFdrRef: 'SBI-REN-441920-Y',
      institutionId: 'INST-AICTE-1001',
      institutionName: 'Maharashtra Institute of Technology (MIT-WPU)',
      originalBank: 'State Bank of India',
      newBank: 'State Bank of India',
      depositAmount: 15000000,
      originalMaturityDate: getDateOffset(4),
      newIssueDate: getDateOffset(-1),
      newMaturityDate: getDateOffset(1095), // 3-year rollover
      replacementDocName: 'SBI_Endorsement_Renewed_441920.pdf',
      remarks: 'Submitted urgent renewal deed prior to 4-day expiry deadline.',
      status: 'Renewal Submitted',
      submittedDate: getDateOffset(-1)
    }
  ];
}

// Initial Release / Refund Requests
function generateSeedReleases() {
  return [
    {
      id: 'REL-2024-01',
      fdrReferenceNumber: 'CAN-FDR-902318-F',
      institutionId: 'INST-AICTE-1003',
      institutionName: 'BITS Pilani - Hyderabad Campus',
      requestType: 'Course Closure / Permanent Release',
      depositAmount: 25000000,
      requestDate: getDateOffset(-10),
      reason: 'Formal closure of obsolete specialization with council clearance NOC ref #AICTE/SC/NOC-2024-881.',
      supportingDocName: 'AICTE_Council_Closure_NOC.pdf',
      remarks: 'All enrolled student batches successfully graduated and transferred.',
      status: 'Release Under Review',
      reviewerObservation: 'Initial scrutiny confirms all student NOCs accounted for. Pending final AICTE bureau clearance.',
      simulatedOutcome: 'Pending Competent Authority Approval'
    },
    {
      id: 'REL-2024-02',
      fdrReferenceNumber: 'UBI-FDR-663810-J',
      institutionId: 'INST-AICTE-1004',
      institutionName: 'SRM Institute of Science and Technology',
      requestType: 'Replacement Release',
      depositAmount: 20000000,
      requestDate: getDateOffset(-60),
      reason: 'Replaced with consolidated corporate guarantee instrument.',
      supportingDocName: 'Consolidated_Replacement_Audit.pdf',
      remarks: 'Released under AICTE Regulation Clause 11.2.',
      status: 'Released in Demo',
      reviewerObservation: 'Replacement verified and confirmed. Lien revocation memo issued.',
      simulatedOutcome: 'Released in Demo'
    }
  ];
}

// Initial Scrutiny & Verification Queue
function generateSeedVerifications() {
  return [
    {
      id: 'VER-2024-01',
      fdrReferenceNumber: 'SBI-FDR-771829-H',
      institutionId: 'INST-AICTE-1004',
      assignedReviewer: 'reviewer',
      assignedDate: getDateOffset(-3),
      status: 'Under Verification',
      decisionOutcome: 'Pending',
      observations: 'Reviewing branch seal authenticity and AICTE joint lien endorsement.',
      institutionSubmitted: {
        fdrNo: 'SBI-FDR-771829-H',
        bank: 'State Bank of India',
        branch: 'Kattankulathur Branch',
        amount: '₹2,50,00,000',
        issueDate: getDateOffset(-400),
        maturityDate: getDateOffset(15),
        holder: 'Joint: Member Secretary, AICTE & Registrar, SRMIST'
      },
      confirmedInfo: {
        status: 'Simulation Mode — Demo Only',
        lienMarkedStatus: 'Lien Pending AICTE Confirmation',
        bankReferenceConfirmed: 'SBI-REF-SIM-98211'
      }
    }
  ];
}

// Initial Audit Trail
function generateSeedAudit() {
  return [
    {
      id: 'AUDIT-1001',
      action: 'FDR Deposit Submitted',
      role: 'Institution Administrator',
      fdrReference: 'HDFC-FDR-220194-K',
      previousStatus: 'Draft Created',
      newStatus: 'Submitted by Institution',
      timestamp: new Date(Date.now() - 3600000 * 24 * 15).toLocaleString('en-IN'),
      remarks: 'New security deposit registered for annual AICTE extension.'
    },
    {
      id: 'AUDIT-1002',
      action: 'Scrutiny Observation Recorded',
      role: 'Authorized Reviewer',
      fdrReference: 'SBI-FDR-771829-H',
      previousStatus: 'Awaiting Review',
      newStatus: 'Under Verification',
      timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleString('en-IN'),
      remarks: 'Document assigned to queue for joint-lien verification.'
    },
    {
      id: 'AUDIT-1003',
      action: 'Renewal Request Submitted',
      role: 'Institution Administrator',
      fdrReference: 'HDFC-FDR-871239-B',
      previousStatus: 'Approaching Maturity',
      newStatus: 'Renewal Submitted',
      timestamp: new Date(Date.now() - 3600000 * 24 * 2).toLocaleString('en-IN'),
      remarks: 'Institution submitted replacement instrument HDFC-REN-991002-X.'
    },
    {
      id: 'AUDIT-1004',
      action: 'Discrepancy Flagged',
      role: 'AICTE Administrator',
      fdrReference: 'PNB-FDR-332910-D',
      previousStatus: 'Matured',
      newStatus: 'Discrepancy Identified',
      timestamp: new Date(Date.now() - 3600000 * 24 * 5).toLocaleString('en-IN'),
      remarks: 'Notice issued: Instrument matured without mandatory renewal certificate.'
    },
    {
      id: 'AUDIT-1005',
      action: 'Simulated Release Approved',
      role: 'AICTE Administrator',
      fdrReference: 'UBI-FDR-663810-J',
      previousStatus: 'Release Under Review',
      newStatus: 'Released in Demo',
      timestamp: new Date(Date.now() - 3600000 * 24 * 50).toLocaleString('en-IN'),
      remarks: 'Demonstration release approved following council NOC review.'
    }
  ];
}

// Storage Engine Implementation
const FINTRAC_STORAGE = {
  // Initialize storage if not already done
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      this.reset();
    }
  },

  // Reset to default seed data
  reset() {
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(SEED_INSTITUTIONS));
    localStorage.setItem(STORAGE_KEYS.FDRS, JSON.stringify(generateSeedFDRs()));
    localStorage.setItem(STORAGE_KEYS.RENEWALS, JSON.stringify(generateSeedRenewals()));
    localStorage.setItem(STORAGE_KEYS.RELEASES, JSON.stringify(generateSeedReleases()));
    localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(generateSeedVerifications()));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(generateSeedAudit()));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  // Generic Get & Set
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Storage get error:', e);
      return [];
    }
  },

  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  // FDR Methods
  getFDRs() {
    const records = this.get(STORAGE_KEYS.FDRS);
    // Enrich with dynamic maturity metadata
    return records.map(r => {
      const maturity = calculateMaturity(r.maturityDate, r.lifecycleStatus);
      return { ...r, maturityInfo: maturity };
    });
  },

  getFDRById(id) {
    const list = this.getFDRs();
    return list.find(r => r.id === id || r.referenceNumber === id);
  },

  saveFDR(fdrData) {
    const list = this.get(STORAGE_KEYS.FDRS);
    if (!fdrData.id) {
      fdrData.id = 'FDR-2024-' + String(list.length + 1).padStart(3, '0');
    }
    list.unshift(fdrData);
    this.set(STORAGE_KEYS.FDRS, list);

    this.addAuditLog(
      'New FDR Registered',
      'Institution Administrator',
      fdrData.referenceNumber,
      'None',
      fdrData.lifecycleStatus || 'Submitted by Institution',
      fdrData.remarks || 'Registered through FDR portal.'
    );

    return fdrData;
  },

  updateFDR(id, patch) {
    const list = this.get(STORAGE_KEYS.FDRS);
    const idx = list.findIndex(r => r.id === id || r.referenceNumber === id);
    if (idx !== -1) {
      const prevStatus = list[idx].lifecycleStatus;
      list[idx] = { ...list[idx], ...patch };
      this.set(STORAGE_KEYS.FDRS, list);

      if (patch.lifecycleStatus && patch.lifecycleStatus !== prevStatus) {
        this.addAuditLog(
          'FDR Status Updated',
          'System / Administrator',
          list[idx].referenceNumber,
          prevStatus,
          patch.lifecycleStatus,
          patch.discrepancyNotes || patch.remarks || 'Status updated in console.'
        );
      }
      return list[idx];
    }
    return null;
  },

  deleteFDR(id) {
    const list = this.get(STORAGE_KEYS.FDRS);
    const item = list.find(r => r.id === id || r.referenceNumber === id);
    const filtered = list.filter(r => r.id !== id && r.referenceNumber !== id);
    this.set(STORAGE_KEYS.FDRS, filtered);

    if (item) {
      this.addAuditLog(
        'FDR Record Deleted',
        'Administrator',
        item.referenceNumber,
        item.lifecycleStatus,
        'Deleted',
        'Demo record removed by administrator.'
      );
    }
    return true;
  },

  // Institutions
  getInstitutions() {
    return this.get(STORAGE_KEYS.INSTITUTIONS);
  },

  getInstitutionById(id) {
    const list = this.getInstitutions();
    return list.find(inst => inst.id === id);
  },

  // Renewals
  getRenewals() {
    return this.get(STORAGE_KEYS.RENEWALS);
  },

  submitRenewal(renewalData) {
    const list = this.getRenewals();
    renewalData.id = 'REN-2024-' + String(list.length + 1).padStart(2, '0');
    renewalData.submittedDate = new Date().toISOString().split('T')[0];
    renewalData.status = 'Renewal Submitted';
    list.unshift(renewalData);
    this.set(STORAGE_KEYS.RENEWALS, list);

    // Update parent FDR status
    this.updateFDR(renewalData.originalFdrRef, {
      lifecycleStatus: 'Renewal Submitted',
      remarks: `Renewal submitted with replacement ref: ${renewalData.newFdrRef}`
    });

    this.addAuditLog(
      'Renewal Details Submitted',
      'Institution Administrator',
      renewalData.originalFdrRef,
      'Renewal Required',
      'Renewal Submitted',
      `Replacement reference: ${renewalData.newFdrRef}. Amount: ₹${Number(renewalData.depositAmount).toLocaleString('en-IN')}`
    );

    return renewalData;
  },

  updateRenewalStatus(id, newStatus, remarks) {
    const list = this.getRenewals();
    const item = list.find(r => r.id === id);
    if (item) {
      const prevStatus = item.status;
      item.status = newStatus;
      item.adminRemarks = remarks;
      this.set(STORAGE_KEYS.RENEWALS, list);

      if (newStatus === 'Approved in Demo') {
        this.updateFDR(item.originalFdrRef, {
          lifecycleStatus: 'Renewed',
          remarks: `Renewed with instrument ${item.newFdrRef}`
        });
      }

      this.addAuditLog(
        `Renewal ${newStatus}`,
        'AICTE Administrator',
        item.originalFdrRef,
        prevStatus,
        newStatus,
        remarks || 'Simulated renewal scrutiny update.'
      );
    }
  },

  // Release / Refund
  getReleaseRequests() {
    return this.get(STORAGE_KEYS.RELEASES);
  },

  submitReleaseRequest(releaseData) {
    const list = this.getReleaseRequests();
    releaseData.id = 'REL-2024-' + String(list.length + 1).padStart(2, '0');
    releaseData.requestDate = new Date().toISOString().split('T')[0];
    releaseData.status = 'Release Under Review';
    list.unshift(releaseData);
    this.set(STORAGE_KEYS.RELEASES, list);

    this.updateFDR(releaseData.fdrReferenceNumber, {
      lifecycleStatus: 'Release Requested',
      remarks: `Release requested for reason: ${releaseData.reason}`
    });

    this.addAuditLog(
      'Release / Refund Requested',
      'Institution Administrator',
      releaseData.fdrReferenceNumber,
      'Active / Matured',
      'Release Requested',
      `Reason: ${releaseData.reason}`
    );

    return releaseData;
  },

  updateReleaseStatus(id, newStatus, reviewerObservation) {
    const list = this.getReleaseRequests();
    const item = list.find(r => r.id === id);
    if (item) {
      const prevStatus = item.status;
      item.status = newStatus;
      item.reviewerObservation = reviewerObservation;
      this.set(STORAGE_KEYS.RELEASES, list);

      if (newStatus === 'Released in Demo') {
        this.updateFDR(item.fdrReferenceNumber, {
          lifecycleStatus: 'Released in Demo',
          remarks: 'Released in simulated prototype approval.'
        });
      }

      this.addAuditLog(
        `Release Request ${newStatus}`,
        'AICTE Administrator',
        item.fdrReferenceNumber,
        prevStatus,
        newStatus,
        reviewerObservation || 'Administrative release determination.'
      );
    }
  },

  // Verifications
  getVerificationQueue() {
    return this.get(STORAGE_KEYS.VERIFICATIONS);
  },

  recordVerificationOutcome(fdrRef, outcome, observations) {
    const fdr = this.getFDRById(fdrRef);
    if (!fdr) return null;

    let newLifecycle = fdr.lifecycleStatus;
    if (outcome === 'Verified in Demo') {
      newLifecycle = 'Verified in Demo';
    } else if (outcome === 'Discrepancy Found') {
      newLifecycle = 'Discrepancy Identified';
    } else if (outcome === 'Missing Information' || outcome === 'Further Verification Required') {
      newLifecycle = 'Under Verification';
    }

    this.updateFDR(fdrRef, {
      verificationStatus: outcome,
      lifecycleStatus: newLifecycle,
      discrepancyNotes: observations,
      independentConfirmed: {
        bankConfirmed: outcome === 'Verified in Demo',
        confirmedDate: new Date().toISOString().split('T')[0],
        lienMarked: outcome === 'Verified in Demo',
        officerRemarks: observations
      }
    });

    this.addAuditLog(
      `Scrutiny: ${outcome}`,
      'Authorized Reviewer',
      fdrRef,
      fdr.verificationStatus,
      outcome,
      observations
    );

    return true;
  },

  // Audit History
  getAuditHistory() {
    return this.get(STORAGE_KEYS.AUDIT);
  },

  addAuditLog(action, role, fdrRef, prevStatus, newStatus, remarks) {
    const history = this.get(STORAGE_KEYS.AUDIT);
    const newEntry = {
      id: 'AUDIT-' + (1000 + history.length + 1),
      action,
      role,
      fdrReference: fdrRef || 'N/A',
      previousStatus: prevStatus || 'N/A',
      newStatus: newStatus || 'N/A',
      timestamp: new Date().toLocaleString('en-IN'),
      remarks: remarks || ''
    };
    history.unshift(newEntry);
    this.set(STORAGE_KEYS.AUDIT, history);
  },

  // Live Alerts Generator
  getAlerts() {
    const fdrs = this.getFDRs();
    const alerts = [];

    fdrs.forEach(f => {
      const mat = f.maturityInfo;

      if (f.lifecycleStatus === 'Released in Demo') {
        return; // Do not generate misleading reminders for released instruments
      }

      if (mat.category === 'Matured') {
        alerts.push({
          id: `ALT-MAT-${f.id}`,
          type: 'FDR Matured (Overdue)',
          priority: 'Critical',
          fdrRef: f.referenceNumber,
          institution: f.institutionName,
          date: f.maturityDate,
          badgeClass: 'badge-terracotta',
          actionRequired: 'Immediate renewal or replacement deposit required.'
        });
      } else if (mat.daysRemaining <= 7 && mat.daysRemaining >= 0) {
        alerts.push({
          id: `ALT-7D-${f.id}`,
          type: 'Maturity Imminent (<= 7 Days)',
          priority: 'Critical',
          fdrRef: f.referenceNumber,
          institution: f.institutionName,
          date: f.maturityDate,
          badgeClass: 'badge-terracotta',
          actionRequired: `Expires in ${mat.daysRemaining} days! Submit bank renewal certificate.`
        });
      } else if (mat.daysRemaining <= 30 && mat.daysRemaining > 7) {
        alerts.push({
          id: `ALT-30D-${f.id}`,
          type: 'Maturity Within 30 Days',
          priority: 'High',
          fdrRef: f.referenceNumber,
          institution: f.institutionName,
          date: f.maturityDate,
          badgeClass: 'badge-terracotta',
          actionRequired: `Expires in ${mat.daysRemaining} days. Contact bank branch for renewal terms.`
        });
      } else if (mat.daysRemaining <= 90 && mat.daysRemaining > 30) {
        alerts.push({
          id: `ALT-90D-${f.id}`,
          type: 'Approaching Maturity (90 Days)',
          priority: 'Medium',
          fdrRef: f.referenceNumber,
          institution: f.institutionName,
          date: f.maturityDate,
          badgeClass: 'badge-olive',
          actionRequired: `Instrument due in ${mat.daysRemaining} days. Plan liquidity or guarantee extension.`
        });
      }

      if (f.lifecycleStatus === 'Discrepancy Identified') {
        alerts.push({
          id: `ALT-DISC-${f.id}`,
          type: 'Discrepancy Identified',
          priority: 'Critical',
          fdrRef: f.referenceNumber,
          institution: f.institutionName,
          date: new Date().toISOString().split('T')[0],
          badgeClass: 'badge-terracotta',
          actionRequired: f.discrepancyNotes || 'Review scrutiny comments and re-upload compliant documentation.'
        });
      }

      if (f.verificationStatus === 'Under Verification') {
        alerts.push({
          id: `ALT-VER-${f.id}`,
          type: 'Verification Pending',
          priority: 'Medium',
          fdrRef: f.referenceNumber,
          institution: f.institutionName,
          date: f.uploadDate,
          badgeClass: 'badge-olive',
          actionRequired: 'Simulated reviewer verification in progress.'
        });
      }

      if (f.lifecycleStatus === 'Release Requested') {
        alerts.push({
          id: `ALT-REL-${f.id}`,
          type: 'Release Request Pending',
          priority: 'High',
          fdrRef: f.referenceNumber,
          institution: f.institutionName,
          date: f.uploadDate,
          badgeClass: 'badge-forest',
          actionRequired: 'AICTE administrator approval needed.'
        });
      }
    });

    return alerts;
  }
};

// Auto-run init
FINTRAC_STORAGE.init();
