from model.data_encoder import DataEncoder

from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression

from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import accuracy_score

from xgboost import XGBClassifier


xgb = XGBClassifier(
                max_depth=10, 
                learning_rate=0.1, 
                n_estimators=100,seed=10
            )
knn = KNeighborsClassifier(
                algorithm = "ball_tree",
                leaf_size = 40,
                metric = "manhattan",
                n_neighbors = 17
            )
lr = LogisticRegression(C=1.0, class_weight=None, dual=False, fit_intercept=True,
                intercept_scaling=1, max_iter=100, multi_class='ovr', n_jobs=1,
                penalty='l2', random_state=None, solver='liblinear', tol=0.0001,
                verbose=0, warm_start=False
            )
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
            
            "adult_knn": knn,
            "adult_xgb": xgb,
            "adult_lr": lr,

            "give_credit_xgb": xgb,
            "give_credit_knn":  knn,
            "give_credit_lr": lr,

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
        model.fit(x_train, y_train)
        score = accuracy_score(y_test, model.predict(x_test))
        # score = cross_val_score(model, x_train, y_train, scoring='accuracy', cv=4) 
        return model, encoder, score
   
