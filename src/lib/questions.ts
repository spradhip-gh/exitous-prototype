export interface Question {
    id: keyof AssessmentData;
    label: string;
    section: "Work & Employment Details" | "Work Circumstances" | "Systems & Benefits Access";
    type: "select" | "radio" | "checkbox" | "date" | "text";
    isActive: boolean;
    defaultValue?: string | string[];
    options?: string[];
    placeholder?: string;
    description?: string;
}

// A helper type from schemas, simplified for this context
interface AssessmentData {
    workStatus: string;
    startDate: Date;
    notificationDate: Date;
    finalDate: Date;
    workState: string;
    relocationPaid: string;
    relocationDate?: Date;
    unionMember: string;
    workArrangement: string;
    workArrangementOther?: string;
    workVisa: string;
    onLeave: string[];
    usedLeaveManagement?: string;
    accessSystems?: string[];
    internalMessagingAccessEndDate?: Date;
    emailAccessEndDate?: Date;
    networkDriveAccessEndDate?: Date;
    layoffPortalAccessEndDate?: Date;
    hrPayrollSystemAccessEndDate?: Date;
    hadMedicalInsurance: string;
    medicalCoverage?: string;
    medicalCoverageEndDate?: Date;
    hadDentalInsurance: string;
    dentalCoverage?: string;
    dentalCoverageEndDate?: Date;
    hadVisionInsurance: string;
    visionCoverage?: string;
    visionCoverageEndDate?: Date;
    hadEAP: string;
    eapCoverageEndDate?: Date;
}


export const getDefaultQuestions = (): Question[] => [
    // Work & Employment Details
    { 
        id: 'workStatus', 
        label: 'Which best describes your work status at {companyName}?',
        section: "Work & Employment Details",
        type: "select",
        isActive: true,
        defaultValue: undefined,
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
        defaultValue: undefined,
        placeholder: "Pick a date",
    },
    { 
        id: 'notificationDate', 
        label: 'On what date were you notified you were being laid off?',
        section: "Work & Employment Details",
        type: "date",
        isActive: true,
        defaultValue: undefined,
        placeholder: "Pick a date",
    },
    { 
        id: 'finalDate', 
        label: 'What is your final date of employment (termination or severance date)?',
        section: "Work & Employment Details",
        type: "date",
        isActive: true,
        defaultValue: undefined,
        placeholder: "Pick a date",
    },
    { 
        id: 'workState', 
        label: 'What state was your work based in?', 
        section: "Work & Employment Details",
        type: "select",
        isActive: true,
        defaultValue: undefined,
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
        defaultValue: undefined,
        options: ['Yes', 'No', 'Unsure'],
    },
    { 
        id: 'unionMember', 
        label: 'Did you belong to a union at the time of the layoff?', 
        section: "Work Circumstances",
        type: 'radio',
        isActive: true,
        defaultValue: undefined,
        options: ['Yes', 'No', 'Unsure'],
    },
    { 
        id: 'workArrangement', 
        label: 'Which best describes your work arrangement at the time of the layoff?', 
        section: "Work Circumstances",
        type: 'radio',
        isActive: true,
        defaultValue: undefined,
        options: ['Onsite', 'Hybrid', 'Remote', 'Other'],
    },
    { 
        id: 'workVisa', 
        label: 'Were you on any of these work visas at the time of the layoff?', 
        section: "Work Circumstances",
        type: 'select',
        isActive: true,
        defaultValue: undefined,
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
        defaultValue: undefined,
        description: 'Select all that apply.',
        options: [
            'Maternity/paternity leave', 'Caregiver leave', 'FMLA', 'Sick / health / medical leave',
            'Short- / long-term disability leave', 'Bereavement leave', 'Sabbatical leave',
            'Witness leave', 'Jury duty leave', 'Military leave', 'Other leave', 'None of the above'
        ]
    },
    // Systems & Benefits Access
    { 
        id: 'accessSystems', 
        label: 'Which of the following internal work systems do you still have access to as of today?',
        section: "Systems & Benefits Access",
        type: 'checkbox',
        isActive: true,
        defaultValue: undefined,
        options: [
            'Internal messaging system (e.g., Slack, Google Chat, Teams)', 'Email', 
            'Network drive & files', 'Special layoff portal', 'HR/Payroll system (e.g., ADP, Workday)'
        ],
    },
    { 
        id: 'hadMedicalInsurance', 
        label: 'Did you have medical insurance through {companyName}?', 
        section: "Systems & Benefits Access",
        type: 'radio',
        isActive: true,
        defaultValue: undefined,
        options: ['Yes', 'No', 'Unsure'],
    },
    { 
        id: 'hadDentalInsurance', 
        label: 'Did you have dental insurance through {companyName}?', 
        section: "Systems & Benefits Access",
        type: 'radio',
        isActive: true,
        defaultValue: undefined,
        options: ['Yes', 'No', 'Unsure'],
    },
    { 
        id: 'hadVisionInsurance', 
        label: 'Did you have vision insurance through {companyName}?', 
        section: "Systems & Benefits Access",
        type: 'radio',
        isActive: true,
        defaultValue: undefined,
        options: ['Yes', 'No', 'Unsure'],
    },
    { 
        id: 'hadEAP', 
        label: 'Did you have access to the Employee Assistance Program (EAP) through {companyName}?', 
        section: "Systems & Benefits Access",
        type: 'radio',
        isActive: true,
        defaultValue: undefined,
        options: ['Yes', 'No', 'Unsure'],
    },
];
