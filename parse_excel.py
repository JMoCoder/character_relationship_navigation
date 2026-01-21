import pandas as pd
import json
import re

# 读取Excel  
df = pd.read_excel(r'd:\Code\GitHub\character_relationship_navigation\奥古斯都人物信息表_完整版.xlsx')

# 创建角色名到ID的映射
name_to_id = {}
nodes = []

# 第一遍：创建所有nodes和name映射
for idx, row in df.iterrows():
    char_name = str(row['人物姓名']) if pd.notna(row['人物姓名']) else ''
    cn_name = str(row['中文译名']) if pd.notna(row['中文译名']) else char_name
    role_info = str(row['身份/职位']) if pd.notna(row['身份/职位']) else ''
    char_type = str(row['人物类别']) if pd.notna(row['人物类别']) else ''
    
    # 生成ID
    if '奥古斯都' in cn_name or 'Augustus' in char_name or '屋大维' in cn_name:
        char_id = 'augustus'
    else:
        char_id = char_name.lower().replace(' ', '-').replace('.', '').replace("'", '').replace(',', '')
        if not char_id or char_id == 'nan':
            char_id = f"char-{idx}"
    
    # 存储名称映射（用于后续关系匹配）
    if cn_name and cn_name != 'nan':
        name_to_id[cn_name] = char_id
    if char_name and char_name != 'nan':
        name_to_id[char_name] = char_id
    
    # 创建node
    node = {
        "id": char_id,
        "type": "character",
        "position": {"x": 0, "y": 0},
        "data": {
            "label": cn_name if cn_name and cn_name != 'nan' else char_name,
            "role": role_info[:40] if role_info and role_info != 'nan' else char_type,
            "description": f"{row['与奥古斯都关系']}" if pd.notna(row['与奥古斯都关系']) and str(row['与奥古斯都关系']) != 'nan' else ""
        }
    }
    nodes.append(node)

# 第二遍：创建edges
edges = []
edge_set = set()  # 避免重复边

for idx, row in df.iterrows():
    char_name = str(row['人物姓名']) if pd.notna(row['人物姓名']) else ''
    cn_name = str(row['中文译名']) if pd.notna(row['中文译名']) else char_name
    
    # 获取当前人物ID
    current_id = name_to_id.get(cn_name) or name_to_id.get(char_name)
    if not current_id:
        continue
    
    # 1. 处理与奥古斯都的关系
    relation_augustus = str(row['与奥古斯都关系']) if pd.notna(row['与奥古斯都关系']) else ''
    if relation_augustus and relation_augustus != 'nan' and current_id != 'augustus':
        edge_key = tuple(sorted(['augustus', current_id]))
        if edge_key not in edge_set:
            edge_set.add(edge_key)
            edges.append({
                "id": f"e-augustus-{current_id}",
                "source": "augustus",
                "target": current_id,
                "label": relation_augustus[:20]
            })
    
    # 2. 处理与其他人物的关系
    other_relations = str(row['与其他人物的重要关系']) if pd.notna(row['与其他人物的重要关系']) else ''
    if other_relations and other_relations != 'nan':
        # 尝试解析关系描述（例如："李维娅之子"、"阿格里帕之女"等）
        # 这里用简单的规则：如果包含其他人名，就创建连接
        for other_name, other_id in name_to_id.items():
            if other_id != current_id and other_name in other_relations and len(other_name) > 1:
                edge_key = tuple(sorted([current_id, other_id]))
                if edge_key not in edge_set:
                    edge_set.add(edge_key)
                    # 提取关系描述
                    relation_label = other_relations[:20]
                    edges.append({
                        "id": f"e-{current_id}-{other_id}",
                        "source": current_id,
                        "target": other_id,
                        "label": relation_label
                    })

# 创建书籍数据
book_data = {
    "id": "augustus",
    "title": "奥古斯都",
    "category": "历史小说",
    "description": "以书信体形式展现罗马帝国第一位皇帝奥古斯都的一生，通过多个人物视角勾勒出复杂的政治权谋与人性。",
    "year": "1972",
    "author": "约翰·威廉斯",
    "coverColor": "#8B4513",
    "nodes": nodes,
    "edges": edges
}

# 保存为JSON
output_path = r'd:\Code\GitHub\character_relationship_navigation\app\data\books\augustus.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(book_data, f, ensure_ascii=False, indent=2)

print(f"✅ 成功创建文件: {output_path}")
print(f"📊 人物总数: {len(nodes)}")
print(f"🔗 关系总数: {len(edges)}")
print(f"\n✨ 关系类型：")
print(f"  - 与奥古斯都的关系: {sum(1 for e in edges if e['source'] == 'augustus' or e['target'] == 'augustus')}")
print(f"  - 其他人物间关系: {len(edges) - sum(1 for e in edges if e['source'] == 'augustus' or e['target'] == 'augustus')}")
