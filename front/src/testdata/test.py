import pandas as pd
df = pd.read_json('./academic_rules.json')
df['risk_dif']=df['conf_pd']-df['conf_pnd']
df = df.sort_values(by=['risk_dif'])
df.to_json('academic_rules.json', orient='records')