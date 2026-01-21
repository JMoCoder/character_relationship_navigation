import pandas as pd

# 读取Excel
df = pd.read_excel(r'd:\Code\GitHub\character_relationship_navigation\奥古斯都人物信息表_完整版.xlsx')

print("列名:")
for col in df.columns:
    print(f"  - {col}")

print(f"\n总行数: {len(df)}")

# 查看前5行的关系数据
print("\n前5行的关系数据:")
for i in range(min(5, len(df))):
    print(f"\n=== 第{i+1}行 ===")
    row = df.iloc[i]
    print(f"人物姓名: {row['人物姓名']}")
    print(f"中文译名: {row['中文译名']}")
    print(f"与奥古斯都关系: {row['与奥古斯都关系']}")
    print(f"与其他人物的重要关系: {row['与其他人物的重要关系']} ")
