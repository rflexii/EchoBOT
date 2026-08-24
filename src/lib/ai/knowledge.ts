export interface Service {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  deliverables: string[];
  typicalTimeline?: string;
  pricingNote?: string;
}

export const SERVICES: Service[] = [
  {
    id: "tax-management",
    name: "Tax Management",
    tagline: "Streamline tax processes and ensure compliance",
    description: "Comprehensive tax management solutions designed to streamline your tax processes, ensure regulatory compliance, and optimize tax operations for businesses and government agencies.",
    features: [
      "Automated tax calculation and filing",
      "Real-time tax reporting and analytics",
      "Multi-jurisdiction tax compliance",
      "Integration with existing financial systems",
      "Audit trail and documentation management",
    ],
    deliverables: ["Tax assessment system", "Filing platform", "Compliance dashboard", "Training"],
    typicalTimeline: "4–12 weeks depending on scope",
  },
  {
    id: "payment-gateway",
    name: "Payment Gateway",
    tagline: "Secure and reliable payment processing",
    description: "Secure, reliable, and seamless payment processing solutions that enable businesses to accept payments across multiple channels with robust fraud protection.",
    features: [
      "Multi-card and bank transfer support",
      "Mobile money integration",
      "Real-time transaction monitoring",
      "PCI-DSS compliant infrastructure",
      "Settlement and reconciliation automation",
    ],
    deliverables: ["Payment platform", "Merchant dashboard", "Integration API", "Documentation"],
    typicalTimeline: "6–16 weeks",
  },
  {
    id: "revenue-management",
    name: "Revenue Management",
    tagline: "Optimise and maximise revenue collections",
    description: "Advanced revenue management systems for governments and large organisations to optimise and maximise revenue collections across all sectors.",
    features: [
      "Revenue tracking and analytics",
      "Automated billing and invoicing",
      "Multi-channel payment collection",
      "Reporting and forecasting dashboards",
      "Integration with tax and treasury systems",
    ],
    deliverables: ["Revenue platform", "Analytics dashboard", "Integration layer", "Training"],
    typicalTimeline: "8–20 weeks",
  },
  {
    id: "core-banking",
    name: "Core Banking Solutions",
    tagline: "Robust platforms for modern financial institutions",
    description: "Robust, scalable core banking platforms designed for modern financial institutions to manage accounts, transactions, lending, and customer relationships.",
    features: [
      "Account management (savings, current, fixed deposit)",
      "Loan and credit management",
      "Real-time transaction processing",
      "Customer relationship management (CRM)",
      "Regulatory reporting and compliance",
    ],
    deliverables: ["Core banking platform", "Admin dashboard", "Mobile banking app", "API integration"],
    typicalTimeline: "12–36 weeks",
  },
  {
    id: "financial-inclusion",
    name: "Financial Inclusion",
    tagline: "Promoting access through innovative technology",
    description: "Promoting financial access and inclusion through innovative technology solutions that bring banking and financial services to underserved communities.",
    features: [
      "Agent banking platforms",
      "Microfinance management",
      "Mobile wallet solutions",
      "KYC and identity verification",
      "Financial literacy tools",
    ],
    deliverables: ["Inclusion platform", "Mobile wallet", "Agent management system", "Training"],
    typicalTimeline: "8–20 weeks",
  },
  {
    id: "web-mobile",
    name: "Web & Mobile Applications",
    tagline: "Custom development for your business needs",
    description: "Custom web and mobile application development tailored to your business needs, from customer-facing portals to internal management tools.",
    features: [
      "Responsive web applications",
      "Native and cross-platform mobile apps",
      "Progressive web apps (PWA)",
      "UI/UX design and prototyping",
      "Ongoing maintenance and support",
    ],
    deliverables: ["Web application", "Mobile app", "Design system", "Documentation"],
    typicalTimeline: "4–16 weeks",
  },
  {
    id: "erestaurant",
    name: "eRestaurant.ng",
    tagline: "Comprehensive restaurant management",
    description: "Comprehensive restaurant management system to streamline operations, manage orders, inventory, and enhance customer experience.",
    features: [
      "Order and table management",
      "Inventory and stock tracking",
      "Menu management",
      "Customer loyalty programs",
      "Sales analytics and reporting",
    ],
    deliverables: ["Restaurant platform", "POS integration", "Customer app", "Admin dashboard"],
    typicalTimeline: "4–10 weeks",
  },
  {
    id: "ejudiciary",
    name: "eJudiciary.ng",
    tagline: "Digital transformation for judicial systems",
    description: "Digital transformation solution for judicial systems with efficient case management, document management, and court administration.",
    features: [
      "Case management and tracking",
      "Digital document management",
      "Court scheduling and calendar",
      "Automated notifications",
      "Judgment and order management",
    ],
    deliverables: ["Judiciary platform", "Case database", "Document system", "Training"],
    typicalTimeline: "8–20 weeks",
  },
  {
    id: "systems-automation",
    name: "Systems Automation",
    tagline: "End-to-end business process automation",
    description: "Custom end-to-end business process automation to streamline operations, reduce manual effort, and improve organisational efficiency.",
    features: [
      "Process mapping and analysis",
      "Workflow automation",
      "Integration of disparate systems",
      "Robotic process automation (RPA)",
      "Monitoring and reporting dashboards",
    ],
    deliverables: ["Automated workflows", "Integration layer", "Monitoring dashboard", "Documentation"],
    typicalTimeline: "6–16 weeks",
  },
];

export const COMPANY_INFO = {
  name: "Echo Systems Network Ltd.",
  website: "https://echosystems.ng",
  tagline: "Leading Financial Technology Solutions",
  description: "Echo Systems Network Ltd. is a Nigerian technology company empowering businesses with innovative fintech solutions for tax management, payments, revenue management, banking, and financial inclusion. Founded with a vision to drive digital transformation across Africa.",
  mission: "To provide cutting-edge technological solutions that empower businesses to achieve their goals through innovation, reliability, and excellence.",
  vision: "To be the leading provider of technology solutions in Africa, driving digital transformation and financial inclusion across the continent.",
  whyChooseUs: [
    "Industry-leading expertise in fintech solutions",
    "Proven track record of successful implementations",
    "Comprehensive support and maintenance",
    "Custom solutions tailored to your needs",
  ],
  contact: {
    abuja: "Plot 903 Tafawa Balewa Way, Garki, Abuja, Nigeria",
    kwara: "16B Police Road, GRA, Ilorin, Kwara, Nigeria",
  },
  approach: "We begin by understanding the client's goals and constraints, then design and deliver a solution that fits — with transparent pricing, clear timelines, and ongoing support.",
  values: [
    "Client-first: solutions tailored to your real needs",
    "Quality: we build things that last",
    "Transparency: clear communication, no surprises",
    "Support: we stay with you after launch",
  ],
  process: [
    "1. Discovery call — understand your goals and constraints",
    "2. Proposal — scope, timeline, and transparent pricing",
    "3. Design & build — iterative demos, your feedback throughout",
    "4. Launch & handover — deployment, training, documentation",
    "5. Ongoing support — maintenance, growth, and optimization",
  ],
};

export function buildKnowledgePrompt(): string {
  const servicesText = SERVICES.map((s) => {
    const features = s.features.map((f) => `    - ${f}`).join("\n");
    const deliverables = s.deliverables.map((d) => `    - ${d}`).join("\n");
    return [`### ${s.name} (${s.tagline})`, s.description, `Features:\n${features}`, `Deliverables:\n${deliverables}`, s.typicalTimeline ? `Typical timeline: ${s.typicalTimeline}` : null].filter(Boolean).join("\n");
  }).join("\n\n");

  const values = COMPANY_INFO.values.map((v) => `- ${v}`).join("\n");
  const process = COMPANY_INFO.process.join("\n");
  const whyUs = COMPANY_INFO.whyChooseUs.map((w) => `- ${w}`).join("\n");

  return `# Echo Systems Network Ltd. — Company & Services Knowledge Base

## About Echo Systems Network Ltd.
${COMPANY_INFO.description}
Tagline: "${COMPANY_INFO.tagline}"
Website: ${COMPANY_INFO.website}

## Mission
${COMPANY_INFO.mission}

## Vision
${COMPANY_INFO.vision}

## Why Choose Us
${whyUs}

## Our Approach
${COMPANY_INFO.approach}

## Values
${values}

## Our Process
${process}

## Services We Offer
${servicesText}

## Pricing
Pricing is scoped per project based on requirements. We provide detailed, transparent proposals after a discovery call. Visitors should be encouraged to book a free discovery call for an accurate quote rather than expecting fixed online prices.

## Contact
- Abuja Office: ${COMPANY_INFO.contact.abuja}
- Kwara Office: ${COMPANY_INFO.contact.kwara}
- Website: ${COMPANY_INFO.website}
`;
}

export const SYSTEM_PROMPT = `You are Ramat, the AI customer-service and sales assistant for Echo Systems Network Ltd. (https://echosystems.ng). You are knowledgeable, helpful, concise, professional, and friendly. You have deep knowledge about the company and its services.

## Your role
- Greet visitors warmly and help them find information about Echo Systems' services.
- Qualify sales conversations naturally: ask about their needs, timeline, budget, and contact details when appropriate.
- Explain services clearly with specific features and deliverables.
- **Create support tickets** when a visitor has a complex request, complaint, or needs human intervention. Tell them you're creating a ticket with a unique tracking number.
- Provide accurate contact details: Abuja office at Plot 903 Tafawa Balewa Way, Garki, Abuja; Kwara office at 16B Police Road, GRA, Ilorin.

## Rules
- Base your answers ONLY on the provided company knowledge. Never invent information.
- Keep responses concise (2-4 short paragraphs max). Use bullet points when listing things.
- When a visitor needs human intervention, create a support ticket and tell them a senior executive will follow up.
- Capture the visitor's name, email, phone, and need — this helps the team follow up.
- Be proactive but never pushy.
- Sign off as "— Ramat, Echo Systems" only on your first message.

## Ticket triggers
Create a support ticket when the visitor asks to speak to a human/manager, has a complaint, needs a custom quote, or asks something outside your knowledge base.
`;