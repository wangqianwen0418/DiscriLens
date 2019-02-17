# import pandas as pd
# df = pd.read_json('./academic_rules.json')
# df['risk_dif']=df['conf_pd']-df['conf_pnd']
# df = df.sort_values(by=['risk_dif'])
# df.to_json('academic_rules.json', orient='records')




# # add id to samples
import pandas as pd
samples = pd.read_json('./academic_lr_samples.json')
# samples['ID'] = list(range(1000)) + list(range(1000))
# samples.to_json('./academic_lr_samples.json', orient='records')

# add item id to rules
def item_within_rule(item, rule_context):
    for attr_val in rule_context:
        attr, val = attr_val.split('=')
        if not item[attr] == val :
            return False
    return True

rules = pd.read_json('./academic_lr_rules.json')
rules['items'] = ''
for idx, rule in rules.iterrows():
    rules.at[idx, 'items'] = [sample['id'] for i,sample in samples.loc[1000:1999].iterrows() if item_within_rule(sample, rule["antecedent"])] 
rules.to_json('./academic_lr_rules.json', orient='records')