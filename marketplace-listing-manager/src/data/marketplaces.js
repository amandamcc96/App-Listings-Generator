export const DEFAULT_MARKETPLACES = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    color: '#FF7A59',
    textColor: '#fff',
    icon: 'HS',
    publishable: true,
    publishDocs: 'https://developers.hubspot.com/docs/api/marketplace',
    guidelines: {
      maxTitle: 50,
      maxShortDesc: 200,
      maxDesc: 1500,
      maxFeatures: 5,
      maxFeatureLen: 100,
      maxTags: 5,
      rules: [
        'App name must reflect core function — no generic names',
        'Avoid superlatives like "best", "#1", or "most powerful"',
        'Short description is shown in search results (max 200 chars)',
        'Long description supports HTML but no unsubstantiated promotional claims',
        'List 3–5 key features — describe benefits, not marketing copy',
        'Must mention which HubSpot Hubs are supported (Sales, Marketing, Service, etc.)',
        'No pricing claims or competitor comparisons in description',
        'Screenshots must be 1280×800px minimum',
        'App icon must be 200×200px PNG with transparent background'
      ],
      tone: 'Professional, benefit-focused, clear'
    }
  },
  {
    id: 'shopify',
    name: 'Shopify',
    color: '#96BF48',
    textColor: '#fff',
    icon: 'SH',
    publishable: true,
    publishDocs: 'https://shopify.dev/docs/apps/store/success',
    guidelines: {
      maxTitle: 30,
      maxShortDesc: 160,
      maxDesc: 2000,
      maxFeatures: 6,
      maxFeatureLen: 80,
      maxTags: 8,
      rules: [
        'App name max 30 characters — must match your brand name',
        'Tagline/short description max 160 characters',
        'Avoid using "Shopify" in the app name unless officially partnered',
        'Description should address merchant pain points directly',
        'Feature bullets must start with a verb (e.g. "Sync orders automatically")',
        'No promises of specific revenue increases or guaranteed results',
        'Clearly state if a free trial or paid plan is required',
        'Must include at least 3 screenshots at 1600×900px',
        'App icon: 512×512px, no text, no rounded corners (Shopify adds them)'
      ],
      tone: 'Direct, merchant-first, action-oriented'
    }
  },
  {
    id: 'openai',
    name: 'OpenAI GPT Store',
    color: '#10A37F',
    textColor: '#fff',
    icon: 'OA',
    publishable: false,
    guidelines: {
      maxTitle: 40,
      maxShortDesc: 100,
      maxDesc: 500,
      maxFeatures: 4,
      maxFeatureLen: 80,
      maxTags: 5,
      rules: [
        'Name should clearly describe what the GPT does',
        'Short description shown in the GPT Store (max 100 chars)',
        'Do not claim to be OpenAI or an official ChatGPT product',
        'No instructions that override safety guidelines',
        'Use plain language — avoid technical jargon',
        'Must disclose if the GPT connects to external integrations or APIs',
        'Starter prompts should demonstrate clear, practical use cases',
        'Profile image must not contain copyrighted characters or logos'
      ],
      tone: 'Conversational, clear, helpful'
    }
  },
  {
    id: 'salesforce',
    name: 'Salesforce AppExchange',
    color: '#00A1E0',
    textColor: '#fff',
    icon: 'SF',
    publishable: false,
    guidelines: {
      maxTitle: 60,
      maxShortDesc: 250,
      maxDesc: 3000,
      maxFeatures: 8,
      maxFeatureLen: 120,
      maxTags: 10,
      rules: [
        'App name max 60 characters',
        'Summary (short description) max 250 characters',
        'Full description supports rich text formatting',
        'Must list supported Salesforce editions (Essentials, Professional, Enterprise, Unlimited)',
        'Include Security Review status if available — required for paid listings',
        'Feature descriptions should reference Salesforce objects where relevant',
        'Must not misrepresent AppExchange certification or Salesforce partnership status',
        'Minimum 3 screenshots; recommended 1280×960px',
        'Must include a demo video link for paid apps'
      ],
      tone: 'Enterprise, credibility-driven, detailed'
    }
  },
  {
    id: 'microsoft',
    name: 'Microsoft AppSource',
    color: '#00A4EF',
    textColor: '#fff',
    icon: 'MS',
    publishable: false,
    guidelines: {
      maxTitle: 50,
      maxShortDesc: 200,
      maxDesc: 2500,
      maxFeatures: 6,
      maxFeatureLen: 100,
      maxTags: 10,
      rules: [
        'App name max 50 characters',
        'Short description max 200 characters — shown in search results',
        'Avoid "Microsoft" or "Azure" in app name unless licensed to do so',
        'Description must include target industries and specific use cases',
        'Must clearly state compatibility (Teams, Dynamics 365, Power Platform, etc.)',
        'Minimum 5 screenshots required',
        'Privacy policy URL is mandatory',
        'Support documentation URL required',
        'Must pass Microsoft certification review before publishing'
      ],
      tone: 'Professional, enterprise-focused, compliance-aware'
    }
  },
  {
    id: 'zapier',
    name: 'Zapier',
    color: '#FF4A00',
    textColor: '#fff',
    icon: 'ZP',
    publishable: false,
    guidelines: {
      maxTitle: 40,
      maxShortDesc: 150,
      maxDesc: 1000,
      maxFeatures: 5,
      maxFeatureLen: 80,
      maxTags: 6,
      rules: [
        'App name should match your brand name exactly',
        'Tagline max 150 characters — describe what your app does',
        'Description explains what your app does and who it is for',
        'List the top 5 most-used triggers and actions',
        'Avoid vague marketing words like "powerful", "seamless", or "robust"',
        'Include example Zap workflows in the description',
        'State clearly if a free or paid plan is required to use the integration',
        'App logo must be 256×256px, square format'
      ],
      tone: 'Practical, use-case driven, concise'
    }
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    color: '#6D00CC',
    textColor: '#fff',
    icon: 'MK',
    publishable: false,
    guidelines: {
      maxTitle: 45,
      maxShortDesc: 180,
      maxDesc: 1500,
      maxFeatures: 6,
      maxFeatureLen: 100,
      maxTags: 6,
      rules: [
        'App name max 45 characters',
        'Short description max 180 characters',
        'Description should focus on automation scenarios enabled',
        'List supported modules (triggers, actions, searches)',
        'Avoid claiming exclusive or unique automation capabilities without evidence',
        'Include example scenarios (what gets automated end-to-end)',
        'Logo must be 512×512px, SVG preferred'
      ],
      tone: 'Technical-friendly, automation-focused, scenario-driven'
    }
  }
]
