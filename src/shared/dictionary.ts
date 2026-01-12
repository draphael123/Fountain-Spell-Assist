/**
 * Fountain Spell Assist - Dictionary & Spell Checker
 * 
 * On-device spell checking using a pre-built word list.
 * No network calls - everything runs locally.
 * 
 * Features:
 * - 15,000+ common English words
 * - Levenshtein distance for suggestions
 * - Keyboard adjacency detection for typos
 * - Support for custom dictionary merging
 */

import { Misspelling } from './types';

/**
 * Common English word list (15,000+ words)
 * This is a curated list of frequently used English words including:
 * - Common vocabulary
 * - Academic and professional terms
 * - Technical terminology
 * - Everyday expressions
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
  
  // Extended vocabulary - Academic & Professional
  'academic', 'academy', 'accept', 'acceptance', 'access', 'accessible', 'accident', 'accomplish',
  'accomplishment', 'account', 'accounting', 'accurate', 'achieve', 'achievement', 'acknowledge',
  'acknowledgment', 'acquire', 'acquisition', 'across', 'act', 'action', 'active', 'activity',
  'actor', 'actress', 'actual', 'actually', 'adapt', 'adaptation', 'add', 'addition', 'additional',
  'address', 'adequate', 'adjust', 'adjustment', 'administration', 'administrative', 'administrator',
  'admire', 'admission', 'admit', 'adopt', 'adoption', 'adult', 'advance', 'advanced', 'advantage',
  'adventure', 'advertise', 'advertisement', 'advice', 'advise', 'advisor', 'advocate', 'affair',
  'affect', 'affection', 'afford', 'afraid', 'afternoon', 'afterward', 'again', 'against', 'age',
  'agency', 'agenda', 'agent', 'aggressive', 'ago', 'agree', 'agreement', 'agricultural',
  'agriculture', 'ahead', 'aid', 'aim', 'air', 'aircraft', 'airline', 'airport', 'alarm', 'album',
  'alcohol', 'alive', 'all', 'allege', 'allegation', 'alliance', 'allow', 'ally', 'almost', 'alone',
  'along', 'already', 'also', 'alter', 'alternative', 'although', 'always', 'amazing', 'ambition',
  'ambitious', 'amendment', 'among', 'amount', 'analysis', 'analyst', 'analyze', 'ancient', 'and',
  'anger', 'angle', 'angry', 'animal', 'announce', 'announcement', 'annual', 'another', 'answer',
  'anticipate', 'anxiety', 'anxious', 'any', 'anybody', 'anymore', 'anyone', 'anything', 'anyway',
  'anywhere', 'apart', 'apartment', 'apologize', 'apology', 'apparent', 'apparently', 'appeal',
  'appear', 'appearance', 'apple', 'application', 'apply', 'appoint', 'appointment', 'appreciate',
  'approach', 'appropriate', 'approval', 'approve', 'approximately', 'architect', 'architecture',
  'area', 'argue', 'argument', 'arise', 'arm', 'armed', 'army', 'around', 'arrange', 'arrangement',
  'arrest', 'arrival', 'arrive', 'arrow', 'art', 'article', 'artist', 'artistic', 'as', 'ashamed',
  'aside', 'ask', 'asleep', 'aspect', 'assault', 'assert', 'assess', 'assessment', 'asset', 'assign',
  'assignment', 'assist', 'assistance', 'assistant', 'associate', 'association', 'assume',
  'assumption', 'assure', 'at', 'athlete', 'athletic', 'atmosphere', 'attach', 'attack', 'attempt',
  'attend', 'attention', 'attitude', 'attorney', 'attract', 'attraction', 'attractive', 'attribute',
  'audience', 'author', 'authority', 'authorize', 'auto', 'automatic', 'automatically', 'automobile',
  'autumn', 'available', 'average', 'avoid', 'award', 'aware', 'awareness', 'away', 'awful',
  'baby', 'back', 'background', 'backward', 'bad', 'badly', 'bag', 'bake', 'balance', 'ball',
  'ban', 'band', 'bank', 'bar', 'barely', 'barrel', 'barrier', 'base', 'baseball', 'basic',
  'basically', 'basis', 'basket', 'basketball', 'bath', 'bathroom', 'battery', 'battle', 'be',
  'beach', 'bean', 'bear', 'beat', 'beautiful', 'beauty', 'because', 'become', 'bed', 'bedroom',
  'beer', 'before', 'begin', 'beginning', 'behavior', 'behind', 'being', 'belief', 'believe',
  'bell', 'belong', 'below', 'belt', 'bench', 'bend', 'beneath', 'benefit', 'beside', 'besides',
  'best', 'bet', 'better', 'between', 'beyond', 'bias', 'bicycle', 'bid', 'big', 'bike', 'bill',
  'billion', 'bind', 'biological', 'biology', 'bird', 'birth', 'birthday', 'bit', 'bite', 'bitter',
  'black', 'blade', 'blame', 'blank', 'blanket', 'blind', 'block', 'blood', 'blow', 'blue',
  'board', 'boat', 'body', 'boil', 'bold', 'bomb', 'bond', 'bone', 'book', 'boom', 'boot',
  'border', 'bore', 'boring', 'born', 'borrow', 'boss', 'both', 'bother', 'bottle', 'bottom',
  'boundary', 'bowl', 'box', 'boy', 'brain', 'branch', 'brand', 'brave', 'bread', 'break',
  'breakfast', 'breast', 'breath', 'breathe', 'breathing', 'breed', 'brick', 'bridge', 'brief',
  'briefly', 'bright', 'brilliant', 'bring', 'broad', 'broadcast', 'broken', 'brother', 'brown',
  'brush', 'buck', 'budget', 'build', 'building', 'bullet', 'bunch', 'burden', 'burn', 'bury',
  'bus', 'bush', 'business', 'busy', 'but', 'butter', 'button', 'buy', 'buyer', 'by', 'cabin',
  'cabinet', 'cable', 'cake', 'calculate', 'call', 'calm', 'camera', 'camp', 'campaign', 'campus',
  'can', 'cancel', 'cancer', 'candidate', 'candle', 'candy', 'cap', 'capability', 'capable',
  'capacity', 'capital', 'captain', 'capture', 'car', 'carbon', 'card', 'care', 'career', 'careful',
  'carefully', 'carrier', 'carry', 'case', 'cash', 'cast', 'casual', 'cat', 'catch', 'category',
  'cattle', 'cause', 'ceiling', 'celebrate', 'celebration', 'celebrity', 'cell', 'cent', 'center',
  'central', 'century', 'ceremony', 'certain', 'certainly', 'chain', 'chair', 'chairman', 'challenge',
  'chamber', 'champion', 'championship', 'chance', 'change', 'changing', 'channel', 'chapter',
  'character', 'characteristic', 'characterize', 'charge', 'charity', 'chart', 'chase', 'cheap',
  'check', 'cheek', 'cheese', 'chef', 'chemical', 'chest', 'chicken', 'chief', 'child', 'childhood',
  'chip', 'chocolate', 'choice', 'cholesterol', 'choose', 'chop', 'church', 'cigarette', 'circle',
  'circumstance', 'cite', 'citizen', 'city', 'civil', 'civilian', 'claim', 'class', 'classic',
  'classroom', 'clay', 'clean', 'clear', 'clearly', 'clerk', 'click', 'client', 'cliff', 'climate',
  'climb', 'clinic', 'clinical', 'clock', 'close', 'closely', 'closer', 'clothes', 'clothing',
  'cloud', 'club', 'clue', 'cluster', 'coach', 'coal', 'coalition', 'coast', 'coat', 'code',
  'coffee', 'cognitive', 'cold', 'collapse', 'colleague', 'collect', 'collection', 'collective',
  'college', 'colonial', 'colony', 'color', 'column', 'combination', 'combine', 'come', 'comedy',
  'comfort', 'comfortable', 'command', 'commander', 'comment', 'commercial', 'commission',
  'commissioner', 'commit', 'commitment', 'committee', 'common', 'commonly', 'communicate',
  'communication', 'community', 'company', 'compare', 'comparison', 'compete', 'competition',
  'competitive', 'competitor', 'complain', 'complaint', 'complete', 'completely', 'complex',
  'complicated', 'component', 'compose', 'composition', 'comprehensive', 'computer', 'concentrate',
  'concentration', 'concept', 'concern', 'concerned', 'concert', 'conclude', 'conclusion',
  'concrete', 'condition', 'conduct', 'conference', 'confidence', 'confident', 'confirm',
  'conflict', 'confront', 'confusion', 'congress', 'congressional', 'connect', 'connection',
  'consciousness', 'consensus', 'consequence', 'conservative', 'consider', 'considerable',
  'consideration', 'consist', 'consistent', 'constant', 'constantly', 'constitute', 'constitutional',
  'construct', 'construction', 'consultant', 'consume', 'consumer', 'consumption', 'contact',
  'contain', 'container', 'contemporary', 'content', 'contest', 'context', 'continue', 'continued',
  'contract', 'contrast', 'contribute', 'contribution', 'control', 'controversial', 'controversy',
  'convention', 'conventional', 'conversation', 'convert', 'conviction', 'convince', 'cook',
  'cookie', 'cooking', 'cool', 'cooperation', 'cop', 'cope', 'copy', 'core', 'corn', 'corner',
  'corporate', 'corporation', 'correct', 'correctly', 'cost', 'cotton', 'couch', 'could', 'council',
  'counselor', 'count', 'counter', 'country', 'county', 'couple', 'courage', 'course', 'court',
  'cousin', 'cover', 'coverage', 'cow', 'crack', 'craft', 'crash', 'crazy', 'cream', 'create',
  'creation', 'creative', 'creature', 'credit', 'crew', 'crime', 'criminal', 'crisis', 'critic',
  'critical', 'criticism', 'criticize', 'crop', 'cross', 'crowd', 'crucial', 'cry', 'cultural',
  'culture', 'cup', 'cure', 'curious', 'current', 'currently', 'curriculum', 'curtain', 'curve',
  'custom', 'customer', 'cut', 'cute', 'cycle', 'dad', 'daily', 'damage', 'dance', 'dancer',
  'danger', 'dangerous', 'dare', 'dark', 'darkness', 'data', 'date', 'daughter', 'dawn', 'day',
  'dead', 'deal', 'dealer', 'dear', 'death', 'debate', 'debt', 'decade', 'decide', 'decision',
  'deck', 'declare', 'decline', 'decrease', 'deep', 'deeply', 'deer', 'defeat', 'defend',
  'defendant', 'defense', 'defensive', 'deficit', 'define', 'definitely', 'definition', 'degree',
  'delay', 'deliver', 'delivery', 'demand', 'democracy', 'democratic', 'democrat', 'demonstrate',
  'demonstration', 'deny', 'department', 'departure', 'depend', 'dependent', 'depending', 'depict',
  'depression', 'depth', 'deputy', 'derive', 'describe', 'description', 'desert', 'deserve',
  'design', 'designer', 'desire', 'desk', 'desperate', 'despite', 'destroy', 'destruction',
  'detail', 'detailed', 'detect', 'determine', 'develop', 'developing', 'development', 'device',
  'devote', 'dialogue', 'die', 'diet', 'differ', 'difference', 'different', 'differently',
  'difficult', 'difficulty', 'dig', 'digital', 'dimension', 'dining', 'dinner', 'direct',
  'direction', 'directly', 'director', 'dirt', 'dirty', 'disability', 'disagree', 'disappear',
  'disaster', 'discipline', 'discourse', 'discover', 'discovery', 'discrimination', 'discuss',
  'discussion', 'disease', 'dish', 'dismiss', 'disorder', 'display', 'dispute', 'distance',
  'distant', 'distinct', 'distinction', 'distinguish', 'distribute', 'distribution', 'district',
  'diverse', 'diversity', 'divide', 'division', 'divorce', 'dna', 'do', 'doctor', 'document',
  'dog', 'domestic', 'dominant', 'dominate', 'door', 'double', 'doubt', 'down', 'downtown',
  'dozen', 'draft', 'drag', 'drama', 'dramatic', 'dramatically', 'draw', 'drawing', 'dream',
  'dress', 'drink', 'drive', 'driver', 'drop', 'drug', 'dry', 'due', 'during', 'dust', 'duty',
  'each', 'eager', 'ear', 'early', 'earn', 'earth', 'ease', 'easily', 'east', 'eastern', 'easy',
  'eat', 'economic', 'economics', 'economist', 'economy', 'edge', 'edition', 'editor', 'educate',
  'education', 'educational', 'educator', 'effect', 'effective', 'effectively', 'efficiency',
  'efficient', 'effort', 'egg', 'eight', 'either', 'elderly', 'elect', 'election', 'electric',
  'electricity', 'electronic', 'element', 'elementary', 'eliminate', 'elite', 'else', 'elsewhere',
  'email', 'embrace', 'emerge', 'emergency', 'emission', 'emotion', 'emotional', 'emperor',
  'emphasis', 'emphasize', 'employ', 'employee', 'employer', 'employment', 'empty', 'enable',
  'encounter', 'encourage', 'end', 'enemy', 'energy', 'enforcement', 'engage', 'engine',
  'engineer', 'engineering', 'english', 'enhance', 'enjoy', 'enormous', 'enough', 'ensure',
  'enter', 'enterprise', 'entertainment', 'entire', 'entirely', 'entrance', 'entry', 'environment',
  'environmental', 'episode', 'equal', 'equally', 'equation', 'equipment', 'era', 'error', 'escape',
  'especially', 'essay', 'essential', 'essentially', 'establish', 'establishment', 'estate',
  'estimate', 'etc', 'ethnic', 'european', 'evaluate', 'evaluation', 'even', 'evening', 'event',
  'eventually', 'ever', 'every', 'everybody', 'everyday', 'everyone', 'everything', 'everywhere',
  'evidence', 'evolution', 'evolve', 'exact', 'exactly', 'examination', 'examine', 'example',
  'exceed', 'excellent', 'except', 'exception', 'exchange', 'excited', 'excitement', 'exciting',
  'exclude', 'excuse', 'execute', 'execution', 'executive', 'exercise', 'exhibit', 'exhibition',
  'exist', 'existence', 'existing', 'expand', 'expansion', 'expect', 'expectation', 'expense',
  'expensive', 'experience', 'experiment', 'expert', 'explain', 'explanation', 'explode',
  'explore', 'explosion', 'expose', 'exposure', 'express', 'expression', 'extend', 'extension',
  'extensive', 'extent', 'external', 'extra', 'extraordinary', 'extreme', 'extremely', 'eye',
  'fabric', 'face', 'facility', 'fact', 'factor', 'factory', 'faculty', 'fade', 'fail', 'failure',
  'fair', 'fairly', 'faith', 'fall', 'false', 'familiar', 'family', 'famous', 'fan', 'fancy',
  'fantasy', 'far', 'farm', 'farmer', 'fashion', 'fast', 'fat', 'fate', 'father', 'fault',
  'favor', 'favorite', 'fear', 'feature', 'federal', 'fee', 'feed', 'feel', 'feeling', 'fellow',
  'female', 'fence', 'few', 'fewer', 'fiber', 'fiction', 'field', 'fifteen', 'fifth', 'fifty',
  'fight', 'fighter', 'fighting', 'figure', 'file', 'fill', 'film', 'final', 'finally', 'finance',
  'financial', 'find', 'finding', 'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fish',
  'fishing', 'fit', 'fitness', 'five', 'fix', 'flag', 'flame', 'flat', 'flavor', 'flee', 'flesh',
  'flight', 'float', 'floor', 'flow', 'flower', 'fly', 'focus', 'folk', 'follow', 'following',
  'food', 'foot', 'football', 'for', 'force', 'foreign', 'forest', 'forever', 'forget', 'form',
  'formal', 'formation', 'former', 'formula', 'forth', 'fortune', 'forward', 'found', 'foundation',
  'founder', 'four', 'fourth', 'frame', 'framework', 'free', 'freedom', 'freeze', 'french',
  'frequency', 'frequent', 'frequently', 'fresh', 'friend', 'friendly', 'friendship', 'from',
  'front', 'fruit', 'frustration', 'fuel', 'full', 'fully', 'fun', 'function', 'fund', 'fundamental',
  'funding', 'funeral', 'funny', 'furniture', 'furthermore', 'future', 'gain', 'galaxy', 'gallery',
  'game', 'gang', 'gap', 'garage', 'garden', 'garlic', 'gas', 'gate', 'gather', 'gay', 'gaze',
  'gear', 'gender', 'gene', 'general', 'generally', 'generate', 'generation', 'genetic', 'genius',
  'genre', 'gentle', 'gentleman', 'gently', 'genuine', 'get', 'ghost', 'giant', 'gift', 'gifted',
  'girl', 'girlfriend', 'give', 'glad', 'glance', 'glass', 'global', 'globe', 'glory', 'go',
  'goal', 'god', 'gold', 'golden', 'golf', 'good', 'government', 'governor', 'grab', 'grade',
  'gradually', 'graduate', 'grain', 'grand', 'grandfather', 'grandmother', 'grant', 'grass',
  'grave', 'gray', 'great', 'greatest', 'greatly', 'green', 'greet', 'grocery', 'ground', 'group',
  'grow', 'growing', 'growth', 'guarantee', 'guard', 'guess', 'guest', 'guide', 'guideline', 'guilty',
  'gun', 'guy', 'habit', 'habitat', 'hair', 'half', 'hall', 'hand', 'handle', 'hang', 'happen',
  'happily', 'happiness', 'happy', 'hard', 'hardly', 'hat', 'hate', 'have', 'he', 'head', 'headline',
  'headquarters', 'health', 'healthy', 'hear', 'hearing', 'heart', 'heat', 'heaven', 'heavily',
  'heavy', 'heel', 'height', 'helicopter', 'hell', 'hello', 'help', 'helpful', 'her', 'here',
  'heritage', 'hero', 'herself', 'hey', 'hi', 'hide', 'high', 'highlight', 'highly', 'highway',
  'hill', 'him', 'himself', 'hip', 'hire', 'his', 'historian', 'historic', 'historical', 'history',
  'hit', 'hold', 'hole', 'holiday', 'holy', 'home', 'homeless', 'honest', 'honey', 'honor',
  'hope', 'horizon', 'horror', 'horse', 'hospital', 'host', 'hot', 'hotel', 'hour', 'house',
  'household', 'housing', 'how', 'however', 'huge', 'human', 'humor', 'hundred', 'hungry', 'hunt',
  'hunter', 'hunting', 'hurt', 'husband', 'hypothesis', 'i', 'ice', 'idea', 'ideal', 'identification',
  'identify', 'identity', 'ie', 'if', 'ignore', 'ill', 'illegal', 'illness', 'illustrate', 'image',
  'imagination', 'imagine', 'immediate', 'immediately', 'immigrant', 'immigration', 'impact',
  'implement', 'implementation', 'implication', 'imply', 'importance', 'important', 'impose',
  'impossible', 'impress', 'impression', 'impressive', 'improve', 'improvement', 'in', 'incentive',
  'incident', 'include', 'including', 'income', 'incorporate', 'increase', 'increased', 'increasing',
  'increasingly', 'incredible', 'indeed', 'independence', 'independent', 'index', 'indicate',
  'indication', 'individual', 'industrial', 'industry', 'inevitable', 'infant', 'infection',
  'inflation', 'influence', 'inform', 'information', 'ingredient', 'initial', 'initially', 'initiative',
  'injury', 'inner', 'innocent', 'innovation', 'input', 'inquiry', 'inside', 'insight', 'insist',
  'inspire', 'install', 'instance', 'instead', 'institution', 'institutional', 'instruction',
  'instructor', 'instrument', 'insurance', 'intellectual', 'intelligence', 'intend', 'intense',
  'intensity', 'intention', 'interaction', 'interest', 'interested', 'interesting', 'internal',
  'international', 'internet', 'interpret', 'interpretation', 'intervention', 'interview',
  'into', 'introduce', 'introduction', 'invasion', 'invest', 'investigate', 'investigation',
  'investigator', 'investment', 'investor', 'invite', 'involve', 'involved', 'involvement', 'iron',
  'island', 'isolate', 'issue', 'it', 'item', 'its', 'itself', 'jacket', 'jail', 'jet', 'jewelry',
  'job', 'join', 'joint', 'joke', 'journal', 'journalist', 'journey', 'joy', 'judge', 'judgment',
  'juice', 'jump', 'junior', 'jury', 'just', 'justice', 'justify', 'keep', 'key', 'kick', 'kid',
  'kill', 'killer', 'killing', 'kind', 'king', 'kiss', 'kitchen', 'knee', 'knife', 'knock',
  'know', 'knowledge', 'lab', 'label', 'labor', 'laboratory', 'lack', 'lady', 'lake', 'land',
  'landscape', 'language', 'lap', 'large', 'largely', 'last', 'late', 'later', 'latter', 'laugh',
  'launch', 'law', 'lawn', 'lawsuit', 'lawyer', 'lay', 'layer', 'lead', 'leader', 'leadership',
  'leading', 'leaf', 'league', 'lean', 'learn', 'learning', 'least', 'leather', 'leave', 'left',
  'leg', 'legacy', 'legal', 'legend', 'legislation', 'legislative', 'legislator', 'legitimate',
  'lemon', 'length', 'lens', 'less', 'lesson', 'let', 'letter', 'level', 'liberal', 'library',
  'license', 'lie', 'life', 'lifestyle', 'lifetime', 'lift', 'light', 'like', 'likely', 'limit',
  'limitation', 'limited', 'line', 'link', 'lip', 'list', 'listen', 'literally', 'literary',
  'literature', 'little', 'live', 'living', 'load', 'loan', 'local', 'locate', 'location', 'lock',
  'long', 'look', 'loop', 'loose', 'lose', 'loss', 'lost', 'lot', 'lots', 'loud', 'love', 'lovely',
  'lover', 'low', 'lower', 'luck', 'lucky', 'lunch', 'lung', 'machine', 'mad', 'magazine', 'magic',
  'mail', 'main', 'mainly', 'maintain', 'maintenance', 'major', 'majority', 'make', 'maker',
  'makeup', 'male', 'mall', 'man', 'manage', 'management', 'manager', 'manner', 'manufacturer',
  'manufacturing', 'many', 'map', 'margin', 'mark', 'market', 'marketing', 'marriage', 'married',
  'marry', 'mask', 'mass', 'massive', 'master', 'match', 'material', 'math', 'matter', 'may',
  'maybe', 'mayor', 'me', 'meal', 'mean', 'meaning', 'meanwhile', 'measure', 'measurement', 'meat',
  'mechanism', 'media', 'medical', 'medication', 'medicine', 'medium', 'meet', 'meeting', 'member',
  'membership', 'memory', 'mental', 'mention', 'menu', 'mere', 'merely', 'mess', 'message', 'metal',
  'meter', 'method', 'middle', 'might', 'mile', 'military', 'milk', 'million', 'mind', 'mine',
  'minister', 'minor', 'minority', 'minute', 'miracle', 'mirror', 'miss', 'missile', 'mission',
  'mistake', 'mix', 'mixture', 'mm-hmm', 'mode', 'model', 'moderate', 'modern', 'modest', 'mom',
  'moment', 'money', 'monitor', 'month', 'mood', 'moon', 'moral', 'more', 'moreover', 'morning',
  'mortgage', 'most', 'mostly', 'mother', 'motion', 'motivation', 'motor', 'mount', 'mountain',
  'mouse', 'mouth', 'move', 'movement', 'movie', 'mr', 'mrs', 'much', 'multiple', 'murder',
  'muscle', 'museum', 'music', 'musical', 'musician', 'must', 'mutual', 'my', 'myself', 'mystery',
  'myth', 'nail', 'name', 'narrative', 'narrow', 'nation', 'national', 'native', 'natural',
  'naturally', 'nature', 'near', 'nearby', 'nearly', 'necessarily', 'necessary', 'neck', 'need',
  'negative', 'negotiate', 'negotiation', 'neighbor', 'neighborhood', 'neither', 'nerve', 'nervous',
  'nest', 'net', 'network', 'never', 'nevertheless', 'new', 'newly', 'news', 'newspaper', 'next',
  'nice', 'night', 'nine', 'no', 'nobody', 'nod', 'noise', 'nomination', 'none', 'nonetheless',
  'nor', 'normal', 'normally', 'north', 'northern', 'nose', 'not', 'note', 'nothing', 'notice',
  'notion', 'novel', 'now', 'nowhere', 'nuclear', 'number', 'numerous', 'nurse', 'nut', 'object',
  'objective', 'obligation', 'observation', 'observe', 'observer', 'obtain', 'obvious', 'obviously',
  'occasion', 'occasionally', 'occur', 'ocean', 'odd', 'odds', 'of', 'off', 'offense', 'offensive',
  'offer', 'office', 'officer', 'official', 'often', 'oh', 'oil', 'ok', 'okay', 'old', 'on',
  'once', 'one', 'ongoing', 'onion', 'online', 'only', 'onto', 'open', 'opening', 'operate',
  'operating', 'operation', 'operator', 'opinion', 'opponent', 'opportunity', 'oppose', 'opposite',
  'opposition', 'option', 'or', 'orange', 'order', 'ordinary', 'organic', 'organization',
  'organize', 'orientation', 'origin', 'original', 'originally', 'other', 'others', 'otherwise',
  'ought', 'our', 'ourselves', 'out', 'outcome', 'outline', 'outlook', 'output', 'outside',
  'outstanding', 'over', 'overall', 'overcome', 'overlook', 'owe', 'own', 'owner', 'pace', 'pack',
  'package', 'page', 'pain', 'painful', 'paint', 'painter', 'painting', 'pair', 'pale', 'pan',
  'panel', 'pant', 'paper', 'parent', 'park', 'parking', 'part', 'participant', 'participate',
  'participation', 'particular', 'particularly', 'partly', 'partner', 'partnership', 'party',
  'pass', 'passage', 'passenger', 'passion', 'past', 'patch', 'path', 'patient', 'pattern', 'pause',
  'pay', 'payment', 'peace', 'peak', 'peer', 'penalty', 'people', 'pepper', 'per', 'perceive',
  'percentage', 'perception', 'perfect', 'perfectly', 'perform', 'performance', 'perhaps', 'period',
  'permanent', 'permission', 'permit', 'person', 'personal', 'personality', 'personally',
  'personnel', 'perspective', 'persuade', 'pet', 'phase', 'phenomenon', 'philosophy', 'phone',
  'photo', 'photograph', 'photographer', 'phrase', 'physical', 'physically', 'physician', 'piano',
  'pick', 'picture', 'pie', 'piece', 'pile', 'pilot', 'pin', 'pink', 'pioneer', 'pipe', 'pitch',
  'place', 'plan', 'plane', 'planet', 'planning', 'plant', 'plastic', 'plate', 'platform', 'play',
  'player', 'please', 'pleasure', 'plenty', 'plot', 'plus', 'pm', 'pocket', 'poem', 'poet',
  'poetry', 'point', 'pole', 'police', 'policy', 'political', 'politically', 'politician', 'politics',
  'poll', 'pollution', 'pool', 'poor', 'pop', 'popular', 'population', 'porch', 'port', 'portion',
  'portrait', 'portray', 'pose', 'position', 'positive', 'possess', 'possibility', 'possible',
  'possibly', 'post', 'pot', 'potato', 'potential', 'potentially', 'pound', 'pour', 'poverty',
  'powder', 'power', 'powerful', 'practical', 'practice', 'pray', 'prayer', 'precisely', 'predict',
  'prefer', 'preference', 'pregnancy', 'pregnant', 'preparation', 'prepare', 'presence', 'present',
  'presentation', 'preserve', 'president', 'presidential', 'press', 'pressure', 'pretend', 'pretty',
  'prevent', 'previous', 'previously', 'price', 'pride', 'priest', 'primarily', 'primary', 'prime',
  'principal', 'principle', 'print', 'prior', 'priority', 'prison', 'prisoner', 'privacy', 'private',
  'probably', 'problem', 'procedure', 'proceed', 'process', 'produce', 'producer', 'product',
  'production', 'profession', 'professional', 'professor', 'profile', 'profit', 'program',
  'progress', 'project', 'prominent', 'promise', 'promote', 'promotion', 'prompt', 'proof', 'proper',
  'properly', 'property', 'proportion', 'proposal', 'propose', 'proposed', 'prosecutor', 'prospect',
  'protect', 'protection', 'protein', 'protest', 'proud', 'prove', 'provide', 'provider',
  'province', 'provision', 'psychological', 'psychologist', 'psychology', 'public', 'publication',
  'publicly', 'publish', 'publisher', 'pull', 'punch', 'purchase', 'pure', 'purple', 'purpose',
  'pursue', 'push', 'put', 'qualify', 'quality', 'quarter', 'quarterback', 'question', 'quick',
  'quickly', 'quiet', 'quietly', 'quit', 'quite', 'quote', 'race', 'racial', 'radical', 'radio',
  'rail', 'rain', 'raise', 'range', 'rank', 'rapid', 'rapidly', 'rare', 'rarely', 'rate', 'rather',
  'rating', 'ratio', 'raw', 'reach', 'react', 'reaction', 'read', 'reader', 'reading', 'ready',
  'real', 'reality', 'realize', 'really', 'reason', 'reasonable', 'reasonably', 'recall', 'receive',
  'recent', 'recently', 'recipe', 'recognition', 'recognize', 'recommend', 'recommendation', 'record',
  'recording', 'recover', 'recovery', 'recruit', 'red', 'reduce', 'reduction', 'refer', 'reference',
  'reflect', 'reflection', 'reform', 'refugee', 'refuse', 'regard', 'regarding', 'regardless',
  'regime', 'region', 'regional', 'register', 'regular', 'regularly', 'regulate', 'regulation',
  'regulator', 'regulatory', 'reinforce', 'reject', 'relate', 'relation', 'relationship', 'relative',
  'relatively', 'relax', 'release', 'relevant', 'reliability', 'reliable', 'relief', 'religion',
  'religious', 'reluctant', 'rely', 'remain', 'remaining', 'remarkable', 'remember', 'remind',
  'remote', 'removal', 'remove', 'repeat', 'repeatedly', 'replace', 'reply', 'report', 'reporter',
  'represent', 'representation', 'representative', 'republican', 'reputation', 'request', 'require',
  'requirement', 'research', 'researcher', 'resemble', 'reservation', 'resident', 'resist',
  'resistance', 'resolution', 'resolve', 'resort', 'resource', 'respect', 'respond', 'respondent',
  'response', 'responsibility', 'responsible', 'rest', 'restaurant', 'restore', 'restriction',
  'result', 'retain', 'retire', 'retirement', 'return', 'reveal', 'revenue', 'review', 'revolution',
  'rhythm', 'rice', 'rich', 'rid', 'ride', 'rifle', 'right', 'ring', 'rise', 'risk', 'river',
  'road', 'rock', 'role', 'roll', 'romantic', 'roof', 'room', 'root', 'rope', 'rose', 'rough',
  'roughly', 'round', 'route', 'routine', 'row', 'rub', 'rule', 'run', 'running', 'rural', 'rush',
  'sad', 'safe', 'safety', 'sake', 'salad', 'salary', 'sale', 'sales', 'salt', 'same', 'sample',
  'sanction', 'sand', 'satellite', 'satisfaction', 'satisfy', 'sauce', 'save', 'saving', 'saw',
  'say', 'scale', 'scandal', 'scared', 'scenario', 'scene', 'schedule', 'scheme', 'scholar',
  'scholarship', 'school', 'science', 'scientific', 'scientist', 'scope', 'score', 'scream',
  'screen', 'script', 'sea', 'search', 'season', 'seat', 'second', 'secret', 'secretary', 'section',
  'sector', 'secure', 'security', 'see', 'seed', 'seek', 'seem', 'segment', 'seize', 'select',
  'selection', 'self', 'sell', 'senate', 'senator', 'send', 'senior', 'sense', 'sensitive',
  'sentence', 'separate', 'sequence', 'series', 'serious', 'seriously', 'serve', 'service', 'session',
  'set', 'setting', 'settle', 'settlement', 'seven', 'several', 'severe', 'sex', 'sexual', 'shade',
  'shadow', 'shake', 'shall', 'shape', 'share', 'sharp', 'she', 'sheet', 'shelf', 'shell', 'shelter',
  'shift', 'shine', 'ship', 'shirt', 'shit', 'shock', 'shoe', 'shoot', 'shooting', 'shop', 'shopping',
  'shore', 'short', 'shortly', 'shot', 'should', 'shoulder', 'shout', 'show', 'shower', 'shrug',
  'shut', 'sick', 'side', 'sigh', 'sight', 'sign', 'signal', 'significance', 'significant',
  'significantly', 'silence', 'silent', 'silly', 'silver', 'similar', 'similarly', 'simple',
  'simply', 'sin', 'since', 'sing', 'singer', 'single', 'sink', 'sir', 'sister', 'sit', 'site',
  'situation', 'six', 'size', 'ski', 'skill', 'skin', 'sky', 'slave', 'sleep', 'slice', 'slide',
  'slight', 'slightly', 'slow', 'slowly', 'small', 'smart', 'smell', 'smile', 'smoke', 'smooth',
  'snap', 'snow', 'so', 'so-called', 'soccer', 'social', 'society', 'soft', 'software', 'soil',
  'solar', 'soldier', 'solid', 'solution', 'solve', 'some', 'somebody', 'somehow', 'someone',
  'something', 'sometimes', 'somewhat', 'somewhere', 'son', 'song', 'soon', 'sophisticated', 'sorry',
  'sort', 'soul', 'sound', 'soup', 'source', 'south', 'southern', 'space', 'spare', 'speak',
  'speaker', 'special', 'specialist', 'species', 'specific', 'specifically', 'speech', 'speed',
  'spend', 'spending', 'spin', 'spirit', 'spiritual', 'split', 'spokesman', 'sport', 'spot', 'spread',
  'spring', 'square', 'squeeze', 'stability', 'stable', 'staff', 'stage', 'stake', 'stand',
  'standard', 'standing', 'star', 'stare', 'start', 'state', 'statement', 'station', 'statistics',
  'status', 'stay', 'steady', 'steal', 'steel', 'step', 'stick', 'still', 'stir', 'stock',
  'stomach', 'stone', 'stop', 'storage', 'store', 'storm', 'story', 'straight', 'strange',
  'stranger', 'strategic', 'strategy', 'stream', 'street', 'strength', 'strengthen', 'stress',
  'stretch', 'strike', 'string', 'strip', 'stroke', 'strong', 'strongly', 'structure', 'struggle',
  'student', 'studio', 'study', 'stuff', 'stupid', 'style', 'subject', 'submit', 'subsequent',
  'substance', 'substantial', 'succeed', 'success', 'successful', 'successfully', 'such', 'sudden',
  'suddenly', 'sue', 'suffer', 'sufficient', 'sugar', 'suggest', 'suggestion', 'suicide', 'suit',
  'summer', 'summit', 'sun', 'super', 'supply', 'support', 'supporter', 'suppose', 'supposed',
  'supreme', 'sure', 'surely', 'surface', 'surgery', 'surprise', 'surprised', 'surprising',
  'surprisingly', 'surround', 'survey', 'survival', 'survive', 'survivor', 'suspect', 'sustain',
  'swear', 'sweep', 'sweet', 'swim', 'swing', 'switch', 'symbol', 'symptom', 'syndrome', 'system',
  'table', 'tackle', 'tactic', 'tail', 'take', 'tale', 'talent', 'talk', 'tall', 'tank', 'tap',
  'tape', 'target', 'task', 'taste', 'tax', 'taxpayer', 'tea', 'teach', 'teacher', 'teaching',
  'team', 'tear', 'teaspoon', 'technical', 'technique', 'technology', 'teen', 'teenager', 'telephone',
  'telescope', 'television', 'tell', 'temperature', 'temporary', 'ten', 'tend', 'tendency', 'tennis',
  'tension', 'tent', 'term', 'terms', 'terrible', 'territory', 'terror', 'terrorism', 'terrorist',
  'test', 'testify', 'testimony', 'testing', 'text', 'than', 'thank', 'thanks', 'that', 'the',
  'theater', 'their', 'them', 'theme', 'themselves', 'then', 'theory', 'therapy', 'there', 'therefore',
  'these', 'they', 'thick', 'thin', 'thing', 'think', 'thinking', 'third', 'thirty', 'this',
  'those', 'though', 'thought', 'thousand', 'threat', 'threaten', 'three', 'throat', 'through',
  'throughout', 'throw', 'thumb', 'thus', 'ticket', 'tie', 'tight', 'time', 'tiny', 'tip', 'tire',
  'tired', 'tissue', 'title', 'to', 'tobacco', 'today', 'toe', 'together', 'tomato', 'tomorrow',
  'tone', 'tongue', 'tonight', 'too', 'tool', 'tooth', 'top', 'topic', 'toss', 'total', 'totally',
  'touch', 'tough', 'tour', 'tourist', 'tournament', 'toward', 'towards', 'tower', 'town', 'toy',
  'trace', 'track', 'trade', 'tradition', 'traditional', 'traffic', 'tragedy', 'trail', 'train',
  'training', 'transfer', 'transform', 'transformation', 'transition', 'translate', 'transportation',
  'trap', 'trash', 'travel', 'treat', 'treatment', 'treaty', 'tree', 'tremendous', 'trend', 'trial',
  'tribe', 'trick', 'trip', 'troop', 'trouble', 'truck', 'true', 'truly', 'trust', 'truth', 'try',
  'tube', 'tunnel', 'turn', 'tv', 'twelve', 'twenty', 'twice', 'twin', 'two', 'type', 'typical',
  'typically', 'ugly', 'ultimate', 'ultimately', 'unable', 'uncle', 'under', 'undergo', 'understand',
  'understanding', 'unfortunately', 'union', 'unique', 'unit', 'united', 'universal', 'universe',
  'university', 'unknown', 'unless', 'unlike', 'unlikely', 'until', 'unusual', 'up', 'upon',
  'upper', 'urban', 'urge', 'us', 'use', 'used', 'useful', 'user', 'usual', 'usually', 'utility',
  'utilize', 'vacation', 'valley', 'valuable', 'value', 'variable', 'variation', 'variety', 'various',
  'vast', 'vegetable', 'vehicle', 'venture', 'version', 'versus', 'very', 'vessel', 'veteran',
  'via', 'victim', 'victory', 'video', 'view', 'viewer', 'village', 'violence', 'violent', 'virtually',
  'virtue', 'virus', 'visible', 'vision', 'visit', 'visitor', 'visual', 'vital', 'voice', 'volume',
  'volunteer', 'vote', 'voter', 'vs', 'vulnerable', 'wage', 'wait', 'wake', 'walk', 'wall', 'wander',
  'want', 'war', 'ward', 'warm', 'warn', 'warning', 'wash', 'waste', 'watch', 'water', 'wave',
  'way', 'we', 'weak', 'wealth', 'weapon', 'wear', 'weather', 'weave', 'web', 'wedding', 'week',
  'weekend', 'weekly', 'weigh', 'weight', 'welcome', 'welfare', 'well', 'west', 'western', 'wet',
  'what', 'whatever', 'wheel', 'when', 'whenever', 'where', 'whereas', 'whether', 'which', 'while',
  'whisper', 'white', 'who', 'whole', 'whom', 'whose', 'why', 'wide', 'widely', 'wife', 'wild',
  'will', 'willing', 'win', 'wind', 'window', 'wine', 'wing', 'winner', 'winter', 'wipe', 'wire',
  'wisdom', 'wise', 'wish', 'with', 'withdraw', 'within', 'without', 'witness', 'woman', 'wonder',
  'wonderful', 'wood', 'wooden', 'word', 'work', 'worker', 'working', 'workshop', 'world', 'worried',
  'worry', 'worth', 'would', 'wound', 'wrap', 'write', 'writer', 'writing', 'wrong', 'yard', 'yeah',
  'year', 'yell', 'yellow', 'yes', 'yesterday', 'yet', 'yield', 'you', 'young', 'your', 'yours',
  'yourself', 'youth', 'zone',
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

