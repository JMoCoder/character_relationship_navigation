import pandas as pd
import json

df = pd.read_excel(r'd:\Code\GitHub\character_relationship_navigation\奥古斯都人物信息表_完整版.xlsx')

# Get character names (first column except header)
characters = df.iloc[:, 0].dropna().tolist()
print('Characters:', characters)

# Create nodes
nodes = []
for i, char in enumerate(characters):
    node = {
        'id': char,
        'type': 'character',
        'position': {'x': 0, 'y': 0},
        'data': {
            'label': char,
            'role': '',
            'description': ''
        }
    }
    nodes.append(node)

# Create edges from the matrix (only upper triangle to avoid duplicates)
edges = []
edge_id = 0
for i, row_char in enumerate(characters):
    for j, col_char in enumerate(df.columns[1:]):  # Skip first column
        if col_char in characters:
            cell_value = df.iloc[i, j + 1]  # +1 because we skipped first column
            if pd.notna(cell_value) and str(cell_value).strip():
                # Only add if row_char comes before col_char to avoid duplicates
                if characters.index(row_char) < characters.index(col_char):
                    edge = {
                        'id': f'e{edge_id}',
                        'source': row_char,
                        'target': col_char,
                        'label': str(cell_value).strip()
                    }
                    edges.append(edge)
                    edge_id += 1

print(f'\nTotal edges: {len(edges)}')
for e in edges[:10]:
    print(f"  {e['source']} --[{e['label']}]--> {e['target']}")

# Create final JSON
data = {
    'id': 'augustus',
    'title': '奥古斯都',
    'category': '历史小说',
    'description': '以书信体形式展现罗马帝国第一位皇帝奥古斯都的一生',
    'year': '1972',
    'author': '约翰·威廉斯',
    'coverColor': '#8B4513',
    'nodes': nodes,
    'edges': edges
}

with open(r'd:\Code\GitHub\character_relationship_navigation\app\data\books\augustus.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('\nSaved to augustus.json')
