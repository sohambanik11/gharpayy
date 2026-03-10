export interface ParsedLead {
  name: string;
  phone: string;
  email: string;
  budget: string;
  preferred_location: string;
  notes: string;
  confidence: {
    name: number;
    phone: number;
    email: number;
    budget: number;
    location: number;
  };
}

// --- Regex patterns ---

// Phone: Indian mobile (+91, 91, or bare 10-digit starting 6-9), also spaced formats like "98765 43210"
const PHONE_RE = /(?:\+?91[\s.-]?)?([6-9]\d{4}[\s.-]?\d{5})\b/;
const INTL_PHONE_RE = /\+\d{1,3}[\s.-]?\d{6,14}/;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Budget: "budget 15-20k", "₹50 lakh", "rs 8000-12000", "1.5cr", "25L", "budget: 80,000"
const BUDGET_RE = /(?:(?:budget|₹|rs\.?|inr|price|rent)\s*[:=]?\s*)(\d[\d,.\s]*(?:\s*(?:-|to)\s*\d[\d,.\s]*)?\s*(?:k|l|lakh|lakhs|lac|cr|crore|crores|pm|per\s*month)?)\b|\b(\d[\d,.\s]*(?:\s*(?:-|to)\s*\d[\d,.\s]*)?\s*(?:k|l|lakh|lakhs|lac|cr|crore|crores|pm|per\s*month))\b/i;

// Room type: "2 BHK", "2.5BHK", "studio apartment", "3bhk flat", "row house", "pg", "1rk"
const ROOM_RE = /\b(\d(?:\.\d)?\s*bhk|1\s*rk|\d\s*bhk\s*(?:flat|apartment|house)?|studio\s*(?:apartment|flat)?|penthouse|villa|duplex|triplex|row\s*house|pg|paying\s*guest|independent\s*(?:house|floor)|builder\s*floor)\b/i;

// Location with keyword: "in Koramangala", "sector 62 noida", "near MG Road"
// Improved: supports "sector XX city", lowercase after keyword, multi-word locations
const LOCATION_KEYWORDS_RE = /\b(?:in|at|near|area|location|locality|sector|phase|village|town|city)\s*[:=]?\s*((?:sector\s*\d+\s*)?[A-Za-z\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F][A-Za-z0-9\s\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]{1,40}?)(?:\s*(?:[,.]|$|budget|looking|need|want|require|price|rent|\d{5,}))/i;

// Standalone sector pattern: "sector 62 noida", "sec 45 gurugram"
const SECTOR_RE = /\b(?:sector|sec)\.?\s*(\d{1,3})\s+([A-Za-z\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F][A-Za-z\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]{2,20})\b/i;

// Hindi/Devanagari and other Indic script name detection
const INDIC_NAME_RE = /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]+(?:\s+[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]+)*/;

// WhatsApp forwarded message header cleanup
const WA_FORWARD_RE = /^\[?\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\]?\s*[-–—]?\s*/gm;
const WA_LABEL_RE = /^(?:Name|Phone|Email|Budget|Location|Area|Source|Contact|Number|Mobile|Mob|Ph|Address)\s*[:=\-–]\s*/gim;

// "Name: value" key-value patterns common in form submissions / forwarded messages
const KV_NAME_RE = /(?:^|\n)\s*(?:name|customer|client|lead)\s*[:=\-–]\s*(.+)/i;
const KV_PHONE_RE = /(?:^|\n)\s*(?:phone|mobile|mob|contact|number|cell|whatsapp|wa)\s*[:=\-–]\s*(.+)/i;
const KV_EMAIL_RE = /(?:^|\n)\s*(?:email|e-?mail|mail)\s*[:=\-–]\s*(.+)/i;
const KV_BUDGET_RE = /(?:^|\n)\s*(?:budget|price|rent|amount)\s*[:=\-–]\s*(.+)/i;
const KV_LOCATION_RE = /(?:^|\n)\s*(?:location|area|address|city|locality|place|sector)\s*[:=\-–]\s*(.+)/i;
const KV_ROOM_RE = /(?:^|\n)\s*(?:type|property|flat|room|bhk|requirement|looking\s*for|interested\s*in)\s*[:=\-–]\s*(.+)/i;

export function parseLeadText(raw: string): ParsedLead {
  if (!raw || !raw.trim()) {
    return empty();
  }

  // Pre-process: strip WhatsApp forward headers
  let text = raw.trim().replace(WA_FORWARD_RE, '');

  // Check if this is a key-value formatted message (form submission, forwarded structured msg)
  const isKV = (text.match(KV_NAME_RE) || text.match(KV_PHONE_RE)) && text.includes(':');
  if (isKV) {
    return parseKeyValue(text);
  }

  // Flatten multi-line into single line for free-text parsing, preserve sentence breaks
  text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

  const extracted: string[] = [];

  // 1. Extract phone
  let phone = '';
  let phoneConf = 0;
  const phoneMatch = text.match(PHONE_RE);
  const intlMatch = text.match(INTL_PHONE_RE);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[\s.-]/g, '');
    phoneConf = 1.0;
    extracted.push(escapeRegex(phoneMatch[0]));
  } else if (intlMatch) {
    phone = intlMatch[0].replace(/[\s.-]/g, '');
    phoneConf = 0.9;
    extracted.push(escapeRegex(intlMatch[0]));
  }

  // 2. Extract email
  let email = '';
  let emailConf = 0;
  const emailMatch = text.match(EMAIL_RE);
  if (emailMatch) {
    email = emailMatch[0];
    emailConf = 1.0;
    extracted.push(escapeRegex(emailMatch[0]));
  }

  // 3. Extract budget
  let budget = '';
  let budgetConf = 0;
  const budgetMatch = text.match(BUDGET_RE);
  if (budgetMatch) {
    budget = (budgetMatch[1] || budgetMatch[2] || '').trim();
    budgetConf = budgetMatch[1] ? 0.95 : 0.75;
    extracted.push(escapeRegex(budgetMatch[0]));
  }

  // 4. Extract room type (goes into notes)
  let roomType = '';
  const roomMatch = text.match(ROOM_RE);
  if (roomMatch) {
    roomType = roomMatch[0].trim();
    extracted.push(escapeRegex(roomMatch[0]));
  }

  // 5. Extract location — try sector pattern first, then keyword-based, then standalone
  let location = '';
  let locationConf = 0;
  const sectorMatch = text.match(SECTOR_RE);
  if (sectorMatch) {
    location = `Sector ${sectorMatch[1]} ${sectorMatch[2].trim()}`;
    locationConf = 0.9;
    extracted.push(escapeRegex(sectorMatch[0]));
  }
  if (!location) {
    const locMatch = text.match(LOCATION_KEYWORDS_RE);
    if (locMatch) {
      location = locMatch[1].trim();
      locationConf = 0.8;
      extracted.push(escapeRegex(locMatch[0]));
    }
  }

  // 6. Remove extracted tokens to find name and notes
  let remaining = text;
  for (const token of extracted) {
    remaining = remaining.replace(new RegExp(token, 'i'), ' ');
  }

  // Clean up filler words
  remaining = remaining
    .replace(/\b(looking\s+for|wants?|needs?|requires?|interested\s+in|enquiry|inquiry|chahiye|chaiye|dekhna|dekhna\s+hai)\b/gi, ' ')
    .replace(/\b(budget|₹|rs\.?|inr|source|from|via|price|rent)\b/gi, ' ')
    .replace(/\b(in|at|near|area|location|ke\s+paas|mein|mai|me)\b/gi, ' ')
    .replace(/[,;:|•\-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try to extract name
  let name = '';
  let nameConf = 0;

  // First try Indic script name
  const indicMatch = remaining.match(INDIC_NAME_RE);
  if (indicMatch && indicMatch[0].length >= 3) {
    name = indicMatch[0].trim();
    nameConf = 0.8;
    remaining = remaining.replace(indicMatch[0], ' ').trim();
  }

  // If no Indic name found, try Latin name extraction
  if (!name) {
    const words = remaining.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 0) {
      const nameWords: string[] = [];
      for (const w of words) {
        // Accept capitalized Latin words or mixed-case common name patterns
        if (/^[A-Z][a-zA-Z']*$/.test(w) && nameWords.length < 4) {
          nameWords.push(w);
        } else if (nameWords.length > 0) {
          break;
        } else {
          // If few words total, take first 1-2 as name
          if (words.length <= 3 && /^[a-zA-Z]{2,}$/.test(w)) {
            nameWords.push(w);
          } else {
            break;
          }
        }
      }
      if (nameWords.length > 0) {
        name = nameWords.join(' ');
        nameConf = nameWords.every(w => /^[A-Z]/.test(w)) ? 0.85 : 0.5;
        for (const nw of nameWords) {
          remaining = remaining.replace(new RegExp(`\\b${escapeRegex(nw)}\\b`, 'i'), ' ').trim();
        }
      }
    }
  }

  // If no location found yet, try remaining capitalized words
  if (!location && remaining.trim()) {
    const capWords = remaining.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*/);
    if (capWords && capWords[0] !== name) {
      location = capWords[0].trim();
      locationConf = 0.5;
      remaining = remaining.replace(capWords[0], ' ').trim();
    }
  }

  // Everything left becomes notes, combined with room type
  const notesParts: string[] = [];
  if (roomType) notesParts.push(roomType);
  const leftover = remaining.replace(/\s+/g, ' ').trim();
  if (leftover && leftover !== name && leftover.length > 1) notesParts.push(leftover);
  const notes = notesParts.join(', ');

  return {
    name,
    phone,
    email,
    budget,
    preferred_location: location,
    notes,
    confidence: {
      name: name ? nameConf : 0,
      phone: phoneConf,
      email: emailConf,
      budget: budgetConf,
      location: locationConf,
    },
  };
}

/**
 * Parse structured key-value text like:
 * Name: Rahul Sharma
 * Phone: 9876543210
 * Budget: 15-20k
 * Location: Sector 62 Noida
 */
function parseKeyValue(text: string): ParsedLead {
  const result = empty();

  const nameM = text.match(KV_NAME_RE);
  if (nameM) { result.name = nameM[1].trim(); result.confidence.name = 0.95; }

  const phoneM = text.match(KV_PHONE_RE);
  if (phoneM) {
    const rawPhone = phoneM[1].trim();
    const phoneClean = rawPhone.match(PHONE_RE) || rawPhone.match(INTL_PHONE_RE);
    result.phone = phoneClean ? phoneClean[0].replace(/[\s.-]/g, '') : rawPhone.replace(/[\s.-]/g, '');
    result.confidence.phone = phoneClean ? 1.0 : 0.7;
  }

  const emailM = text.match(KV_EMAIL_RE);
  if (emailM) {
    const em = emailM[1].trim().match(EMAIL_RE);
    if (em) { result.email = em[0]; result.confidence.email = 1.0; }
  }

  const budgetM = text.match(KV_BUDGET_RE);
  if (budgetM) { result.budget = budgetM[1].trim(); result.confidence.budget = 0.9; }

  const locM = text.match(KV_LOCATION_RE);
  if (locM) { result.preferred_location = locM[1].trim(); result.confidence.location = 0.9; }

  const roomM = text.match(KV_ROOM_RE);
  const notesParts: string[] = [];
  if (roomM) notesParts.push(roomM[1].trim());

  // Collect remaining lines not matched by any KV as notes
  const lines = text.split('\n').map(l => l.replace(WA_LABEL_RE, '').trim()).filter(Boolean);
  const matchedValues = [result.name, result.phone, result.email, result.budget, result.preferred_location, roomM?.[1]?.trim()].filter(Boolean);
  for (const line of lines) {
    if (!matchedValues.some(v => v && line.includes(v)) && line.length > 2) {
      // Check if it's a label line we already parsed
      if (!/^(?:name|phone|mobile|email|budget|location|area|type|property|contact|number|source|address)\s*[:=\-–]/i.test(line)) {
        notesParts.push(line);
      }
    }
  }
  result.notes = notesParts.join(', ');

  return result;
}

function empty(): ParsedLead {
  return {
    name: '', phone: '', email: '', budget: '', preferred_location: '', notes: '',
    confidence: { name: 0, phone: 0, email: 0, budget: 0, location: 0 },
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
