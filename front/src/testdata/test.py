import pandas as pd
df = pd.read_csv('./academic_rules.csv')
df.to_json('academic_rules.json', orient='records')