export const GRANTS = [
  {
    id: '1',
    title: 'Blockchain Research Fellowship',
    description: 'A grant for students researching Algorand consensus mechanisms. This fellowship focuses on scalability, security, and decentralization in Layer-1 protocols.',
    sponsor: 'Algorand Foundation',
    coSponsors: ['MIT Media Lab', 'Blockchain Academy'],
    totalAmount: 50000,
    status: 'Active',
    student: 'Alice Johnson',
    milestones: [
      { id: 'm1', name: 'Literature Review', amount: 10000, status: 'Completed', proofHash: '0x8472...XKPL', released: true },
      { id: 'm2', name: 'Prototype Implementation', amount: 20000, status: 'Pending Approval', proofHash: '0x9211...AB92', released: false },
      { id: 'm3', name: 'Final Report', amount: 20000, status: 'Not Started', proofHash: null, released: false },
    ],
    createdAt: '2024-02-15',
  },
  {
    id: '2',
    title: 'Open Source Web3 Tooling',
    description: 'Developing developer tools for the decentralized web.',
    sponsor: 'Web3 Grant Program',
    coSponsors: [],
    totalAmount: 75000,
    status: 'Completed',
    student: 'Bob Smith',
    milestones: [
      { id: 'm4', name: 'Initial Design', amount: 25000, status: 'Completed', proofHash: '0x1122...CCDD', released: true },
      { id: 'm5', name: 'Beta Release', amount: 50000, status: 'Completed', proofHash: '0x3344...EEFF', released: true },
    ],
    createdAt: '2023-11-10',
  },
  {
    id: '3',
    title: 'DeFi Education Initiative',
    description: 'Creating educational content for decentralized finance.',
    sponsor: 'ChainLink Labs',
    coSponsors: [],
    totalAmount: 30000,
    status: 'Active',
    student: 'Charlie Davis',
    milestones: [
      { id: 'm6', name: 'Curriculum Design', amount: 15000, status: 'Completed', proofHash: '0x5566...GGHH', released: true },
      { id: 'm7', name: 'Video Series Part 1', amount: 15000, status: 'Not Started', proofHash: null, released: false },
    ],
    createdAt: '2024-01-05',
  },
];

export const BADGES = [
  { id: 'b1', name: 'Early Adopter', project: 'Blockchain Research Fellowship', date: '2024-02-20', icon: '🏆', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'b2', name: 'Code Contributor', project: 'Open Source Web3 Tooling', date: '2024-01-15', icon: '💻', color: 'bg-blue-100 text-blue-800' },
  { id: 'b3', name: 'Community Leader', project: 'DeFi Education Initiative', date: '2024-02-10', icon: '🌟', color: 'bg-purple-100 text-purple-800' },
];

export const SPONSOR_STATS = {
  totalGrants: 12,
  totalFundsLocked: 450000,
  milestonesPending: 3,
  grantsCompleted: 8,
};

export const STUDENT_STATS = {
  activeGrants: 2,
  milestonesCompleted: 5,
  fundsReceived: 125000,
  badgesEarned: 3,
};
