import { createClient } from '@/lib/supabase/server'

export type SearchType = 'products' | 'vendors' | 'services' | 'both'
export type AssistantMode = 'buyer' | 'merchant'
export type AssistantLanguage = 'auto' | 'en' | 'pcm' | 'yo' | 'ig' | 'ha'
export type ConversationalIntent = 'greeting' | 'wellbeing' | 'thanks' | 'identity' | 'help' | 'goodbye'
export type SupportIntent =
  | 'app_overview'
  | 'account_access'
  | 'checkout_payment'
  | 'order_tracking'
  | 'messages_chat'
  | 'merchant_setup'
  | 'payment_guide'
  | 'logistics_guide'
  | 'platform_safety'
  | 'report_issue'

export type MarketplaceIntentType = 'product' | 'service' | 'vendor'

type ProductSearchResult = {
  id: string
  name: string
  description: string
  category: string
  price: number
  stock: number
  image_url: string | null
  merchant_id: string
  vendor_name: string
  vendor_location: string
}

type VendorSearchResult = {
  id: string
  name: string
  category: string
  location: string
  description: string
  avatar_url: string | null
}

type ServiceSearchResult = {
  id: string
  name: string
  description: string
  category: string
  price: number
  vendor: string
  location: string
}

export type StructuredAiResponse = {
  type: MarketplaceIntentType
  query: string
  location: string
  results: Array<{
    name: string
    price: string
    vendor: string
    location: string
  }>
}

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'the', 'a', 'an', 'of', 'for', 'to', 'in', 'at', 'on', 'with', 'and', 'or', 'is', 'are',
  'show', 'find', 'need', 'want', 'please', 'help', 'buy', 'near', 'me', 'abeg', 'na', 'dey', 'wey',
])

const QUERY_ALIASES: Array<[RegExp, string]> = [
  [/\bphone\b|\bsmartphone\b|\biphone\b|\bandroid\b|\bwaya\b/gi, 'electronics phone'],
  [/\blaptop\b|\bpc\b|\bcomputer\b/gi, 'electronics laptop'],
  [/\bshoe\b|\bshoes\b|\bsneakers\b|\bbata\b/gi, 'fashion shoes'],
  [/\bcloth\b|\bclothes\b|\bfashion\b|\bwear\b|\baso\b|\btufafi\b/gi, 'fashion clothing'],
  [/\bfood\b|\bmeal\b|\bgroceries\b|\bprovisions\b|\babinci\b|\bnri\b|\bounje\b/gi, 'food groceries'],
  [/\bplumber\b|\bplumbing\b|\bpipe\b|\bmai gyara\b/gi, 'services plumbing'],
  [/\belectrician\b|\belectrical\b|\bwiring\b/gi, 'services electrician'],
  [/\btailor\b|\bseamstress\b|\bfashion designer\b/gi, 'services tailoring'],
]

const LANGUAGE_HINTS: Record<Exclude<AssistantLanguage, 'auto' | 'en'>, string[]> = {
  pcm: [
    'abeg', 'dey', 'wey', 'una', 'wetin', 'make i', 'no wahala', 'how far', 'oga', 'sharp sharp', 'na',
  ],
  yo: [
    'ẹ', 'ṣ', 'ó', 'à', 'ì', 'mo fẹ', 'ẹ jọ', 'bawo', 'ọja', 'owo', 'onisowo', 'e kaabo',
  ],
  ig: [
    'anyị', 'anyị chọrọ', 'biko', 'ahịa', 'ahịa m', 'nnoo', 'kedu', 'ngwa', 'ịzụ', 'ndi', 'ahịa',
  ],
  ha: [
    'sannu', 'don Allah', 'ina son', 'farashi', 'kaya', 'dillali', 'taimako', 'yaya', 'me yasa', 'nagode',
  ],
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, '')
}

function detectSearchType(query: string): SearchType {
  const q = query.toLowerCase()
  const vendorKeywords = [
    'vendor', 'seller', 'store', 'shop', 'merchant', 'near me', 'location', 'market', 'where', 'find vendor',
    'onisowo', 'dillali',
  ]
  const productKeywords = [
    'product', 'buy', 'price', 'cheap', 'order', 'item', 'need', 'find', 'kaya', 'ngwa', 'oja',
  ]
  const serviceKeywords = [
    'service', 'repair', 'plumber', 'electrician', 'tailor', 'cleaner', 'mechanic', 'salon', 'barber', 'technician',
  ]

  const hasVendor = vendorKeywords.some((keyword) => q.includes(keyword))
  const hasProduct = productKeywords.some((keyword) => q.includes(keyword))
  const hasService = serviceKeywords.some((keyword) => q.includes(keyword))

  if (hasService && !hasProduct && !hasVendor) return 'services'
  if (hasVendor && !hasProduct) return 'vendors'
  if (hasProduct && !hasVendor) return 'products'
  return 'both'
}

export function detectMarketplaceIntentType(query: string): MarketplaceIntentType {
  const q = String(query || '').toLowerCase()
  const serviceKeywords = [
    'service', 'repair', 'plumber', 'electrician', 'tailor', 'cleaner', 'mechanic', 'salon', 'barber', 'technician',
  ]
  const vendorKeywords = ['vendor', 'seller', 'merchant', 'shop', 'store', 'vendor near', 'find vendor']

  if (serviceKeywords.some((keyword) => q.includes(keyword))) return 'service'
  if (vendorKeywords.some((keyword) => q.includes(keyword))) return 'vendor'
  return 'product'
}

export function detectContactBypassAttempt(query: string) {
  const q = String(query || '').toLowerCase()
  const patterns = [
    'phone number', 'whatsapp', 'telegram', 'dm me', 'call me', 'contact me', '@gmail', '@yahoo',
  ]

  const hasPattern = patterns.some((pattern) => q.includes(pattern))
  const hasLongDigits = /\d{7,}/.test(q)
  return hasPattern || hasLongDigits
}

function tokenizeQuery(query: string) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
    .slice(0, 8)
}

function buildQueryVariants(query: string) {
  const variants = new Set<string>()
  const clean = query.trim()
  if (clean) variants.add(clean)

  let aliased = clean
  QUERY_ALIASES.forEach(([pattern, replacement]) => {
    aliased = aliased.replace(pattern, replacement)
  })
  if (aliased && aliased !== clean) variants.add(aliased)

  const tokens = tokenizeQuery(clean)
  if (tokens.length > 0) {
    variants.add(tokens.join(' '))
    tokens.forEach((token) => variants.add(token))
  }

  return Array.from(variants).slice(0, 10)
}

function mergeUniqueById<T extends { id: string }>(base: T[], incoming: T[], limit: number) {
  const map = new Map(base.map((item) => [String(item.id), item]))
  incoming.forEach((item) => {
    if (map.size < limit || map.has(String(item.id))) {
      map.set(String(item.id), item)
    }
  })
  return Array.from(map.values()).slice(0, limit)
}

function buildTokenOrPattern(tokens: string[], fields: string[]) {
  return tokens
    .flatMap((token) => {
      const safeToken = escapeLike(token)
      return fields.map((field) => `${field}.ilike.%${safeToken}%`)
    })
    .join(',')
}

export function detectReplyLanguage(params: {
  message: string
  preferredLanguage?: string
}): Exclude<AssistantLanguage, 'auto'> {
  const preferred = String(params.preferredLanguage || 'auto').toLowerCase() as AssistantLanguage
  if (preferred !== 'auto' && ['en', 'pcm', 'yo', 'ig', 'ha'].includes(preferred)) {
    return preferred as Exclude<AssistantLanguage, 'auto'>
  }

  const q = String(params.message || '').toLowerCase()
  if (!q) return 'en'

  const scores: Record<Exclude<AssistantLanguage, 'auto' | 'en'>, number> = {
    pcm: 0,
    yo: 0,
    ig: 0,
    ha: 0,
  }

  ;(Object.keys(LANGUAGE_HINTS) as Array<keyof typeof LANGUAGE_HINTS>).forEach((lang) => {
    LANGUAGE_HINTS[lang].forEach((hint) => {
      if (q.includes(hint)) {
        scores[lang] += hint.length > 3 ? 2 : 1
      }
    })
  })

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  if (best && best[1] > 0) {
    return best[0] as Exclude<AssistantLanguage, 'auto'>
  }

  return 'en'
}

export function detectConversationalIntent(query: string): ConversationalIntent | null {
  const q = String(query || '').toLowerCase().trim()
  if (!q) return null

  const greetingPatterns = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how far', 'sup',
    'e kaabo', 'kedu', 'sannu',
  ]
  const wellbeingPatterns = [
    'how are you', 'how are you doing', 'how you dey', 'how body', 'se dada ni', 'kedu ka i mere', 'ya jiki',
  ]
  const thanksPatterns = ['thank you', 'thanks', 'thank u', 'nagode', 'daalu', 'ese', 'oshe']
  const identityPatterns = ['who are you', 'what are you', 'your name', 'wetin be your name', 'who be you']
  const helpPatterns = ['help me', 'can you help', 'what can you do', 'how do you work', 'guide me']
  const goodbyePatterns = ['bye', 'goodbye', 'see you', 'later', 'ka chi fo', 'odabo', 'bye bye']

  if (wellbeingPatterns.some((pattern) => q.includes(pattern))) return 'wellbeing'
  if (greetingPatterns.some((pattern) => q.includes(pattern))) return 'greeting'
  if (thanksPatterns.some((pattern) => q.includes(pattern))) return 'thanks'
  if (identityPatterns.some((pattern) => q.includes(pattern))) return 'identity'
  if (helpPatterns.some((pattern) => q.includes(pattern))) return 'help'
  if (goodbyePatterns.some((pattern) => q.includes(pattern))) return 'goodbye'

  return null
}

export function buildConversationalReply(params: {
  intent: ConversationalIntent
  language?: string
  assistantMode?: AssistantMode
}) {
  const language = String(params.language || 'en').toLowerCase()
  const mode: AssistantMode = params.assistantMode === 'merchant' ? 'merchant' : 'buyer'
  const intent = params.intent

  const responses = {
    en: {
      greeting: mode === 'merchant'
        ? 'Hello. I am doing great and ready to help you grow your business today.'
        : 'Hello. I am doing great and ready to help you find what you need today.',
      wellbeing: 'I am doing well, thank you for asking. How are you doing today?',
      thanks: 'You are welcome. I am here anytime you need me.',
      identity: mode === 'merchant'
        ? 'I am BigCat Native AI, your marketplace and business assistant.'
        : 'I am BigCat Native AI, your marketplace shopping assistant.',
      help: mode === 'merchant'
        ? 'I can help with product discovery, pricing ideas, promo suggestions, and business tips. Tell me what you need.'
        : 'I can help you find products, compare prices, discover vendors, and answer shopping questions. Tell me what you want.',
      goodbye: 'Alright. Talk soon and have a great day.',
    },
    pcm: {
      greeting: mode === 'merchant'
        ? 'How far. I dey okay well well, and I ready help your business grow today.'
        : 'How far. I dey okay well well, and I ready help you find wetin you need today.',
      wellbeing: 'I dey alright. How you dey today?',
      thanks: 'No wahala. Anytime you need me, I dey here.',
      identity: mode === 'merchant'
        ? 'I be BigCat Native AI, your marketplace and business assistant.'
        : 'I be BigCat Native AI, your marketplace shopping assistant.',
      help: mode === 'merchant'
        ? 'I fit help you with product ideas, pricing, promo message, and business tips. Tell me wetin you want.'
        : 'I fit help you find products, compare prices, and see better vendors. Tell me wetin you need.',
      goodbye: 'Alright, no wahala. We go yarn again soon.',
    },
    yo: {
      greeting: mode === 'merchant'
        ? 'Bawo ni. Mo wa daadaa, mo si setan lati ran o lowo lati dagba owo oja re loni.'
        : 'Bawo ni. Mo wa daadaa, mo si setan lati ran o lowo lati wa ohun ti o nilo loni.',
      wellbeing: 'Mo wa daadaa. Se iwo naa wa daadaa?',
      thanks: 'O seun. Mo wa nibi nigbakugba ti o ba nilo iranlowo.',
      identity: mode === 'merchant'
        ? 'Emi ni BigCat Native AI, oluranlowo oja ati iṣowo re.'
        : 'Emi ni BigCat Native AI, oluranlowo rira ọja re.',
      help: mode === 'merchant'
        ? 'Mo le ran o lowo pelu ero ọja, owo tita, ifiranse ipolowo, ati imoran iṣowo. So ohun ti o nilo.'
        : 'Mo le ran o lowo lati wa ọja, fiwera owo, ati ri onisowo to dara. So ohun ti o nilo.',
      goodbye: 'O dara. A o tun ba ara wa soro laipe.',
    },
    ig: {
      greeting: mode === 'merchant'
        ? 'Ndewo. A di m mma, ma adi njikere inyere gi ka azia gi too taa.'
        : 'Ndewo. A di m mma, ma adi njikere inyere gi ichota ihe i choro taa.',
      wellbeing: 'A di m mma. Kedu ka i mere taa?',
      thanks: 'Nnoo, i nabatara. Anom ebe a oge obula i choro enyemaka.',
      identity: mode === 'merchant'
        ? 'Abum BigCat Native AI, onye inyeaka gi n ahia na uto azụmahịa.'
        : 'Abum BigCat Native AI, onye inyeaka gi n ịzụ ahịa.',
      help: mode === 'merchant'
        ? 'Enwere m ike inyere gi na echiche ngwaahịa, ego, mgbasa ozi, na nduzi azụmahịa.'
        : 'Enwere m ike inyere gi ichota ngwaahịa, tụlee ego, ma hụ ndi na-ere ahia kacha mma.',
      goodbye: 'O di mma. Ka anyi kparita ozo n oge na-adighi anya.',
    },
    ha: {
      greeting: mode === 'merchant'
        ? 'Sannu. Ina lafiya, kuma a shirye nake in taimaka kasuwancinka ya bunkasa yau.'
        : 'Sannu. Ina lafiya, kuma a shirye nake in taimaka ka samu abin da kake bukata yau.',
      wellbeing: 'Ina lafiya. Kai fa, ya jikinka?',
      thanks: 'Babu komai. Ina nan duk lokacin da kake bukata.',
      identity: mode === 'merchant'
        ? 'Ni ne BigCat Native AI, mataimakinka na kasuwa da bunkasa kasuwanci.'
        : 'Ni ne BigCat Native AI, mataimakinka na sayayya.',
      help: mode === 'merchant'
        ? 'Zan taimaka da dabarun kaya, farashi, talla, da shawarwarin kasuwanci.'
        : 'Zan taimaka ka nemo kayayyaki, kwatanta farashi, da gano dillalai masu kyau.',
      goodbye: 'Madalla. Sai mun sake magana nan gaba kadan.',
    },
  }

  const text = responses[language as keyof typeof responses] || responses.en
  return text[intent]
}

export function detectSupportIntent(query: string): SupportIntent | null {
  const q = String(query || '').toLowerCase().trim()
  if (!q) return null

  const isAppOverview = [
    'about this app', 'about bigcat', 'how this app works', 'what is this app', 'app details', 'platform details',
  ].some((pattern) => q.includes(pattern))
  if (isAppOverview) return 'app_overview'

  const isAccount = [
    'cannot login', 'can\'t login', 'cant login', 'login problem', 'sign in issue', 'otp', 'verification code',
    'password reset', 'account locked', 'access account',
  ].some((pattern) => q.includes(pattern))
  if (isAccount) return 'account_access'

  const isCheckout = [
    'payment failed', 'checkout failed', 'cannot pay', 'card declined', 'wallet issue', 'escrow', 'pay for order',
  ].some((pattern) => q.includes(pattern))
  if (isCheckout) return 'checkout_payment'

  const isPaymentGuide = [
    'how payment works', 'how to pay', 'wallet payment', 'is payment safe', 'how escrow works',
  ].some((pattern) => q.includes(pattern))
  if (isPaymentGuide) return 'payment_guide'

  const isOrder = [
    'where is my order', 'track order', 'delivery delay', 'order status', 'order not delivered',
  ].some((pattern) => q.includes(pattern))
  if (isOrder) return 'order_tracking'

  const isMessages = [
    'chat not working', 'message not sending', 'cannot message', 'inbox issue', 'conversation issue',
  ].some((pattern) => q.includes(pattern))
  if (isMessages) return 'messages_chat'

  const isLogistics = [
    'delivery', 'shipping', 'logistics', 'delivery fee', 'track delivery', 'dispatch',
  ].some((pattern) => q.includes(pattern))
  if (isLogistics) return 'logistics_guide'

  const isSafety = [
    'contact details', 'outside platform', 'pay outside', 'is it safe', 'avoid scam',
  ].some((pattern) => q.includes(pattern))
  if (isSafety) return 'platform_safety'

  const isMerchantSetup = [
    'merchant setup', 'set up my store', 'create listing', 'product upload', 'service listing', 'merchant profile',
  ].some((pattern) => q.includes(pattern))
  if (isMerchantSetup) return 'merchant_setup'

  const isIssue = [
    'app issue', 'app not working', 'bug', 'error', 'problem', 'something is wrong', 'support', 'help with app',
  ].some((pattern) => q.includes(pattern))
  if (isIssue) return 'report_issue'

  return null
}

export function buildSupportReply(params: {
  intent: SupportIntent
  language?: string
  assistantMode?: AssistantMode
}) {
  const language = String(params.language || 'en').toLowerCase()
  const mode: AssistantMode = params.assistantMode === 'merchant' ? 'merchant' : 'buyer'

  const responses = {
    en: {
      app_overview:
        'BigCat is a marketplace app for buyers and merchants. Buyers discover products/services, chat with merchants, and checkout with escrow protection. Merchants list products or services, manage orders, and track performance.',
      account_access:
        'For account access issues: confirm your email/phone, retry OTP, and check network stability. If login still fails, use password reset and then sign in again.',
      checkout_payment:
        'For checkout/payment issues: verify payment method balance, retry once, and confirm delivery details. Escrow keeps funds secure until delivery/service completion.',
      order_tracking:
        'For order tracking: open Orders to see current status. If delayed, contact the merchant in Messages and request an update with expected delivery time.',
      messages_chat:
        'For messaging issues: confirm internet access, reopen the conversation, and resend. If blocked by policy, remove restricted contact-sharing content and retry later.',
      merchant_setup:
        mode === 'merchant'
          ? 'To set up your merchant profile: complete business details, choose products or services, add clear listings with pricing, then publish and monitor incoming orders/messages.'
          : 'To become a merchant: sign up as merchant, complete business profile, choose products or services, add listings, and start receiving buyer orders.',
      payment_guide:
        'Payment guidance: wallet payment is available, your funds are held in escrow, and payment is released only after successful delivery/service completion.',
      logistics_guide:
        'Delivery guidance: logistics handles shipment, fees depend on location and package weight, and you can track order status until delivery.',
      platform_safety:
        'For your safety, all transactions should remain within the platform.',
      report_issue:
        'I can help troubleshoot now. Tell me exactly what happened, what page you were on, and any error message. I will guide you step-by-step.',
    },
    pcm: {
      app_overview:
        'BigCat na marketplace app for buyers and merchants. Buyers fit find product/service, chat merchant, and checkout with escrow protection. Merchants fit post listings, manage orders, and track performance.',
      account_access:
        'If account dey worry you: check email/phone well, retry OTP, and confirm network. If e still fail, use password reset then login again.',
      checkout_payment:
        'If payment/checkout fail: check your balance, try again once, and confirm delivery details. Escrow go hold money safe till delivery complete.',
      order_tracking:
        'For order tracking, open Orders make you see status. If e delay, message the merchant for update and delivery time.',
      messages_chat:
        'If chat no dey send, check internet, reopen conversation, then resend. If policy block am, remove contact-sharing words and retry later.',
      merchant_setup:
        mode === 'merchant'
          ? 'To setup your merchant page: complete business details, choose products/services, add clear listings with price, then publish am.'
          : 'If you wan become merchant, register as merchant, complete profile, add listings, and start receive orders.',
      payment_guide:
        'Payment guide: wallet dey available, escrow go hold money safe, payment go release only after delivery or service complete.',
      logistics_guide:
        'Delivery guide: logistics system dey handle am, fee depend on location and package weight, and you fit track am till delivery.',
      platform_safety:
        'For your safety, all transactions should remain within the platform.',
      report_issue:
        'I fit help you solve am now. Tell me wetin happen, which page you dey, and any error message wey you see.',
    },
    yo: {
      app_overview:
        'BigCat je ohun elo oja fun awon olura ati onisowo. Olura le wa ọja/ise, ba onisowo soro, ki o sanwo pelu aabo escrow.',
      account_access:
        'Fun isoro wiwọle account: jẹrisi imeeli/tabi foonu, tun OTP gbiyanju, ki o si ṣayẹwo intanẹẹti.',
      checkout_payment:
        'Fun isoro isanwo: ṣayẹwo dinku owo, tun gbiyanju lẹẹkan, ki o jẹrisi alaye ifijiṣẹ. Escrow n daabo bo owo re.',
      order_tracking:
        'Lati tọpa paṣẹ, ṣii apakan Orders. Ti idaduro ba wa, kan si onisowo ninu Messages fun imudojuiwọn.',
      messages_chat:
        'Ti ifiranse ko ba n lọ, ṣayẹwo intanẹẹti, tun ṣii ibaraẹnisọrọ, ki o tun fi ranṣẹ.',
      merchant_setup:
        'Lati setup onisowo: pari alaye iṣowo, yan ọja tabi ise, fi listing pẹlu owo to ye han, ki o tẹjade.',
      payment_guide:
        'Itosona isanwo: owo wallet wa, escrow n daabo bo owo, a o si tu isanwo sile leyin ifijiṣẹ tabi ise to pari.',
      logistics_guide:
        'Itosona ifijiṣẹ: eto logistics lo n ṣakoso ifijiṣẹ, owo da lori ipo ati iwuwo package, o si le tọpa titi de opin.',
      platform_safety:
        'For your safety, all transactions should remain within the platform.',
      report_issue:
        'Mo le ran o lowo bayi. So pato ohun to sele, oju-iwe ti o wa, ati ifiranse aṣiṣe to ri.',
    },
    ig: {
      app_overview:
        'BigCat bu ngwa ahia maka ndi na-azu na ndi na-ere ahia. I nwere ike ichota ngwaahịa/ọrụ, kparita uka, ma kwụọ n escrow.',
      account_access:
        'Maka nsogbu ịbanye: lelee email/ekwentị, nwalee OTP ọzọ, ma lelee njikọ intaneti.',
      checkout_payment:
        'Maka nsogbu ịkwụ ụgwọ: lelee ego dị, nwalee ọzọ, ma jide n\'aka na adreesị ziri ezi. Escrow na-echekwa ego.',
      order_tracking:
        'Maka tracking order, gaa na Orders ka ị hụ status. Ọ bụrụ na e nwere oge, kpọtụrụ merchant na Messages.',
      messages_chat:
        'Ọ bụrụ na message anaghị eje, lelee intaneti, mepee chat ọzọ, wee zipu ọzọ.',
      merchant_setup:
        'Maka setup merchant: mezue profile azụmahịa, họrọ ngwaahịa ma ọ bụ ọrụ, tinye listing na ọnụahịa ziri ezi.',
      payment_guide:
        'Nduzi ịkwụ ụgwọ: wallet dị, escrow na-echekwa ego, a na-ewepụta ego naanị mgbe e nyefere ihe ma ọ bụ ọrụ gwụchara.',
      logistics_guide:
        'Nduzi nnyefe: usoro logistics na-ahụ nnyefe, ego dabere na ebe na ibu package, ma ị nwere ike iso tracking ruo ngwụcha.',
      platform_safety:
        'For your safety, all transactions should remain within the platform.',
      report_issue:
        'Enwere m ike inyere gị ugbu a. Gwa m ihe kpọmkwem mere, peeji ị nọ, na ozi njehie ọ bụla ị hụrụ.',
    },
    ha: {
      app_overview:
        'BigCat app ne na kasuwa ga masu siya da yan kasuwa. Masu siya na nemo kaya/aiki, su yi chat, su biya da kariyar escrow.',
      account_access:
        'Don matsalar shiga account: duba email/waya, sake gwada OTP, kuma ka tabbatar da internet.',
      checkout_payment:
        'Don matsalar biyan kudi: duba balance, sake gwadawa sau daya, ka tabbatar da bayanan isarwa.',
      order_tracking:
        'Don bin order, shiga Orders ka ga status. Idan an jinkirta, ka tuntuɓi merchant ta Messages.',
      messages_chat:
        'Idan chat baya aiki, duba intanet, sake bude conversation, sannan ka sake turawa.',
      merchant_setup:
        'Don setup merchant: cika bayanan kasuwanci, zabi kaya ko service, saka listing mai farashi a sarari.',
      payment_guide:
        'Jagorar biya: wallet payment akwai, escrow na kare kudinka, kuma ana sakin biya ne bayan isarwa ko kammala aiki.',
      logistics_guide:
        'Jagorar isarwa: tsarin logistics ne ke kula da delivery, kudin ya danganta da wuri da nauyi, kuma ana iya tracking har zuwa karshe.',
      platform_safety:
        'For your safety, all transactions should remain within the platform.',
      report_issue:
        'Zan taimaka yanzu. Ka fada min abin da ya faru, shafin da kake ciki, da duk wani kuskure da ka gani.',
    },
  }

  const languageReplies = responses[language as keyof typeof responses] || responses.en
  return languageReplies[params.intent]
}

export async function searchMarketplace(params: {
  query: string
  type?: SearchType
  limit?: number
  location?: string
}) {
  const supabase = createClient()
  const query = params.query.trim()
  const type = params.type || detectSearchType(query)
  const limit = Math.max(1, Math.min(params.limit || 8, 20))
  const queryVariants = buildQueryVariants(query)
  const preferredLocation = String(params.location || '').trim().toLowerCase()

  if (!query) {
    return {
      success: false,
      error: 'Query is required',
      products: [],
      vendors: [],
      type,
    }
  }

  const runProductSearch = async (searchTerm: string): Promise<ProductSearchResult[]> => {
    const safeQuery = escapeLike(searchTerm)
    const pattern = `%${safeQuery}%`
    const tokens = tokenizeQuery(searchTerm)

    let request = supabase
      .from('products')
      .select('id, name, description, category, price, stock, image_url, merchant_id, merchant_profiles:auth_users!merchant_id(business_name, name, location, avatar_url)')
      .eq('is_active', true)
      .limit(limit)

    if (tokens.length >= 2) {
      const tokenOr = buildTokenOrPattern(tokens, ['name', 'description', 'category'])
      request = request.or(tokenOr)
    } else {
      request = request.or(`name.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)
    }

    const { data, error } = await request

    if (error) throw error

    return (data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category || 'General',
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      image_url: product.image_url || null,
      merchant_id: product.merchant_id,
      vendor_name:
        product?.merchant_profiles?.business_name ||
        product?.merchant_profiles?.name ||
        'Unknown vendor',
      vendor_location: product?.merchant_profiles?.location || 'Nigeria',
    }))
  }

  const runVendorSearch = async (searchTerm: string): Promise<VendorSearchResult[]> => {
    const safeQuery = escapeLike(searchTerm)
    const pattern = `%${safeQuery}%`
    const tokens = tokenizeQuery(searchTerm)

    let request = supabase
      .from('auth_users')
      .select('id, business_name, name, business_category, location, business_description, avatar_url, setup_completed')
      .eq('role', 'merchant')
      .eq('setup_completed', true)
      .limit(limit)

    if (tokens.length >= 2) {
      const tokenOr = buildTokenOrPattern(tokens, [
        'business_name',
        'name',
        'business_category',
        'location',
        'business_description',
      ])
      request = request.or(tokenOr)
    } else {
      request = request.or(`business_name.ilike.${pattern},name.ilike.${pattern},business_category.ilike.${pattern},location.ilike.${pattern},business_description.ilike.${pattern}`)
    }

    const { data, error } = await request

    if (error) throw error

    return (data || []).map((vendor: any) => ({
      id: vendor.id,
      name: vendor.business_name || vendor.name || 'Unknown vendor',
      category: vendor.business_category || 'General',
      location: vendor.location || 'Nigeria',
      description: vendor.business_description || '',
      avatar_url: vendor.avatar_url || null,
    }))
  }

  const runServiceSearch = async (searchTerm: string): Promise<ServiceSearchResult[]> => {
    const safeQuery = escapeLike(searchTerm)
    const pattern = `%${safeQuery}%`
    const tokens = tokenizeQuery(searchTerm)

    let request = supabase
      .from('service_listings')
      .select('id, title, description, category, base_price, service_city, service_state, merchant_id, merchant_profiles:auth_users!merchant_id(business_name, name, location)')
      .eq('is_active', true)
      .limit(limit)

    if (tokens.length >= 2) {
      const tokenOr = buildTokenOrPattern(tokens, ['title', 'description', 'category', 'service_city', 'service_state'])
      request = request.or(tokenOr)
    } else {
      request = request.or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern},service_city.ilike.${pattern},service_state.ilike.${pattern}`)
    }

    const { data, error } = await request
    if (error) throw error

    return (data || []).map((service: any) => ({
      id: service.id,
      name: service.title || 'Service',
      description: service.description || '',
      category: service.category || 'General Service',
      price: Number(service.base_price || 0),
      vendor:
        service?.merchant_profiles?.business_name ||
        service?.merchant_profiles?.name ||
        'Unknown vendor',
      location:
        [service.service_city, service.service_state].filter(Boolean).join(', ') ||
        service?.merchant_profiles?.location ||
        'Nigeria',
    }))
  }

  const runProductFallback = async (): Promise<ProductSearchResult[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, category, price, stock, image_url, merchant_id, merchant_profiles:auth_users!merchant_id(business_name, name, location, avatar_url)')
      .eq('is_active', true)
      .limit(limit)

    if (error) throw error

    return (data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category || 'General',
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      image_url: product.image_url || null,
      merchant_id: product.merchant_id,
      vendor_name:
        product?.merchant_profiles?.business_name ||
        product?.merchant_profiles?.name ||
        'Unknown vendor',
      vendor_location: product?.merchant_profiles?.location || 'Nigeria',
    }))
  }

  const runVendorFallback = async (): Promise<VendorSearchResult[]> => {
    const { data, error } = await supabase
      .from('auth_users')
      .select('id, business_name, name, business_category, location, business_description, avatar_url, setup_completed')
      .eq('role', 'merchant')
      .eq('setup_completed', true)
      .limit(limit)

    if (error) throw error

    return (data || []).map((vendor: any) => ({
      id: vendor.id,
      name: vendor.business_name || vendor.name || 'Unknown vendor',
      category: vendor.business_category || 'General',
      location: vendor.location || 'Nigeria',
      description: vendor.business_description || '',
      avatar_url: vendor.avatar_url || null,
    }))
  }

  const runServiceFallback = async (): Promise<ServiceSearchResult[]> => {
    const { data, error } = await supabase
      .from('service_listings')
      .select('id, title, description, category, base_price, service_city, service_state, merchant_id, merchant_profiles:auth_users!merchant_id(business_name, name, location)')
      .eq('is_active', true)
      .limit(limit)

    if (error) throw error

    return (data || []).map((service: any) => ({
      id: service.id,
      name: service.title || 'Service',
      description: service.description || '',
      category: service.category || 'General Service',
      price: Number(service.base_price || 0),
      vendor:
        service?.merchant_profiles?.business_name ||
        service?.merchant_profiles?.name ||
        'Unknown vendor',
      location:
        [service.service_city, service.service_state].filter(Boolean).join(', ') ||
        service?.merchant_profiles?.location ||
        'Nigeria',
    }))
  }

  const prioritizeByLocation = <T extends { location?: string; vendor_location?: string }>(rows: T[]) => {
    if (!preferredLocation) return rows
    const preferred: T[] = []
    const other: T[] = []

    rows.forEach((row) => {
      const candidate = String(row.location || row.vendor_location || '').toLowerCase()
      if (candidate && candidate.includes(preferredLocation)) {
        preferred.push(row)
      } else {
        other.push(row)
      }
    })

    return [...preferred, ...other]
  }

  try {
      let products: ProductSearchResult[] = []
      let vendors: VendorSearchResult[] = []
      let services: ServiceSearchResult[] = []

      if (type !== 'vendors') {
        for (const variant of queryVariants) {
          const found = await runProductSearch(variant)
          products = mergeUniqueById(products, found, limit)
          if (products.length >= limit) break
        }
      }

      if (type !== 'products' && type !== 'vendors') {
        for (const variant of queryVariants) {
          const found = await runServiceSearch(variant)
          services = mergeUniqueById(services, found, limit)
          if (services.length >= limit) break
        }
      }

      if (type !== 'products') {
        for (const variant of queryVariants) {
          const found = await runVendorSearch(variant)
          vendors = mergeUniqueById(vendors, found, limit)
          if (vendors.length >= limit) break
        }
      }

      if (type !== 'vendors' && products.length === 0) {
        products = await runProductFallback()
      }

      if (type !== 'products' && vendors.length === 0) {
        vendors = await runVendorFallback()
      }

      if (type !== 'products' && type !== 'vendors' && services.length === 0) {
        services = await runServiceFallback()
      }

      products = prioritizeByLocation(products)
      vendors = prioritizeByLocation(vendors)
      services = prioritizeByLocation(services)

    return {
      success: true,
      type,
      products,
      vendors,
      services,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Search failed',
      products: [],
      vendors: [],
      services: [],
      type,
    }
  }
}

export function buildAiSearchReply(params: {
  query: string
  products: Array<{ name: string; price: number; vendor_name: string }>
  vendors: Array<{ name: string; category: string; location: string }>
  services?: Array<{ name: string; price: number; vendor: string; location: string }>
  userLocation?: string
  intentType?: MarketplaceIntentType
  language?: string
  assistantMode?: AssistantMode
}) {
  const { query, products, vendors } = params
  const services = params.services || []
  const userLocation = String(params.userLocation || '').trim()
  const intentType: MarketplaceIntentType = params.intentType || detectMarketplaceIntentType(query)
  const language = String(params.language || 'auto').toLowerCase()
  const assistantMode: AssistantMode = params.assistantMode === 'merchant' ? 'merchant' : 'buyer'

  const localized = {
    en: {
      noResult: `I could not find a direct match for "${query}" yet. Try a broader term like a category or location in Nigeria.`,
      noResultAlt: 'No exact match found, but here are similar options you might like.',
      topProducts: 'Top products',
      topServices: 'Top services',
      topVendors: 'Top vendors',
      nearbyPrefix: 'near you',
      merchantTip:
        'Merchant tip: refresh your product/service title, add clear pricing, and post a short promo to improve conversion.',
      buyerTip: 'Buyer tip: compare at least two vendors, then check location and reviews before placing your order.',
    },
    pcm: {
      noResult: `I no see exact result for "${query}" yet. Try broader word like category or location for Naija.`,
      noResultAlt: 'No exact match found, but here are similar options you might like.',
      topProducts: 'Top products wey show',
      topServices: 'Top services wey show',
      topVendors: 'Top vendors wey show',
      nearbyPrefix: 'close to your side',
      merchantTip:
        'Merchant tip: update your product/service title, put clear price, and post short promo make conversion improve.',
      buyerTip: 'Buyer tip: compare at least two vendors, check location and review before you place order.',
    },
    yo: {
      noResult: `Mi o ri esi to pe fun "${query}" sibẹ. E gbiyanju oro to gbooro bii eya ọja tabi ipo ni Naijiria.`,
      noResultAlt: 'No exact match found, but here are similar options you might like.',
      topProducts: 'Awon ọja to ga ju',
      topServices: 'Awon ise to ga ju',
      topVendors: 'Awon onisowo to ga ju',
      nearbyPrefix: 'to sunmo ipo re',
      merchantTip:
        'Imoran onisowo: se atunse oruko ọja/tabi ise, fi owo to ye han, ki o si fi ipolowo kukuru kun.',
      buyerTip: 'Imoran olura: fiwera o kere ju onisowo meji, ki o wo ipo ati ayewo ki o to paṣẹ.',
    },
    ig: {
      noResult: `Enwetaghi m nsonaazu ziri ezi maka "${query}" ugbu a. Nwalee okwu sara mbara dika udi ngwaahịa ma obu ebe.`,
      noResultAlt: 'No exact match found, but here are similar options you might like.',
      topProducts: 'Ngwaahịa kacha elu',
      topServices: 'Ọrụ kacha elu',
      topVendors: 'Ndi na-ere ahia kacha elu',
      nearbyPrefix: 'nso gi',
      merchantTip:
        'Ndumodu maka onye ahia: melite aha ngwaahịa/oru gi, tinye ego doro anya, ma tinye obere mgbasa ozi.',
      buyerTip: 'Ndumodu maka onye na-azu: tulee ndi na-ere ahia abuo ma obu karie, nyochaa ebe na reviews tupu izu.',
    },
    ha: {
      noResult: `Ban samu sakamako kai tsaye ga "${query}" ba yanzu. Gwada kalma mai fadi kamar rukuni ko wuri a Najeriya.`,
      noResultAlt: 'No exact match found, but here are similar options you might like.',
      topProducts: 'Manyan kayayyaki',
      topServices: 'Manyan ayyuka',
      topVendors: 'Manyan dillalai',
      nearbyPrefix: 'kusa da kai',
      merchantTip:
        'Shawara ga dan kasuwa: sabunta taken kaya/aiki, saka farashi a fili, sannan ka saka karamin talla.',
      buyerTip: 'Shawara ga mai siya: kwatanta dillalai akalla biyu, duba wuri da sharhi kafin oda.',
    },
  }

  const labels = localized[language as keyof typeof localized] || localized.en

  if (products.length === 0 && vendors.length === 0 && services.length === 0) {
    return labels.noResult
  }

  if (intentType === 'service' && services.length === 0 && (products.length > 0 || vendors.length > 0)) {
    return labels.noResultAlt
  }

  const parts: string[] = []
  if (products.length > 0) {
    const topProducts = products.slice(0, 3)
      .map((p) => `${p.name} (${p.vendor_name}) - NGN ${p.price.toLocaleString()}`)
      .join('; ')
    parts.push(`${labels.topProducts}: ${topProducts}.`)
  }

  if (services.length > 0) {
    const topServices = services.slice(0, 3)
      .map((s) => `${s.name} (${s.vendor}, ${s.location}) - NGN ${s.price.toLocaleString()}`)
      .join('; ')
    parts.push(`${labels.topServices}: ${topServices}.`)
  }

  if (vendors.length > 0) {
    const topVendors = vendors.slice(0, 3)
      .map((v) => `${v.name} (${v.category}, ${v.location})`)
      .join('; ')
    parts.push(`${labels.topVendors}: ${topVendors}.`)
  }

  if (userLocation) {
    parts.push(`Here are options ${labels.nearbyPrefix}: ${userLocation}.`)
  }

  parts.push(assistantMode === 'merchant' ? labels.merchantTip : labels.buyerTip)

  return parts.join(' ')
}

export function buildStructuredMarketplaceResponse(params: {
  intentType: MarketplaceIntentType
  query: string
  location?: string
  products: ProductSearchResult[]
  services: ServiceSearchResult[]
  vendors: VendorSearchResult[]
}): StructuredAiResponse {
  const location = String(params.location || 'Unknown location')

  if (params.intentType === 'service') {
    return {
      type: 'service',
      query: params.query,
      location,
      results: params.services.slice(0, 6).map((service) => ({
        name: service.name,
        price: service.price ? `NGN ${service.price.toLocaleString()}` : 'Not specified',
        vendor: service.vendor,
        location: service.location,
      })),
    }
  }

  if (params.intentType === 'vendor') {
    return {
      type: 'vendor',
      query: params.query,
      location,
      results: params.vendors.slice(0, 6).map((vendor) => ({
        name: vendor.name,
        price: 'N/A',
        vendor: vendor.name,
        location: vendor.location,
      })),
    }
  }

  return {
    type: 'product',
    query: params.query,
    location,
    results: params.products.slice(0, 6).map((product) => ({
      name: product.name,
      price: `NGN ${product.price.toLocaleString()}`,
      vendor: product.vendor_name,
      location: product.vendor_location,
    })),
  }
}
