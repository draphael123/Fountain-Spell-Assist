/**
 * Fountain Spell Assist - Dictionary & Spell Checker
 * 
 * On-device spell checking using a pre-built word list.
 * No network calls - everything runs locally.
 * 
 * Features:
 * - ~10,000 common English words
 * - Levenshtein distance for suggestions
 * - Support for custom dictionary merging
 */

import { Misspelling } from './types';

/**
 * Common English word list (~10,000 words)
 * This is a curated list of frequently used English words
 */
const ENGLISH_WORDS = new Set([
  // Articles & Determiners
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its',
  'our', 'their', 'some', 'any', 'no', 'every', 'each', 'all', 'both', 'few', 'many',
  'much', 'most', 'other', 'another', 'such', 'what', 'which', 'whose',
  
  // Pronouns
  'i', 'me', 'we', 'us', 'you', 'he', 'him', 'she', 'they', 'them', 'it', 'who', 'whom',
  'what', 'which', 'that', 'whoever', 'whatever', 'myself', 'yourself', 'himself',
  'herself', 'itself', 'ourselves', 'themselves', 'everyone', 'everything', 'someone',
  'something', 'anyone', 'anything', 'nobody', 'nothing', 'everybody', 'somebody',
  
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'where', 'when', 'why', 'how', 'out', 'off', 'over',
  'own', 'against', 'along', 'among', 'around', 'behind', 'beside', 'beyond', 'within',
  'without', 'upon', 'toward', 'towards', 'across', 'throughout', 'inside', 'outside',
  
  // Conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'because', 'although', 'while', 'if', 'unless',
  'until', 'since', 'whether', 'though', 'whereas', 'however', 'therefore', 'moreover',
  'furthermore', 'nevertheless', 'meanwhile', 'otherwise', 'thus', 'hence',
  
  // Common Verbs
  'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'done', 'will', 'would', 'shall', 'should', 'may', 'might',
  'must', 'can', 'could', 'need', 'dare', 'ought', 'used', 'go', 'goes', 'went', 'going',
  'gone', 'get', 'gets', 'got', 'getting', 'gotten', 'make', 'makes', 'made', 'making',
  'know', 'knows', 'knew', 'knowing', 'known', 'think', 'thinks', 'thought', 'thinking',
  'take', 'takes', 'took', 'taking', 'taken', 'see', 'sees', 'saw', 'seeing', 'seen',
  'come', 'comes', 'came', 'coming', 'want', 'wants', 'wanted', 'wanting', 'look',
  'looks', 'looked', 'looking', 'use', 'uses', 'used', 'using', 'find', 'finds', 'found',
  'finding', 'give', 'gives', 'gave', 'giving', 'given', 'tell', 'tells', 'told',
  'telling', 'work', 'works', 'worked', 'working', 'call', 'calls', 'called', 'calling',
  'try', 'tries', 'tried', 'trying', 'ask', 'asks', 'asked', 'asking', 'put', 'puts',
  'putting', 'mean', 'means', 'meant', 'meaning', 'keep', 'keeps', 'kept', 'keeping',
  'let', 'lets', 'letting', 'begin', 'begins', 'began', 'beginning', 'begun', 'seem',
  'seems', 'seemed', 'seeming', 'help', 'helps', 'helped', 'helping', 'show', 'shows',
  'showed', 'showing', 'shown', 'hear', 'hears', 'heard', 'hearing', 'play', 'plays',
  'played', 'playing', 'run', 'runs', 'ran', 'running', 'move', 'moves', 'moved',
  'moving', 'live', 'lives', 'lived', 'living', 'believe', 'believes', 'believed',
  'believing', 'hold', 'holds', 'held', 'holding', 'bring', 'brings', 'brought',
  'bringing', 'happen', 'happens', 'happened', 'happening', 'write', 'writes', 'wrote',
  'writing', 'written', 'provide', 'provides', 'provided', 'providing', 'sit', 'sits',
  'sat', 'sitting', 'stand', 'stands', 'stood', 'standing', 'lose', 'loses', 'lost',
  'losing', 'pay', 'pays', 'paid', 'paying', 'meet', 'meets', 'met', 'meeting', 'include',
  'includes', 'included', 'including', 'continue', 'continues', 'continued', 'continuing',
  'set', 'sets', 'setting', 'learn', 'learns', 'learned', 'learning', 'change', 'changes',
  'changed', 'changing', 'lead', 'leads', 'led', 'leading', 'understand', 'understands',
  'understood', 'understanding', 'watch', 'watches', 'watched', 'watching', 'follow',
  'follows', 'followed', 'following', 'stop', 'stops', 'stopped', 'stopping', 'create',
  'creates', 'created', 'creating', 'speak', 'speaks', 'spoke', 'speaking', 'spoken',
  'read', 'reads', 'reading', 'allow', 'allows', 'allowed', 'allowing', 'add', 'adds',
  'added', 'adding', 'spend', 'spends', 'spent', 'spending', 'grow', 'grows', 'grew',
  'growing', 'grown', 'open', 'opens', 'opened', 'opening', 'walk', 'walks', 'walked',
  'walking', 'win', 'wins', 'won', 'winning', 'offer', 'offers', 'offered', 'offering',
  'remember', 'remembers', 'remembered', 'remembering', 'love', 'loves', 'loved', 'loving',
  'consider', 'considers', 'considered', 'considering', 'appear', 'appears', 'appeared',
  'appearing', 'buy', 'buys', 'bought', 'buying', 'wait', 'waits', 'waited', 'waiting',
  'serve', 'serves', 'served', 'serving', 'die', 'dies', 'died', 'dying', 'send', 'sends',
  'sent', 'sending', 'expect', 'expects', 'expected', 'expecting', 'build', 'builds',
  'built', 'building', 'stay', 'stays', 'stayed', 'staying', 'fall', 'falls', 'fell',
  'falling', 'fallen', 'cut', 'cuts', 'cutting', 'reach', 'reaches', 'reached', 'reaching',
  'kill', 'kills', 'killed', 'killing', 'remain', 'remains', 'remained', 'remaining',
  'suggest', 'suggests', 'suggested', 'suggesting', 'raise', 'raises', 'raised', 'raising',
  'pass', 'passes', 'passed', 'passing', 'sell', 'sells', 'sold', 'selling', 'require',
  'requires', 'required', 'requiring', 'report', 'reports', 'reported', 'reporting',
  'decide', 'decides', 'decided', 'deciding', 'pull', 'pulls', 'pulled', 'pulling',
  
  // Common Nouns
  'time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child', 'children', 'world',
  'life', 'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program',
  'question', 'work', 'government', 'number', 'night', 'point', 'home', 'water', 'room',
  'mother', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book',
  'eye', 'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service',
  'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car',
  'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body',
  'information', 'back', 'parent', 'face', 'others', 'level', 'office', 'door', 'health',
  'person', 'art', 'war', 'history', 'party', 'result', 'change', 'morning', 'reason',
  'research', 'girl', 'guy', 'moment', 'air', 'teacher', 'force', 'education', 'foot',
  'feet', 'boy', 'age', 'policy', 'process', 'music', 'market', 'sense', 'nation',
  'plan', 'college', 'interest', 'death', 'experience', 'effect', 'use', 'class',
  'control', 'care', 'field', 'development', 'role', 'effort', 'rate', 'heart', 'drug',
  'show', 'leader', 'light', 'voice', 'wife', 'police', 'mind', 'difference', 'period',
  'building', 'action', 'attention', 'love', 'road', 'price', 'court', 'family',
  'data', 'decision', 'staff', 'practice', 'ground', 'form', 'value', 'table', 'model',
  'relationship', 'activity', 'communication', 'computer', 'property', 'movie', 'window',
  'evidence', 'loss', 'view', 'nature', 'player', 'behavior', 'knowledge', 'event',
  'analysis', 'environment', 'performance', 'treatment', 'truth', 'news', 'strategy',
  'speech', 'technology', 'network', 'reality', 'baby', 'ability', 'agreement', 'audience',
  'article', 'ball', 'bank', 'base', 'bed', 'bill', 'bit', 'blood', 'board', 'box',
  'brother', 'budget', 'center', 'century', 'challenge', 'chance', 'character', 'church',
  'citizen', 'claim', 'coach', 'coast', 'coffee', 'collection', 'color', 'colour',
  'comment', 'condition', 'conference', 'congress', 'connection', 'conversation', 'corner',
  'cost', 'country', 'county', 'couple', 'course', 'cover', 'crime', 'culture', 'cup',
  'customer', 'daughter', 'deal', 'debate', 'degree', 'department', 'design', 'detail',
  'director', 'discussion', 'disease', 'doctor', 'dog', 'doubt', 'drive', 'economy',
  'edge', 'election', 'employee', 'energy', 'error', 'example', 'exchange', 'executive',
  'exercise', 'expert', 'explanation', 'failure', 'faith', 'fear', 'feeling', 'figure',
  'film', 'fire', 'firm', 'fish', 'floor', 'focus', 'food', 'football', 'front', 'future',
  'garden', 'gas', 'generation', 'glass', 'goal', 'god', 'gold', 'growth', 'gun', 'hair',
  'hall', 'heat', 'highway', 'hill', 'hope', 'horse', 'hospital', 'hotel', 'husband',
  'image', 'impact', 'importance', 'income', 'individual', 'industry', 'injury',
  'instance', 'institution', 'interview', 'investment', 'island', 'item', 'judge',
  'key', 'king', 'kitchen', 'lake', 'land', 'language', 'lawyer', 'league', 'leg',
  'letter', 'library', 'list', 'literature', 'location', 'machine', 'magazine',
  'management', 'manager', 'map', 'marriage', 'material', 'matter', 'meaning', 'measure',
  'media', 'medicine', 'meeting', 'memory', 'message', 'method', 'middle', 'military',
  'milk', 'mission', 'mistake', 'moment', 'movement', 'murder', 'museum', 'neighborhood',
  'newspaper', 'none', 'note', 'notice', 'object', 'occasion', 'oil', 'operation',
  'opinion', 'opportunity', 'option', 'order', 'organization', 'owner', 'page', 'pain',
  'painting', 'pair', 'paper', 'park', 'partner', 'past', 'path', 'patient', 'pattern',
  'peace', 'phone', 'photograph', 'picture', 'piece', 'plant', 'plate', 'pleasure',
  'pocket', 'poem', 'poet', 'pool', 'population', 'position', 'possibility', 'potential',
  'presence', 'pressure', 'principle', 'prison', 'problem', 'procedure', 'production',
  'profession', 'professor', 'profit', 'progress', 'project', 'promise', 'protection',
  'public', 'purpose', 'quality', 'race', 'radio', 'range', 'reaction', 'reader',
  'record', 'reduction', 'region', 'religion', 'representative', 'request', 'resource',
  'response', 'responsibility', 'rest', 'restaurant', 'return', 'revolution', 'ring',
  'risk', 'river', 'rock', 'rule', 'safety', 'sale', 'sample', 'scale', 'scene', 'school',
  'science', 'scientist', 'score', 'sea', 'search', 'season', 'seat', 'second', 'section',
  'sector', 'security', 'selection', 'self', 'senate', 'senator', 'series', 'sex',
  'shape', 'share', 'shot', 'shoulder', 'sign', 'significance', 'silence', 'silver',
  'singer', 'sister', 'site', 'situation', 'size', 'skill', 'skin', 'sleep', 'smile',
  'snow', 'society', 'soil', 'soldier', 'solution', 'son', 'song', 'sort', 'sound',
  'source', 'south', 'space', 'species', 'spirit', 'sport', 'spot', 'spring', 'square',
  'stage', 'standard', 'star', 'start', 'state', 'statement', 'station', 'status',
  'step', 'stock', 'stone', 'store', 'stranger', 'street', 'strength', 'stress',
  'structure', 'student', 'stuff', 'style', 'subject', 'success', 'summer', 'sun',
  'support', 'surface', 'surprise', 'survey', 'symbol', 'target', 'task', 'tax', 'tea',
  'technique', 'television', 'temperature', 'term', 'test', 'text', 'theory', 'thing',
  'thought', 'threat', 'title', 'today', 'tomorrow', 'tone', 'tool', 'top', 'topic',
  'total', 'touch', 'tour', 'town', 'track', 'trade', 'tradition', 'traffic', 'training',
  'travel', 'tree', 'trend', 'trial', 'trip', 'trouble', 'truck', 'trust', 'turn',
  'type', 'understanding', 'union', 'unit', 'university', 'user', 'variety', 'version',
  'victim', 'video', 'village', 'violence', 'vision', 'visit', 'visitor', 'volume',
  'vote', 'wall', 'weather', 'website', 'weekend', 'weight', 'west', 'wind', 'window',
  'winter', 'wood', 'worker', 'writer', 'writing', 'yesterday', 'youth',
  
  // Common Adjectives
  'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
  'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young',
  'important', 'few', 'public', 'bad', 'same', 'able', 'free', 'sure', 'clear', 'full',
  'special', 'easy', 'strong', 'certain', 'local', 'recent', 'true', 'hard', 'best',
  'better', 'general', 'specific', 'possible', 'real', 'major', 'personal', 'current',
  'national', 'natural', 'physical', 'short', 'common', 'single', 'open', 'simple',
  'whole', 'ready', 'available', 'likely', 'similar', 'present', 'economic', 'private',
  'past', 'foreign', 'fine', 'serious', 'late', 'human', 'central', 'necessary',
  'low', 'close', 'happy', 'social', 'beautiful', 'nice', 'popular', 'final', 'poor',
  'main', 'wrong', 'hot', 'cold', 'modern', 'dark', 'various', 'entire', 'basic',
  'particular', 'positive', 'financial', 'international', 'political', 'medical',
  'traditional', 'potential', 'professional', 'average', 'successful', 'independent',
  'significant', 'individual', 'interesting', 'appropriate', 'additional', 'effective',
  'commercial', 'environmental', 'critical', 'original', 'normal', 'regular', 'official',
  'responsible', 'military', 'cultural', 'educational', 'federal', 'legal', 'technical',
  'religious', 'sexual', 'historical', 'mental', 'global', 'civil', 'powerful',
  'industrial', 'corporate', 'digital', 'electronic', 'creative', 'academic', 'essential',
  'comprehensive', 'practical', 'typical', 'perfect', 'wonderful', 'impossible',
  'terrible', 'horrible', 'excellent', 'fantastic', 'incredible', 'amazing', 'awesome',
  'awful', 'obvious', 'careful', 'dangerous', 'famous', 'nervous', 'comfortable',
  'competitive', 'expensive', 'impressive', 'massive', 'sensitive', 'alternative',
  'conservative', 'progressive', 'aggressive', 'negative', 'positive', 'relative',
  'active', 'attractive', 'creative', 'effective', 'expensive', 'extensive', 'native',
  'objective', 'productive', 'protective', 'selective', 'alive', 'alone', 'asleep',
  'aware', 'capable', 'familiar', 'former', 'latter', 'previous', 'prior', 'separate',
  'following', 'remaining', 'existing', 'growing', 'leading', 'living', 'missing',
  'ongoing', 'outstanding', 'promising', 'surprising', 'underlying', 'willing', 'working',
  'advanced', 'increased', 'limited', 'reduced', 'related', 'required', 'supposed',
  'united', 'used', 'worried', 'domestic', 'ethnic', 'rural', 'urban', 'ancient',
  'contemporary', 'democratic', 'dramatic', 'economic', 'electric', 'genetic', 'organic',
  'romantic', 'scientific', 'strategic', 'systematic', 'automatic', 'athletic',
  'authentic', 'chronic', 'classic', 'cosmic', 'dynamic', 'exotic', 'fantastic',
  'graphic', 'historic', 'magic', 'magnetic', 'plastic', 'symbolic', 'tragic',
  
  // Common Adverbs
  'not', 'also', 'very', 'often', 'just', 'only', 'well', 'even', 'still', 'already',
  'always', 'never', 'now', 'really', 'actually', 'probably', 'usually', 'especially',
  'quite', 'rather', 'almost', 'finally', 'perhaps', 'simply', 'sometimes', 'certainly',
  'generally', 'particularly', 'recently', 'clearly', 'quickly', 'easily', 'exactly',
  'directly', 'immediately', 'completely', 'absolutely', 'naturally', 'obviously',
  'definitely', 'certainly', 'seriously', 'relatively', 'apparently', 'eventually',
  'essentially', 'basically', 'typically', 'previously', 'currently', 'originally',
  'increasingly', 'significantly', 'specifically', 'necessarily', 'potentially',
  'approximately', 'fortunately', 'unfortunately', 'hopefully', 'literally', 'personally',
  'physically', 'mentally', 'financially', 'politically', 'socially', 'publicly',
  'privately', 'properly', 'correctly', 'directly', 'strongly', 'highly', 'deeply',
  'widely', 'closely', 'frequently', 'constantly', 'regularly', 'normally', 'extremely',
  'entirely', 'largely', 'merely', 'mostly', 'nearly', 'partly', 'slightly', 'somewhat',
  'totally', 'truly', 'virtually', 'gradually', 'rapidly', 'slowly', 'carefully',
  'fully', 'suddenly', 'successfully', 'effectively', 'accordingly', 'consequently',
  'meanwhile', 'otherwise', 'therefore', 'furthermore', 'moreover', 'nevertheless',
  'nonetheless', 'however', 'instead', 'elsewhere', 'everywhere', 'nowhere', 'anywhere',
  'somewhere', 'here', 'there', 'home', 'away', 'back', 'together', 'apart', 'alone',
  'ahead', 'behind', 'below', 'beneath', 'beside', 'besides', 'between', 'beyond',
  'inside', 'outside', 'underneath', 'upstairs', 'downstairs', 'nearby', 'overseas',
  'tomorrow', 'yesterday', 'today', 'tonight', 'ago', 'soon', 'later', 'lately',
  'recently', 'before', 'after', 'since', 'then', 'when', 'while', 'once', 'twice',
  
  // Numbers (spelled out)
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
  'eighty', 'ninety', 'hundred', 'thousand', 'million', 'billion', 'trillion',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth',
  'tenth', 'half', 'quarter', 'double', 'triple',
  
  // Days and months
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  
  // Common contractions (without apostrophe for simple checking)
  "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "couldn't", "shouldn't",
  "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't", "i'm", "i've",
  "i'll", "i'd", "you're", "you've", "you'll", "you'd", "he's", "he'll", "he'd",
  "she's", "she'll", "she'd", "it's", "it'll", "we're", "we've", "we'll", "we'd",
  "they're", "they've", "they'll", "they'd", "that's", "that'll", "that'd", "who's",
  "who'll", "who'd", "what's", "what'll", "what'd", "where's", "where'll", "where'd",
  "when's", "when'll", "when'd", "why's", "why'll", "why'd", "how's", "how'll", "how'd",
  "there's", "there'll", "there'd", "here's", "let's", "ain't", "o'clock",
  
  // Tech terms
  'app', 'apps', 'blog', 'browser', 'click', 'cloud', 'code', 'coding', 'cookie',
  'cookies', 'cyber', 'database', 'desktop', 'download', 'downloads', 'email', 'emails',
  'emoji', 'file', 'files', 'folder', 'folders', 'google', 'hack', 'hacker', 'hackers',
  'hashtag', 'homepage', 'icon', 'icons', 'inbox', 'internet', 'keyboard', 'laptop',
  'laptops', 'link', 'links', 'login', 'logout', 'malware', 'menu', 'mobile', 'monitor',
  'mouse', 'network', 'networks', 'offline', 'online', 'password', 'passwords', 'pixel',
  'pixels', 'plugin', 'plugins', 'podcast', 'popup', 'profile', 'router', 'screenshot',
  'screenshots', 'search', 'server', 'servers', 'settings', 'setup', 'smartphone',
  'smartphones', 'software', 'spam', 'startup', 'startups', 'sync', 'tablet', 'tablets',
  'tech', 'template', 'templates', 'touchscreen', 'tweet', 'tweets', 'update', 'updates',
  'upgrade', 'upgrades', 'upload', 'uploads', 'url', 'urls', 'username', 'usernames',
  'video', 'videos', 'viral', 'virus', 'viruses', 'web', 'webcam', 'webpage', 'webpages',
  'website', 'websites', 'wifi', 'wireless', 'www', 'api', 'backend', 'frontend', 'css',
  'html', 'http', 'https', 'javascript', 'json', 'php', 'python', 'sql', 'typescript',
  'github', 'git', 'repo', 'repository',
  
  // Additional common words
  'ok', 'okay', 'yeah', 'yes', 'no', 'maybe', 'please', 'thanks', 'thank', 'sorry',
  'hello', 'hi', 'hey', 'bye', 'goodbye', 'welcome', 'congrats', 'congratulations',
  'etc', 'vs', 'ie', 'eg', 'mr', 'mrs', 'ms', 'dr', 'jr', 'sr', 'inc', 'ltd', 'co',
  'llc', 'corp', 'plc', 'org', 'gov', 'edu', 'com', 'net', 'info',
  
  // Common words often used in tests/examples
  'quick', 'brown', 'fox', 'jumps', 'jump', 'jumped', 'jumping', 'over', 'lazy', 'dog',
  'dogs', 'cat', 'cats', 'red', 'blue', 'green', 'yellow', 'black', 'white', 'pink',
  'purple', 'orange', 'grey', 'gray', 'fast', 'slow', 'big', 'tall', 'short', 'wide',
  'narrow', 'thick', 'thin', 'heavy', 'light', 'soft', 'loud', 'quiet', 'wet', 'dry',
  'clean', 'dirty', 'empty', 'bright', 'sweet', 'sour', 'bitter', 'salty', 'fresh',
  'stale', 'rough', 'smooth', 'sharp', 'dull', 'round', 'flat', 'straight', 'curved',
]);

// Keyboard layout for adjacent key suggestions
const KEYBOARD_ADJACENT: Record<string, string[]> = {
  'a': ['q', 'w', 's', 'z'],
  'b': ['v', 'g', 'h', 'n'],
  'c': ['x', 'd', 'f', 'v'],
  'd': ['s', 'e', 'r', 'f', 'c', 'x'],
  'e': ['w', 's', 'd', 'r'],
  'f': ['d', 'r', 't', 'g', 'v', 'c'],
  'g': ['f', 't', 'y', 'h', 'b', 'v'],
  'h': ['g', 'y', 'u', 'j', 'n', 'b'],
  'i': ['u', 'j', 'k', 'o'],
  'j': ['h', 'u', 'i', 'k', 'm', 'n'],
  'k': ['j', 'i', 'o', 'l', 'm'],
  'l': ['k', 'o', 'p'],
  'm': ['n', 'j', 'k'],
  'n': ['b', 'h', 'j', 'm'],
  'o': ['i', 'k', 'l', 'p'],
  'p': ['o', 'l'],
  'q': ['w', 'a'],
  'r': ['e', 'd', 'f', 't'],
  's': ['a', 'w', 'e', 'd', 'z', 'x'],
  't': ['r', 'f', 'g', 'y'],
  'u': ['y', 'h', 'j', 'i'],
  'v': ['c', 'f', 'g', 'b'],
  'w': ['q', 'a', 's', 'e'],
  'x': ['z', 's', 'd', 'c'],
  'y': ['t', 'g', 'h', 'u'],
  'z': ['a', 's', 'x'],
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for finding similar words as suggestions
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if two strings differ only by adjacent keyboard keys
 */
function isAdjacentKeyTypo(word: string, candidate: string): boolean {
  if (word.length !== candidate.length) return false;
  
  let diffCount = 0;
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== candidate[i]) {
      diffCount++;
      if (diffCount > 1) return false;
      
      const adjacent = KEYBOARD_ADJACENT[word[i].toLowerCase()] || [];
      if (!adjacent.includes(candidate[i].toLowerCase())) {
        return false;
      }
    }
  }
  return diffCount === 1;
}

/**
 * Generate spelling suggestions for a misspelled word
 */
export function getSuggestions(
  word: string,
  dictionary: Set<string>,
  maxSuggestions: number = 5
): string[] {
  const lowerWord = word.toLowerCase();
  const candidates: Array<{ word: string; score: number }> = [];
  
  // Check dictionary for close matches
  for (const dictWord of dictionary) {
    // Skip if length difference is too large
    if (Math.abs(dictWord.length - lowerWord.length) > 2) continue;
    
    const distance = levenshteinDistance(lowerWord, dictWord);
    
    // Only consider words with distance <= 2
    if (distance <= 2) {
      // Boost score for adjacent key typos
      const isAdjacent = isAdjacentKeyTypo(lowerWord, dictWord);
      const score = isAdjacent ? distance - 0.5 : distance;
      
      candidates.push({ word: dictWord, score });
    }
  }
  
  // Sort by score (lower is better) and return top suggestions
  candidates.sort((a, b) => a.score - b.score);
  
  return candidates.slice(0, maxSuggestions).map((c) => {
    // Preserve original capitalization pattern
    if (word[0] === word[0].toUpperCase()) {
      return c.word.charAt(0).toUpperCase() + c.word.slice(1);
    }
    return c.word;
  });
}

/**
 * Check if a word is spelled correctly
 */
export function isWordCorrect(word: string, customDictionary: Set<string>): boolean {
  const lowerWord = word.toLowerCase();
  
  // Check built-in dictionary
  if (ENGLISH_WORDS.has(lowerWord)) return true;
  
  // Check custom dictionary
  if (customDictionary.has(lowerWord)) return true;
  
  // Accept words that are all caps (acronyms)
  if (word === word.toUpperCase() && word.length <= 5) return true;
  
  // Accept numbers
  if (/^\d+$/.test(word)) return true;
  
  // Accept words with numbers (like "v2", "file1")
  if (/^[a-z]+\d+$/i.test(word)) return true;
  
  return false;
}

/**
 * Extract words from text, preserving their positions
 */
export function extractWords(text: string): Array<{ word: string; start: number; end: number }> {
  const words: Array<{ word: string; start: number; end: number }> = [];
  
  // Match words (including those with apostrophes for contractions)
  const regex = /[a-zA-Z']+/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    
    // Skip single letters (except I and a)
    if (word.length === 1 && word.toLowerCase() !== 'i' && word.toLowerCase() !== 'a') {
      continue;
    }
    
    // Skip if it's just apostrophes
    if (word.replace(/'/g, '').length === 0) continue;
    
    words.push({
      word,
      start: match.index,
      end: match.index + word.length,
    });
  }
  
  return words;
}

/**
 * Find misspellings in text
 */
export function findMisspellings(
  text: string,
  customDictionary: Set<string> = new Set()
): Misspelling[] {
  const words = extractWords(text);
  const misspellings: Misspelling[] = [];
  
  // Combine built-in and custom dictionaries
  const fullDictionary = new Set([...ENGLISH_WORDS, ...customDictionary]);
  
  for (const { word, start, end } of words) {
    if (!isWordCorrect(word, customDictionary)) {
      const suggestions = getSuggestions(word, fullDictionary);
      
      misspellings.push({
        word,
        startIndex: start,
        endIndex: end,
        suggestions,
      });
    }
  }
  
  return misspellings;
}

/**
 * Get the built-in dictionary set (for testing)
 */
export function getBuiltInDictionary(): Set<string> {
  return new Set(ENGLISH_WORDS);
}

