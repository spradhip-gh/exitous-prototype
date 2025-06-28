

export interface Question {
    id: string; // Corresponds to a field in AssessmentData or a custom ID
    label: string;
    section: string;
    type: "select" | "radio" | "checkbox" | "date" | "text";
    isActive: boolean;
    isCustom?: boolean;
    defaultValue?: string | string[];
    options?: string[];
    placeholder?: string;
    description?: string;
    lastUpdated?: string; // ISO date string
    // New properties for sub-questions
    triggerValue?: string; // The value of the parent that triggers this sub-question. If present, it's a sub-question.
    subQuestions?: Question[]; // Array of sub-questions.
    parentId?: string; // ID of the parent question.
}

export const getDefaultQuestions = (): Question[] => [
    // Work & Employment Details
    { 
        id: 'workStatus', 
        label: 'Which best describes your work status at {companyName}?',
        section: "Work & Employment Details",
        type: "select",
        isActive: true,
        placeholder: "Select a status",
        options: [
            'Contract employee: Employed for a predefined period to provide work according to contract terms',
            'Full-time employee: Employed for 40 hours or more per week with salary and benefits',
            'Independent contractor: Non-employee providing labor according to contract terms',
            'Intern or apprentice: Temporary employee providing labor for educational benefit',
            'Part-time employee: Employed at hourly wage for fewer than 40 hours per week',
            'Other'
        ],
    },
    { 
        id: 'startDate', 
        label: 'What day did you begin work?', 
        section: "Work & Employment Details",
        type: "date",
        isActive: true,
        placeholder: "Pick a date",
    },
    { 
        id: 'notificationDate', 
        label: 'On what date were you notified you were being laid off?',
        section: "Work & Employment Details",
        type: "date",
        isActive: true,
        placeholder: "Pick a date",
    },
    { 
        id: 'finalDate', 
        label: 'What is your final date of employment (termination or severance date)?',
        section: "Work & Employment Details",
        type: "date",
        isActive: true,
        placeholder: "Pick a date",
    },
    { 
        id: 'workState', 
        label: 'What state was your work based in?', 
        section: "Work & Employment Details",
        type: "select",
        isActive: true,
        placeholder: "Select a state",
        options: [ 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming' ],
    },
    // Work Circumstances
    { 
        id: 'relocationPaid', 
        label: 'Did {companyName} pay for you to relocate to your current residence?', 
        section: "Work Circumstances",
        type: 'radio',
        isActive: true,
        options: ['Yes', 'No', 'Unsure'],
        subQuestions: [
            { id: 'relocationDate', parentId: 'relocationPaid', triggerValue: 'Yes', label: 'Date of your relocation', type: 'date', isActive: true, section: "Work Circumstances", placeholder: 'Pick a date' }
        ]
    },
    { 
        id: 'unionMember', 
        label: 'Did you belong to a union at the time of the layoff?', 
        section: "Work Circumstances",
        type: 'radio',
        isActive: true,
        options: ['Yes', 'No', 'Unsure'],
    },
    { 
        id: 'workArrangement', 
        label: 'Which best describes your work arrangement at the time of the layoff?', 
        section: "Work Circumstances",
        type: 'radio',
        isActive: true,
        options: ['Onsite', 'Hybrid', 'Remote', 'Other'],
        subQuestions: [
            { id: 'workArrangementOther', parentId: 'workArrangement', triggerValue: 'Other', label: 'Please specify other work arrangement', type: 'text', isActive: true, section: "Work Circumstances", placeholder: 'Please specify' }
        ]
    },
    { 
        id: 'workVisa', 
        label: 'Were you on any of these work visas at the time of the layoff?', 
        section: "Work Circumstances",
        type: 'select',
        isActive: true,
        placeholder: "Select a visa status",
        options: [
            'H-1B', 'H-2A / H-2B', 'H-3', 'I', 'L-1A / L-1B', 'O visa', 'P', 'R', 'TN (NAFTA/USMCA)',
            'E-2 (corporate transfer as either an manager/executive or essential worker)',
            'F-1 or M-1 Students', 'E-2S/L2S/H4 EAD', 'J student / exchange visitor visa',
            'E-3 Visa (Australians only) /H1b1 Visa (Chile or Singapore only)',
            'None of the above', 'Other visa', 'Unsure'
        ],
    },
    { 
        id: 'onLeave', 
        label: 'Are you currently on any of the following types of leave?',
        section: "Work Circumstances",
        type: 'checkbox',
        isActive: true,
        description: 'Select all that apply.',
        options: [
            'Maternity/paternity leave', 'Caregiver leave', 'FMLA', 'Sick / health / medical leave',
            'Short- / long-term disability leave', 'Bereavement leave', 'Sabbatical leave',
            'Witness leave', 'Jury duty leave', 'Military leave', 'Other leave', 'None of the above'
        ],
        subQuestions: [
             { 
                 id: 'usedLeaveManagement', 
                 parentId: 'onLeave',
                 triggerValue: 'NOT_NONE', // Special case handler
                 label: 'Were you utilizing leave management (e.g., Tilt, Cocoon)?', 
                 type: 'radio', 
                 isActive: true,
                 section: 'Work Circumstances',
                 options: ['Yes', 'No', 'Unsure']
             }
        ]
    },
    // Systems & Benefits Access
    { 
        id: 'accessSystems', 
        label: 'Which of the following internal work systems do you still have access to as of today?',
        section: "Systems & Benefits Access",
        type: 'checkbox',
        isActive: true,
        options: [
            'Internal messaging system (e.g., Slack, Google Chat, Teams)', 'Email', 
            'Network drive & files', 'Special layoff portal', 'HR/Payroll system (e.g., ADP, Workday)'
        ],
        subQuestions: [
            { id: 'internalMessagingAccessEndDate', parentId: 'accessSystems', triggerValue: 'Internal messaging system (e.g., Slack, Google Chat, Teams)', label: 'Messaging Access Ends', type: 'date', isActive: true, section: 'Systems & Benefits Access'},
            { id: 'emailAccessEndDate', parentId: 'accessSystems', triggerValue: 'Email', label: 'Email Access Ends', type: 'date', isActive: true, section: 'Systems & Benefits Access'},
            { id: 'networkDriveAccessEndDate', parentId: 'accessSystems', triggerValue: 'Network drive & files', label: 'Network Access Ends', type: 'date', isActive: true, section: 'Systems & Benefits Access'},
            { id: 'layoffPortalAccessEndDate', parentId: 'accessSystems', triggerValue: 'Special layoff portal', label: 'Portal Access Ends', type: 'date', isActive: true, section: 'Systems & Benefits Access'},
            { id: 'hrPayrollSystemAccessEndDate', parentId: 'accessSystems', triggerValue: 'HR/Payroll system (e.g., ADP, Workday)', label: 'HR/Payroll Access Ends', type: 'date', isActive: true, section: 'Systems & Benefits Access'},
        ]
    },
    { 
        id: 'hadMedicalInsurance', 
        label: 'Did you have medical insurance through {companyName}?', 
        section: "Systems & Benefits Access",
        type: 'radio',
        isActive: true,
        options: ['Yes', 'No', 'Unsure'],
        subQuestions: [
            { id: 'medicalCoverage', parentId: 'hadMedicalInsurance', triggerValue: 'Yes', label: 'Who was covered?', type: 'radio', isActive: true, section: 'Systems & Benefits Access', options: ['Only me', 'Me and spouse', 'Me and family', 'Unsure'], description: "This is pre-filled based on your profile. Please verify and update if it's incorrect."},
            { id: 'medicalCoverageEndDate', parentId: 'hadMedicalInsurance', triggerValue: 'Yes', label: 'Last day of coverage?', type: 'date', isActive: true, section: 'Systems & Benefits Access', description: "This date is pre-filled based on your final day of employment. Please verify and update if it's incorrect."},
        ]
    },
    { 
        id: 'hadDentalInsurance', 
        label: 'Did you have dental insurance through {companyName}?', 
        section: "Systems & Benefits Access",
        type: 'radio',
        isActive: true,
        options: ['Yes', 'No', 'Unsure'],
        subQuestions: [
            { id: 'dentalCoverage', parentId: 'hadDentalInsurance', triggerValue: 'Yes', label: 'Who was covered?', type: 'radio', isActive: true, section: 'Systems & Benefits Access', options: ['Only me', 'Me and spouse', 'Me and family', 'Unsure'], description: "This is pre-filled based on your profile. Please verify and update if it's incorrect."},
            { id: 'dentalCoverageEndDate', parentId: 'hadDentalInsurance', triggerValue: 'Yes', label: 'Last day of coverage?', type: 'date', isActive: true, section: 'Systems & Benefits Access', description: "This date is pre-filled based on your final day of employment. Please verify and update if it's incorrect."},
        ]
    },
    { 
        id: 'hadVisionInsurance', 
        label: 'Did you have vision insurance through {companyName}?', 
        section: "Systems & Benefits Access",
        type: 'radio',
        isActive: true,
        options: ['Yes', 'No', 'Unsure'],
        subQuestions: [
            { id: 'visionCoverage', parentId: 'hadVisionInsurance', triggerValue: 'Yes', label: 'Who was covered?', type: 'radio', isActive: true, section: 'Systems & Benefits Access', options: ['Only me', 'Me and spouse', 'Me and family', 'Unsure'], description: "This is pre-filled based on your profile. Please verify and update if it's incorrect."},
            { id: 'visionCoverageEndDate', parentId: 'hadVisionInsurance', triggerValue: 'Yes', label: 'Last day of coverage?', type: 'date', isActive: true, section: 'Systems & Benefits Access', description: "This date is pre-filled based on your final day of employment. Please verify and update if it's incorrect."},
        ]
    },
    { 
        id: 'hadEAP', 
        label: 'Did you have access to the Employee Assistance Program (EAP) through {companyName}?', 
        section: "Systems & Benefits Access",
        type: 'radio',
        isActive: true,
        options: ['Yes', 'No', 'Unsure'],
        subQuestions: [
             { id: 'eapCoverageEndDate', parentId: 'hadEAP', triggerValue: 'Yes', label: 'Last day of EAP coverage?', type: 'date', isActive: true, section: 'Systems & Benefits Access', description: "This date is pre-filled based on your final day of employment. Please verify and update if it's incorrect."},
        ]
    },
];
