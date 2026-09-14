import json
with open('bd_sgh.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def find_key(d, target):
    if isinstance(d, dict):
        if target in d:
            return d[target]
        for k, v in d.items():
            res = find_key(v, target)
            if res is not None:
                return res
    return None

obj = find_key(data, 'OD12261410')
if obj:
    print(list(obj.keys()))
    if 'personal' in obj:
        print(len(obj['personal']))
        # print first item
        print(obj['personal'][0] if obj['personal'] else 'Empty')
