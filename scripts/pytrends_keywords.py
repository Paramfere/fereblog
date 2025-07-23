import json
import time
from pytrends.request import TrendReq

# Broader seed keywords to avoid 400 errors
SEED_KEYWORDS = [
    'cryptocurrency',
    'crypto trading',
    'blockchain',
    'DeFi',
    'trading bots',
    'AI trading',
    'bitcoin',
    'ethereum',
]

# Helper to try fallback keywords
FALLBACKS = {
    'AI crypto trading': 'crypto trading',
    'AI DeFi tools': 'DeFi',
    'on-chain AI signals': 'blockchain',
    'crypto trading bots': 'trading bots',
    'AI trading for Solana': 'AI trading',
    'AI trading for Base chain': 'AI trading',
    'AI crypto research': 'cryptocurrency',
}

pytrends = TrendReq(hl='en-US', tz=360)

all_keywords = []

for kw in SEED_KEYWORDS:
    for timeframe in ['today 3-m', 'today 6-m']:
        try:
            pytrends.build_payload([kw], cat=0, timeframe=timeframe)
            related = pytrends.related_queries()
            rising = related.get(kw, {}).get('rising')
            if rising is not None:
                for row in rising.to_dict('records'):
                    q = row['query']
                    if len(q.split()) >= 3:
                        all_keywords.append({'query': q, 'source': 'rising'})
            # Ethical delay
            time.sleep(2)
        except Exception as e:
            print(f'Error for {kw} ({timeframe}):', e)
            # Try fallback if available
            fallback = FALLBACKS.get(kw)
            if fallback:
                try:
                    pytrends.build_payload([fallback], cat=0, timeframe=timeframe)
                    related = pytrends.related_queries()
                    rising = related.get(fallback, {}).get('rising')
                    if rising is not None:
                        for row in rising.to_dict('records'):
                            q = row['query']
                            if len(q.split()) >= 3:
                                all_keywords.append({'query': q, 'source': 'rising'})
                    time.sleep(2)
                except Exception as e2:
                    print(f'Fallback error for {fallback} ({timeframe}):', e2)

# Deduplicate by query
seen = set()
unique_keywords = []
for item in all_keywords:
    if item['query'] not in seen:
        unique_keywords.append(item)
        seen.add(item['query'])

with open('data/pytrends-keywords.json', 'w') as f:
    json.dump(unique_keywords, f, indent=2)

print(f"Saved {len(unique_keywords)} trending keywords to data/pytrends-keywords.json") 