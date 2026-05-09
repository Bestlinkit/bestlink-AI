export const TEMPLATES = {
  saas_landing: {
    name: 'SaaS Landing Page',
    description: 'Modern, high-conversion landing page for software products.',
    components: ['Hero', 'Features', 'Pricing', 'Testimonials', 'FAQ', 'Footer'],
    basePrompt: 'Generate a premium SaaS landing page using a dark-themed Bento Grid layout, Inter typography, and subtle Framer Motion animations.'
  },
  real_estate: {
    name: 'Real Estate Platform',
    description: 'Luxury property showcase and agency landing page.',
    components: ['HeroSearch', 'PropertyGrid', 'AgentList', 'Newsletter', 'Footer'],
    basePrompt: 'Generate a luxury real estate platform with high-impact architectural imagery, elegant serif typography (Outfit), and glassmorphic property cards.'
  },
  portfolio: {
    name: 'Creative Portfolio',
    description: 'Personal brand showcase for designers and developers.',
    components: ['Bio', 'ProjectShowcase', 'Skills', 'Experience', 'Contact'],
    basePrompt: 'Generate a minimalist, high-contrast creative portfolio with smooth parallax scrolling, custom cursors, and large bold typography.'
  },
  dashboard: {
    name: 'Enterprise Dashboard',
    description: 'Complex data visualization and management interface.',
    components: ['Sidebar', 'StatsGrid', 'RecentActivity', 'UserManagement', 'Charts'],
    basePrompt: 'Generate a clean, light-themed enterprise dashboard with sidebar navigation, Shadcn-style components, and interactive Recharts data visualizations.'
  },
  custom: {
    name: 'Custom Project',
    description: 'Tailor-made solution for unique requirements.',
    components: [],
    basePrompt: 'Generate a custom solution based strictly on the provided requirements, maintaining high production standards and modular structure.'
  }
};

export class TemplateService {
  static getTemplate(type: string) {
    return (TEMPLATES as any)[type] || TEMPLATES.custom;
  }
}
