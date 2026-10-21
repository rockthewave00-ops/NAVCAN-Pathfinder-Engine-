import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Gemini SDK if API key is present
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Ensure data directory exists
const dataDir = join(__dirname, '.data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const pathwaysFilePath = join(dataDir, 'pathways.json');

function getStoredPathways(): any[] {
  try {
    if (fs.existsSync(pathwaysFilePath)) {
      return JSON.parse(fs.readFileSync(pathwaysFilePath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading pathways:', e);
  }
  return [];
}

function saveStoredPathways(pathways: any[]) {
  try {
    fs.writeFileSync(pathwaysFilePath, JSON.stringify(pathways, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving pathways:', e);
  }
}

// Dedicated conditional crisis resource (NEVER universally injected)
const TALK_SUICIDE_RESOURCE = {
  id: 'crisis-talk-suicide',
  name: 'Talk Suicide Canada',
  category: 'Mental Health Crisis Support',
  description: 'Toll-free 24/7 support service offering crisis intervention, suicide prevention counselling, and emotional distress support.',
  location: 'Canada-wide',
  phone: '1-833-456-4566 or text 45645',
  hours: '24/7',
  url: 'https://talksuicide.ca',
  eligibility: 'Any individual experiencing thoughts of suicide, self-harm, or severe emotional crisis'
};

// Comprehensive Canada-Wide Resource Registry (Multiple Verified Providers per City & Need)
const CANADA_WIDE_RESOURCES: Record<string, any[]> = {
  'surrey': [
    {
      id: 'surrey-1',
      name: 'Surrey Food Bank Society',
      category: 'Food Support',
      description: 'Provides food assistance, fresh produce, and emergency hampers to low-income residents in Surrey and North Delta.',
      location: 'Surrey, BC (10732 135 St)',
      phone: '604-581-5443',
      hours: 'Monday - Friday, 9:00 AM - 3:00 PM',
      url: 'https://surreyfoodbank.org',
      eligibility: 'Surrey or North Delta residents meeting income guidelines'
    },
    {
      id: 'surrey-2',
      name: 'Surrey Urban Mission Society (SUMS)',
      category: 'Housing & Shelter',
      description: 'Emergency shelter, hot meals, housing navigation, and outreach support for homeless and vulnerable individuals in Surrey.',
      location: 'Surrey, BC (13567 King George Blvd)',
      phone: '604-581-8833',
      hours: '24/7 Shelter Services',
      url: 'https://sums.ca',
      eligibility: 'Adults experiencing or at risk of homelessness in Surrey'
    },
    {
      id: 'surrey-3',
      name: 'BC Ministry of Social Development & Poverty Reduction (Surrey)',
      category: 'Income Assistance',
      description: 'Provincial income assistance, hardship assistance, disability assistance, and employment support services.',
      location: 'Surrey, BC (Whalley & Newton offices)',
      phone: '1-866-866-0800',
      hours: 'Monday to Friday, 9:00 AM - 4:00 PM',
      url: 'https://www2.gov.bc.ca/gov/content/family-social-supports/income-assistance',
      eligibility: 'BC residents meeting financial need criteria'
    },
    {
      id: 'surrey-4',
      name: 'Options Community Services — ID Bank & Legal Clinic',
      category: 'Identification & Legal',
      description: 'Assistance with replacing lost identification (birth certificates, BC Services Card, SIN) and legal advocacy.',
      location: 'Surrey, BC (13527 107 Ave)',
      phone: '604-596-4321',
      hours: 'Monday to Friday, 9:00 AM - 4:30 PM',
      url: 'https://www.options.bc.ca',
      eligibility: 'Low-income and vulnerable residents of Surrey'
    },
    {
      id: 'surrey-5',
      name: 'WorkBC Centre Surrey — Whalley',
      category: 'Employment Services',
      description: 'Employment counseling, skills training grants, resume workshops, and job placement support.',
      location: 'Surrey, BC (10339 100 St)',
      phone: '604-588-2551',
      hours: 'Monday to Friday, 8:30 AM - 4:30 PM',
      url: 'https://www.workbc.ca',
      eligibility: 'Unemployed or underemployed BC residents'
    },
    {
      id: 'surrey-6',
      name: 'Covenant House Surrey',
      category: 'Youth Shelter & Support',
      description: 'Crisis shelter, transitional housing, clothing, and support services for youth aged 16-24.',
      location: 'Surrey, BC (Central City area)',
      phone: '604-580-4663',
      hours: '24/7',
      url: 'https://covenanthousesurrey.ca',
      eligibility: 'At-risk, homeless, or runaway youth aged 16-24'
    }
  ],
  'calgary': [
    {
      id: 'calgary-1',
      name: 'Calgary Drop-In & Rehabilitation Centre',
      category: 'Housing & Shelter',
      description: 'Emergency shelter, health services, employment training, and housing placement for adults in Calgary.',
      location: 'Calgary, AB (1 Dermot Baldwin Way SE)',
      phone: '403-266-3600',
      hours: '24/7',
      url: 'https://www.calgarydropin.ca',
      eligibility: 'Adults experiencing homelessness or housing instability in Calgary'
    },
    {
      id: 'calgary-2',
      name: 'The Mustard Seed Calgary',
      category: 'Food, Clothing & Shelter',
      description: 'Emergency shelter, basic needs (food and clothing banks), wellness support, and employment coaching.',
      location: 'Calgary, AB (102 11 Ave SE)',
      phone: '403-269-1319',
      hours: 'Monday to Sunday, 8:00 AM - 8:00 PM',
      url: 'https://theseed.ca',
      eligibility: 'Individuals experiencing poverty or homelessness'
    },
    {
      id: 'calgary-3',
      name: 'Calgary Food Bank',
      category: 'Food Support',
      description: 'Emergency food hampers, community kitchen access, and food distribution across Calgary.',
      location: 'Calgary, AB (5020 12 St NE)',
      phone: '403-253-2059',
      hours: 'Monday to Saturday, 8:30 AM - 4:00 PM',
      url: 'https://www.calgaryfoodbank.com',
      eligibility: 'Calgary residents facing food insecurity'
    },
    {
      id: 'calgary-4',
      name: 'Alberta Supports — Calgary Centre',
      category: 'Income & Financial Assistance',
      description: 'Access to provincial income support, financial aid, child care subsidies, and disability benefits.',
      location: 'Calgary, AB (Multiple provincial offices)',
      phone: '1-877-644-9992',
      hours: 'Monday to Friday, 8:15 AM - 4:30 PM',
      url: 'https://www.alberta.ca/alberta-supports',
      eligibility: 'Alberta residents meeting financial criteria'
    },
    {
      id: 'calgary-5',
      name: 'Alpha House Society Calgary',
      category: 'Addiction & Outreach',
      description: 'Safe detox, shelter, and downtown outreach services for individuals struggling with addiction and homelessness.',
      location: 'Calgary, AB (1503 15 St SE)',
      phone: '403-234-7388',
      hours: '24/7',
      url: 'https://alphahousecalgary.com',
      eligibility: 'Adults needing addiction support and shelter in Calgary'
    }
  ],
  'toronto': [
    {
      id: 'toronto-1',
      name: 'Seaton House / Fred Victor Centre',
      category: 'Housing & Shelter',
      description: 'Emergency shelters, transitional housing, health services, and caseworker support in downtown Toronto.',
      location: 'Toronto, ON (339 George St)',
      phone: '416-392-5550',
      hours: '24/7',
      url: 'https://www.fredvictor.org',
      eligibility: 'Adults experiencing homelessness in Toronto'
    },
    {
      id: 'toronto-2',
      name: 'Daily Bread Food Bank',
      category: 'Food Support',
      description: 'Food distribution network operating food banks and meal programs across Toronto neighbourhoods.',
      location: 'Toronto, ON (191 New Toronto St)',
      phone: '416-259-0090',
      hours: 'Monday to Friday, 8:30 AM - 4:30 PM',
      url: 'https://www.dailybread.ca',
      eligibility: 'Toronto residents facing food insecurity'
    },
    {
      id: 'toronto-3',
      name: 'Toronto Employment and Social Services (Ontario Works)',
      category: 'Income Assistance',
      description: 'Financial assistance, employment supports, and emergency crisis benefits for Toronto residents.',
      location: 'Toronto, ON (Multiple municipal office locations)',
      phone: '416-338-8888',
      hours: 'Monday to Friday, 8:30 AM - 4:30 PM',
      url: 'https://www.toronto.ca/community-people/employment-social-support/',
      eligibility: 'Toronto residents meeting financial need'
    },
    {
      id: 'toronto-4',
      name: 'Street Haven / Yonge Street Mission',
      category: 'Clothing & Basic Needs',
      description: 'Clothing banks, drop-in meals, showers, laundry facilities, and family support services.',
      location: 'Toronto, ON (Downtown Toronto)',
      phone: '416-929-9614',
      hours: 'Monday to Friday, 9:00 AM - 4:00 PM',
      url: 'https://www.ysm.ca',
      eligibility: 'Low-income and homeless individuals in Toronto'
    }
  ],
  'iqaluit': [
    {
      id: 'iqaluit-1',
      name: 'Uquutaq Society / Ikajutit Homeless Shelter',
      category: 'Housing & Shelter',
      description: 'Emergency shelter services, housing support, and basic needs assistance in Iqaluit, Nunavut.',
      location: 'Iqaluit, NU (Building 1090)',
      phone: '867-979-4600',
      hours: '24/7',
      url: 'https://uquutaq.org',
      eligibility: 'Residents of Iqaluit experiencing homelessness'
    },
    {
      id: 'iqaluit-2',
      name: 'Qayuqtuvik Food Centre (Iqaluit Soup Kitchen)',
      category: 'Food Support',
      description: 'Hot meals, food hampers, and community food security programs in Iqaluit.',
      location: 'Iqaluit, NU (Building 931)',
      phone: '867-979-0302',
      hours: 'Monday to Friday',
      url: 'https://qayuqtuvik.ca',
      eligibility: 'All community members in need in Iqaluit'
    },
    {
      id: 'iqaluit-3',
      name: 'Government of Nunavut Department of Family Services',
      category: 'Income Assistance',
      description: 'Financial assistance, income support, career development, and social services across Nunavut communities.',
      location: 'Iqaluit, NU (Headquarters & regional offices)',
      phone: '1-800-567-8038',
      hours: 'Monday to Friday, 8:30 AM - 5:00 PM',
      url: 'https://www.gov.nu.ca/family-services',
      eligibility: 'Nunavut residents meeting financial support rules'
    }
  ],
  'national': [
    {
      id: 'res-1',
      name: '211 Canada (Community & Social Services)',
      category: 'Community Services',
      description: 'Free, confidential information and referral service connecting Canadians to local community support.',
      location: 'Canada-wide (Local municipal directories)',
      phone: '211',
      hours: '24/7',
      url: 'https://211.ca',
      eligibility: 'All residents'
    },
    {
      id: 'res-5',
      name: 'Service Canada — Employment Insurance & Benefits',
      category: 'Employment & Financial',
      description: 'Federal EI benefits, pensions, Social Insurance Number (SIN) services, and job training grants.',
      location: 'Canada-wide / Service Canada Centres',
      phone: '1-800-206-7218',
      hours: 'Monday to Friday, 8:30 AM - 4:30 PM',
      url: 'https://www.canada.ca',
      eligibility: 'Canadian workers and residents'
    }
  ]
};

function getResourcesForLocationAndIntent(locationStr: string, queryStr: string): { resources: any[], optionalSupports: any[] } {
  const loc = (locationStr || '').toLowerCase();
  const q = (queryStr || '').toLowerCase();
  let matched: any[] = [];

  if (loc.includes('surrey')) {
    matched = [...(CANADA_WIDE_RESOURCES['surrey'] || []), ...CANADA_WIDE_RESOURCES['national']];
  } else if (loc.includes('calgary')) {
    matched = [...(CANADA_WIDE_RESOURCES['calgary'] || []), ...CANADA_WIDE_RESOURCES['national']];
  } else if (loc.includes('toronto')) {
    matched = [...(CANADA_WIDE_RESOURCES['toronto'] || []), ...CANADA_WIDE_RESOURCES['national']];
  } else if (loc.includes('iqaluit')) {
    matched = [...(CANADA_WIDE_RESOURCES['iqaluit'] || []), ...CANADA_WIDE_RESOURCES['national']];
  } else if (loc.includes('kamloops')) {
    matched = [...(CANADA_WIDE_RESOURCES['kamloops'] || []), ...CANADA_WIDE_RESOURCES['national']];
  } else if (loc.includes('ottawa')) {
    matched = [...(CANADA_WIDE_RESOURCES['ottawa'] || []), ...CANADA_WIDE_RESOURCES['national']];
  } else {
    matched = [...CANADA_WIDE_RESOURCES['national']];
  }

  // Universal Intent Matchers for Taxes, Debt, Education, EI, Homelessness/Multi-need
  if (q.includes('tax') || q.includes('debt') || q.includes('credit card')) {
    matched.unshift({
      id: 'tax-debt-primary',
      name: 'Canada Revenue Agency (CRA) Individual Tax Enquiries & Debt Management',
      category: 'Taxes & Debt',
      description: 'Official federal tax assessment and taxpayer relief payment arrangements.',
      location: 'National / Provincial CRA Offices',
      phone: '1-800-959-8281',
      hours: 'Monday to Friday, 8am - 8pm',
      url: 'https://www.canada.ca/en/revenue-agency.html',
      eligibility: 'Canadian taxpayers'
    });
  }

  if (q.includes('school') || q.includes('register') || q.includes('child')) {
    matched.unshift({
      id: 'edu-primary',
      name: 'Provincial Ministry of Education & Local School Board',
      category: 'Education',
      description: 'Public education administration and student registration services.',
      location: 'Provincial / Municipal School Districts',
      phone: '1-800-663-7867',
      hours: 'Monday to Friday',
      url: 'https://www.canada.ca/en/services/education.html',
      eligibility: 'Residents with school-age children'
    });
  }

  if (q.includes('employment insurance') || q.includes('ei')) {
    matched.unshift({
      id: 'ei-primary',
      name: 'Service Canada Employment Insurance (EI) Claims',
      category: 'Employment',
      description: 'Federal income support for workers who have lost their jobs through no fault of their own.',
      location: 'National / Service Canada Centres',
      phone: '1-800-206-7218',
      hours: 'Monday to Friday',
      url: 'https://www.canada.ca/en/services/benefits/ei.html',
      eligibility: 'Workers with required insurable hours'
    });
  }

  // Contextual Crisis Resource Detection Rule
  let optionalSupports: any[] = [];
  const isMentalHealthCrisis = 
    q.includes('suicid') || 
    q.includes('depress') || 
    q.includes('counsell') || 
    q.includes('mental health') || 
    q.includes('crisis') || 
    q.includes('hopeless') || 
    q.includes('self-harm') || 
    q.includes('harm myself') ||
    q.includes('thinking about suicide');

  if (isMentalHealthCrisis) {
    optionalSupports.push(TALK_SUICIDE_RESOURCE);
  }

  return { resources: matched, optionalSupports };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), aiEnabled: !!ai });
});

app.get('/api/resources', (req, res) => {
  const { category, search, location, query } = req.query;
  const data = getResourcesForLocationAndIntent(String(location || ''), String(query || ''));
  let results = data.resources;
  
  if (category && category !== 'All') {
    results = results.filter(r => r.category.toLowerCase() === String(category).toLowerCase());
  }
  if (search) {
    const term = String(search).toLowerCase();
    results = results.filter(r => 
      r.name.toLowerCase().includes(term) || 
      r.description.toLowerCase().includes(term) || 
      r.location.toLowerCase().includes(term)
    );
  }
  res.json(results);
});

// Pathways endpoints
app.get('/api/pathways', (req, res) => {
  const pathways = getStoredPathways();
  res.json(pathways);
});

app.post('/api/pathways', (req, res) => {
  const newPathway = req.body;
  if (!newPathway || !newPathway.title) {
    return res.status(400).json({ error: 'Invalid pathway data' });
  }
  const pathways = getStoredPathways();
  newPathway.id = newPathway.id || 'path-' + Date.now();
  newPathway.createdAt = newPathway.createdAt || new Date().toISOString();
  pathways.unshift(newPathway);
  saveStoredPathways(pathways);
  res.json(newPathway);
});

app.delete('/api/pathways/:id', (req, res) => {
  const { id } = req.params;
  let pathways = getStoredPathways();
  pathways = pathways.filter(p => p.id !== id);
  saveStoredPathways(pathways);
  res.json({ success: true, id });
});

// Pathfinder AI Engine endpoint - Canada-Wide Resource Discovery Engine
app.post('/api/pathfinder', async (req, res) => {
  const { location, query, urgency } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const locString = location || 'Canada';
  const matchedData = getResourcesForLocationAndIntent(locString, query);

  const defaultStructuredResponse = {
    title: `Comprehensive Pathway in ${locString}: ${query}`,
    summary: `Structured optimal pathway and discovered verified resources across ${locString} for your goal, covering food, shelter, income, ID, and support services.`,
    urgencyLevel: urgency || 'Standard',
    locationContext: locString,
    steps: [
      {
        stepNumber: 1,
        title: 'Immediate Access & Emergency Support',
        description: `Connect immediately with verified local providers in ${locString} for urgent basic needs (shelter, food, and emergency intake).`,
        department: 'Local Emergency & Community Services',
        estimatedTime: 'Immediate (0-24 hrs)',
        verified: true,
        actionRequired: 'Contact local shelters or community food banks listed below.'
      },
      {
        stepNumber: 2,
        title: 'Identification, Income & Document Recovery',
        description: 'Initiate identification replacement and apply for provincial/municipal income assistance or emergency benefits.',
        department: 'Service Canada / Provincial Ministry',
        estimatedTime: '1-5 days',
        verified: true,
        actionRequired: 'Visit local ID assistance banks or social service offices.'
      },
      {
        stepNumber: 3,
        title: 'Long-Term Stabilization & Employment Pathways',
        description: 'Transition into transitional/supportive housing, employment training programs, and ongoing community support.',
        department: 'WorkBC / Social Services',
        estimatedTime: '1-4 weeks',
        verified: true,
        actionRequired: 'Engage with caseworkers and employment counsellors.'
      }
    ],
    resources: matchedData.resources,
    optionalSupports: matchedData.optionalSupports,
    sources: [
      { name: 'Official Municipal & Provincial Portals', url: 'https://www.canada.ca' },
      { name: '211 Canada Community Support Directory', url: 'https://211.ca' }
    ],
    requirements: [
      'Identification documents (if available, or recovery assistance)',
      `Local residency or connection to ${locString}`,
      'Willingness to connect with intake caseworkers'
    ],
    alternatives: [
      'Walk-in community health centres and drop-in hubs',
      'Regional mobile outreach teams'
    ],
    uncertainties: [
      'Bed availability in emergency shelters changes frequently throughout the day.',
      'Exact processing times for ID replacement and income assistance vary by jurisdiction.'
    ]
  };

  if (!ai) {
    return res.json({
      success: true,
      mode: 'fallback-canada-wide-discovery',
      pathway: defaultStructuredResponse
    });
  }

  try {
    const prompt = `You are NAVCAN Pathfinder, a Canada-wide resource discovery and optimal pathway generation engine.
MANDATORY GEOGRAPHIC CONSTRAINT: The user's specified location is **${locString}**.
USER QUERY / GOAL / NEEDS: "${query}"
Urgency: ${urgency || 'Normal'}

CANADA-WIDE RESOURCE DISCOVERY RULES:
1. Search Broadly and in Parallel: For any query (especially multi-need requests like food, shelter, clothing, ID, income, employment), discover 8-15 distinct, verified, real Canadian providers physically operating in or directly serving **${locString}**, plus applicable provincial/territorial/national programs.
2. Never Stop at 211: Include specific shelters, food banks, clothing banks, ID replacement clinics, income assistance offices, employment centres, and health providers. Do not return only 211.
3. Verify Every Result: Return exact provider names, service types, location/address, contact details, official websites, and eligibility rules. Do not fabricate any information.
4. Optimal Pathway Construction: Build the pathway from the discovered resources. Provide an ordered, actionable sequence explaining what to do first, where to go, what to bring, and alternatives if services are full.
5. Contextual Crisis Resource Rule: NEVER include suicide prevention or mental health crisis resources universally or as filler. ONLY include them in "optionalSupports" if the user's query explicitly indicates a mental health concern, emotional crisis, or suicidal thoughts.
6. Return valid JSON matching this exact structure:
{
  "title": "Clear, professional title addressing the user's exact needs in ${locString}",
  "summary": "Detailed executive summary detailing discovered resources and resolution strategy",
  "urgencyLevel": "Low / Standard / Urgent / Critical",
  "locationContext": "${locString}",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step Title",
      "description": "Clear actionable instruction",
      "department": "Responsible Organization or Agency",
      "estimatedTime": "Timeframe",
      "verified": true,
      "actionRequired": "Exact actionable steps"
    }
  ],
  "resources": [
    {
      "id": "res-x",
      "name": "Organization Name",
      "category": "Category (e.g. Food Support, Housing & Shelter, Income Assistance, ID Recovery)",
      "description": "Detailed service description",
      "location": "Address & City (${locString})",
      "phone": "Phone number",
      "hours": "Hours",
      "url": "https://...",
      "eligibility": "Eligibility notes"
    }
  ],
  "optionalSupports": [
    {
      "id": "opt-x",
      "name": "Optional Support Name",
      "category": "Category",
      "description": "Description",
      "location": "Location",
      "phone": "Phone",
      "hours": "Hours",
      "url": "https://...",
      "eligibility": "Eligibility"
    }
  ],
  "sources": [
    { "name": "Source Name", "url": "https://..." }
  ],
  "requirements": [
    "Requirement 1"
  ],
  "alternatives": [
    "Alternative pathway 1"
  ],
  "uncertainties": [
    "Limitation or regional uncertainty 1"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini AI');
    }

    const pathwayData = JSON.parse(text);
    return res.json({
      success: true,
      mode: 'ai-generated-canada-wide',
      pathway: pathwayData
    });
  } catch (err: any) {
    console.error('Gemini Pathfinder Error:', err);
    return res.json({
      success: true,
      mode: 'fallback-on-error',
      error: err.message,
      pathway: defaultStructuredResponse
    });
  }
});

// Vite middleware setup for development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(join(__dirname, 'dist'));

  if (isProduction) {
    app.use(express.static(join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  } else {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('Vite dev server failed to start, falling back to static:', e);
      app.use(express.static(join(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(join(__dirname, 'dist', 'index.html'));
      });
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`NAVCAN server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
