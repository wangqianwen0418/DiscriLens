from model.data_encoder import DataEncoder

from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import accuracy_score

from xgboost import XGBClassifier


# xgb = XGBClassifier(
#                 max_depth=10, 
#                 learning_rate=0.1, 
#                 n_estimators=200,seed=10
#             )

xgb = XGBClassifier(
    eta=0.1, 
    gamma=4, 
    max_depth=6, 
    tree_method="exact"
)
knn = KNeighborsClassifier(
        algorithm='brute', leaf_size=17, n_neighbors=16, weights='distance'
        )
lr = LogisticRegression(solver='sag', penalty='l2', C= 0.5)
svm = SVC(kernel='linear', gamma='scale')

rf = RandomForestClassifier(
    bootstrap=True, 
    criterion='gini', 
    max_depth=10, 
    max_features=5, 
    min_samples_split=9, 
    n_estimators=50
    )

dt = DecisionTreeClassifier(criterion= 'entropy', max_depth= 5, min_samples_split= 2)

class ModelGene(object):   
    def __init__(self, model_name='knn'):
        self.models = {
            # the credit model is based on https://www.openml.org/t/31 
            "credit_rf": RandomForestClassifier(
                bootstrap=True, 
                class_weight=None, 
                criterion='entropy', 
                max_depth=10, 
                max_features=0.45, 
                max_leaf_nodes=None, 
                min_impurity_decrease=1e-07, 
                min_samples_leaf=6, 
                min_samples_split=7, 
                min_weight_fraction_leaf=0.0, 
                n_estimators=512, 
                n_jobs=1, 
                oob_score=False, 
                random_state=3, 
                verbose=0, 
                warm_start=False
            ),
            "credit_knn":knn,
            "credit_xgb": xgb,
            "credit_lr": lr,

            # the academic model is based https://www.kaggle.com/harunshimanto/student-s-academic-performance-with-ml-eda
            "academic_xgb": xgb,
            "academic_lr": lr,
            "academic_knn": knn,
            "academic_rf": rf,
            "academic_svm": svm,
            "academic_dt": dt,
            
            "adult_knn": knn,
            "adult_xgb": xgb,
            "adult_lr": lr,
            "adult_rf": rf,
            "adult_svm": svm,
            "adult_dt": dt,

            "german_credit_xgb": xgb,
            "german_credit_knn":  knn,
            "german_credit_lr": lr,

            "bank_knn": knn,
            "bank_xgb": xgb,
            "bank_lr": lr,
            

        }
        self.model = self.models[model_name]

    def fit_model(self, data):
        '''
        Args:
            data(panda DataFrame): training dataset

        Return:
            model: an already trained sklearn model
            score(list<number>): cross validate score
        '''
        
        encoder = DataEncoder()
        encoder.fit(data)
        x, y = encoder.transform(data)

        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=0)

        model = self.model
        model.fit(x, y)
        # model.fit(x_train, y_train)
        # score = accuracy_score(y_test, model.predict(x_test))
        score_cross = cross_val_score(model, x, y, scoring='accuracy', cv=5) 
        score_cross = sum(score_cross)/len(score_cross)
        return model, encoder, score_cross
   
