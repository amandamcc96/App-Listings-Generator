export async function generateListing(appDetails, marketplace) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No Anthropic API key found. Add VITE_ANTHROPIC_API_KEY to your .env file.')

  const g = marketplace.guidelines
  const prompt = `You are an expert app marketplace copywriter specializing in ERP/CRM integration apps. Generate a fully compliant listing for the ${marketplace.name} marketplace.

APP DETAILS:
- Name: ${appDetails.name}
- Version: ${appDetails.version || 'not specified'}
- ERP System: ${appDetails.erp || 'not specified'}
- CRM / Platform: ${appDetails.crm || 'not specified'}
- What it does: ${appDetails.description}
- Key features: ${appDetails.features}
- Target audience: ${appDetails.audience || 'not specified'}
- Pricing: ${appDetails.pricing || 'not specified'}
- Additional context: ${appDetails.additionalContext || 'none'}

${marketplace.name.toUpperCase()} MARKETPLACE GUIDELINES:
- App title: max ${g.maxTitle} characters
- Short description: max ${g.maxShortDesc} characters
- Long description: max ${g.maxDesc} characters
- Features to list: max ${g.maxFeatures} (each max ${g.maxFeatureLen} chars)
- Tags: max ${g.maxTags}
- Required tone: ${g.tone}
- Content rules: ${g.rules.join(' | ')}

Return ONLY a valid JSON object with exactly these keys — no preamble, no markdown fences:
{
  "title": "string within ${g.maxTitle} chars",
  "shortDescription": "string within ${g.maxShortDesc} chars",
  "longDescription": "string within ${g.maxDesc} chars",
  "features": ["array of up to ${g.maxFeatures} strings, each under ${g.maxFeatureLen} chars"],
  "tags": ["array of up to ${g.maxTags} relevant tags"],
  "complianceNotes": ["array of any potential compliance risks to review"]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'API request failed')
  }

  const data = await response.json()
  const text = data.content.map(i => i.text || '').join('')
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function publishToHubSpot(listing, apiKey) {
  // HubSpot App Marketplace publishing via their Developer API
  const response = await fetch('https://api.hubspot.com/crm/v3/objects/apps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      properties: {
        name: listing.title,
        description: listing.longDescription,
        short_description: listing.shortDescription
      }
    })
  })
  if (!response.ok) throw new Error('HubSpot publish failed')
  return response.json()
}
