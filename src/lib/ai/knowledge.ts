/**
 * Echo Systems knowledge base.
 *
 * This is the structured info Ramat uses to answer visitor questions.
 * Update this file as services/pricing change — it is injected into the
 * system prompt on every conversation.
 */

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
    id: "web-development",
    name: "Web Design & Development",
    tagline: "Modern, fast, conversion-focused websites",
    description:
      "Custom websites and web applications built for performance, accessibility, and business results. From marketing sites to complex client portals.",
    features: [
      "Custom UI/UX design",
      "Responsive (mobile-first) development",
      "SEO foundations & performance optimization",
      "CMS integration (headless or traditional)",
      "E-commerce & payment integration",
      "Ongoing maintenance & support",
    ],
    deliverables: ["Design mockups", "Staging site", "Production launch", "Documentation"],
    typicalTimeline: "2–8 weeks depending on scope",
  },
  {
    id: "software-development",
    name: "Custom Software Development",
    tagline: "Tailored software that fits your business",
    description:
      "End-to-end software solutions — from internal tools and automation to customer-facing platforms — designed around your workflows.",
    features: [
      "Business process analysis",
      "Architecture & system design",
      "Full-stack development",
      "API design & third-party integrations",
      "Testing, QA & deployment",
    ],
    deliverables: ["Technical specification", "Iterative demos", "Source code", "Deployment"],
  },
  {
    id: "network-infrastructure",
    name: "Network Infrastructure & Security",
    tagline: "Secure, reliable networks for growing businesses",
    description:
      "Design, deployment and management of enterprise-grade networks, cybersecurity, and surveillance infrastructure.",
    features: [
      "LAN/WAN design & setup",
      "Firewall & cybersecurity",
      "CCTV & access control systems",
      "Structured cabling",
      "Network monitoring & maintenance",
    ],
    deliverables: ["Site survey", "Network diagram", "Installation", "Handover & training"],
  },
  {
    id: "cloud-services",
    name: "Cloud Services & DevOps",
    tagline: "Scale confidently on the cloud",
    description:
      "Cloud migration, infrastructure management, and DevOps practices so your systems stay available, secure, and cost-efficient.",
    features: [
      "Cloud migration (AWS, Azure, GCP)",
      "Infrastructure-as-Code",
      "CI/CD pipelines",
      "Monitoring, alerting & incident response",
      "Cost optimization",
    ],
    deliverables: ["Migration plan", "Infrastructure setup", "Runbook", "Knowledge transfer"],
  },
  {
    id: "erp-pos",
    name: "ERP & POS Solutions",
    tagline: "Run your operations on one connected system",
    description:
      "Enterprise resource planning and point-of-sale systems that unify sales, inventory, accounting, and reporting.",
    features: [
      "Inventory & warehouse management",
      "Sales & invoicing",
      "Accounting & financial reporting",
      "Multi-branch support",
      "Hardware supply (POS terminals, printers, scanners)",
    ],
    deliverables: ["Requirements workshop", "Configured system", "Data migration", "Training"],
  },
  {
    id: "it-support",
    name: "IT Support & Maintenance",
    tagline: "Downtime is not an option",
    description:
      "Proactive IT support and managed services to keep your business running — helpdesk, on-site visits, and SLAs.",
    features: [
      "Helpdesk (remote & on-site)",
      "Managed IT services & SLAs",
      "Hardware procurement & setup",
      "Software licensing & compliance",
      "Backup & disaster recovery",
    ],
    deliverables: ["Support plan", "SLA agreement", "Monthly reporting"],
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing & Branding",
    tagline: "Get found. Get chosen.",
    description:
      "Brand identity, digital marketing, and growth strategies that turn visibility into leads and revenue.",
    features: [
      "Brand identity & design",
      "Social media management",
      "Search engine marketing (SEM/PPC)",
      "Content strategy & creation",
      "Analytics & reporting",
    ],
    deliverables: ["Brand guide", "Campaign assets", "Monthly analytics report"],
  },
];

export const COMPANY_INFO = {
  name: "Echo Systems",
  website: "https://echosystems.ng",
  tagline: "Technology solutions that power your business",
  description:
    "Echo Systems is a Nigerian technology company providing end-to-end IT solutions for businesses and organizations — from web development and custom software to network infrastructure, cloud services, ERP/POS, IT support, and digital marketing.",
  approach:
    "We begin by understanding the client's goals, then design and deliver a solution that fits — with transparent pricing, clear timelines, and ongoing support.",
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
    return [
      `### ${s.name} (${s.tagline})`,
      s.description,
      `Features:\n${features}`,
      `Deliverables:\n${deliverables}`,
      s.typicalTimeline ? `Typical timeline: ${s.typicalTimeline}` : null,
      s.pricingNote ? `Pricing: ${s.pricingNote}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }).join("\n\n");

  const values = COMPANY_INFO.values.map((v) => `- ${v}`).join("\n");
  const process = COMPANY_INFO.process.join("\n");

  return `# Echo Systems — Company & Services Knowledge Base

## About Echo Systems
${COMPANY_INFO.description}
Tagline: "${COMPANY_INFO.tagline}"
Website: ${COMPANY_INFO.website}

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
`;
}

export const SYSTEM_PROMPT = `You are Ramat, the AI customer-service and sales assistant for Echo Systems (https://echosystems.ng). You are helpful, concise, professional, and friendly with a touch of warmth.

## Your role
- Greet visitors and help them find the information they need about Echo Systems' services.
- Qualify sales conversations naturally: ask about their needs, timeline, budget, and contact details when appropriate.
- Explain services clearly, suggest relevant options, and guide visitors toward booking a discovery call.

## Rules
- Base your answers ONLY on the provided company knowledge. If you are unsure or the question is outside the knowledge base, say honestly that you don't have that information and OFFER to open a ticket so a senior executive can follow up.
- Never invent prices, timelines, or capabilities not in the knowledge base. For pricing, guide them to a discovery call.
- Keep responses concise (2-4 short paragraphs max). Use bullet points when listing things.
- When a visitor has a complex, sensitive, or out-of-scope request, offer to open a support ticket: say you'll escalate it to a senior executive who will reach out.
- When relevant, capture the visitor's name, email, phone, and need — this helps the Echo Systems team follow up.
- Be proactive but never pushy. Prioritize being genuinely helpful.
- Always sign off subtly as "— Ramat, Echo Systems" only on your first message in a conversation, not every message.

## Ticket trigger phrases
When the visitor uses any of these intents, offer to open a ticket:
- "I want to speak to a human / a manager / someone in charge"
- "This is too complex for a bot",
- "I have a complaint",
- "I need a custom quote / proposal",
- "connect me with sales / an executive",
- questions you genuinely cannot answer from the knowledge base.
`;
