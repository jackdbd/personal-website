---
date: "2017-08-20T09:02:03.284Z"
tags:
  - machine learning
  - pandas
  - Python
  - scikit-learn
title: sklearn-pandas
---

[sklearn-pandas](https://github.com/pandas-dev/sklearn-pandas) is a small library that provides a bridge between [scikit-learn](https://github.com/scikit-learn/scikit-learn)'s machine learning methods and pandas Data Frames.

In this blog post I will show you a simple example on how to use sklearn-pandas in a classification problem. I will use the Titanic dataset from Kaggle. You can find training set e test set [here](https://www.kaggle.com/c/titanic/data).

## Imports

```python
import os
import pandas as pd
from sklearn.preprocessing import LabelBinarizer, Imputer, LabelEncoder, \
    FunctionTransformer, Binarizer, StandardScaler, MultiLabelBinarizer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score
from sklearn_pandas import DataFrameMapper, CategoricalImputer


here = os.path.abspath(os.path.dirname(__file__))
```

## Data

Kaggle provides separate files for training set e test set: `trains.csv` contains class labels (0 = dead; 1 = survived), while `test.csv` does not.

If you want you can perform some basic EDA (Exploratory Data Analysis). Be careful of [data leakege](https://www.quora.com/Whats-data-leakage-in-data-science) though! Don't use test data to carry on EDA, otherwise you will be tempted to select some features or perform some operations based on what you see on the test data. Here I will concatenate training set and test set just to see the total number of samples and the missing values of the entire dataset. I will "touch" the test set only at the end, for prediction.

```python
data_directory = os.path.abspath(os.path.join(here, 'data', 'titanic'))
train_csv = os.path.join(data_directory, 'train.csv')
test_csv = os.path.join(data_directory, 'test.csv')

df_train = pd.read_csv(train_csv, header=0, index_col='PassengerId')
df_test = pd.read_csv(test_csv, header=0, index_col='PassengerId')
df = pd.concat([df_train, df_test], keys=['train', 'test'])

print('--- Info ---')
print(df.info())
print('--- Describe ---')
print(df.describe())
print('--- Features ---')
for feature in set(df_train.columns.values).difference(set(['Name'])):
    print(feature)
    print(df[feature].value_counts(dropna=False))
    print('-' * 40)
```

## Features

When working on a machine learning problem, feature engineering is manually [designing what the input x's should be](https://www.quora.com/What-is-feature-engineering/answer/Tomasz-Malisiewicz?srid=tdBp).

With sklearn-pandas you can use the `DataFrameMapper` class to declare transformations and variable imputations.

`default=False` means that only the variables specified in the `DataFrameMapper` will be kept. All other variables will be discarded.

`None` means that no transformation will be applied to that variable.

`LabelBinarizer` converts a categorical variable into a _dummy variable_ (aka _binary variable_). A dummy variable is either 1 or 0, whether a condition is met or not (in pandas categorical variables can be converted into dummy variables with the method [get_dummies](https://pandas.pydata.org/pandas-docs/stable/generated/pandas.get_dummies.html)).

`Imputer` is a scikit-learn class that can perform NA imputation for quantitative variables, while `CategoricalImputer` is a sklearn-pandas class that works on categorical variables too. [Missing value imputation](<https://en.wikipedia.org/wiki/Imputation_(statistics)>) is a broad topic, and in other languages there are entire packages dedicated to it. For example, in R you can find [MICE](https://www.r-bloggers.com/imputing-missing-data-with-r-mice-package/) and [Amelia](https://github.com/IQSS/Amelia).

In a `DataFrameMapper` you can also provide a custom name for the transformed features – to be used instead of the automatically generated one – by specifying it as the third argument of the feature definition.

The difference between specifying the column selector as `'column'` (as a simple string) and `['column']` (as a list with one element is the shape of the array that is passed to the transformer. In the first case, a one dimensional array will be passed, while in the second case it will be a 2-dimensional array with one column, i.e. a column vector.

_Example:_ with a simple string `Imputer()` will discard `NaN` values for the column `Age`, and the fitting process will fail because of a mismatch of the size of this array and the other arrays in the `DataFrame`.

```python
mapper = DataFrameMapper([
    ('Pclass', None),
    ('Sex', LabelBinarizer()),
    (['Age'], [Imputer()]),
    ('SibSp', None, {'alias': 'Some variable'}),
    (['Ticket'], [LabelBinarizer()]),
    (['Fare'], Imputer()),
    ('Embarked', [CategoricalImputer(), MultiLabelBinarizer()]),
    ], default=False)
```

Once again, here is how to use `DataMapper`:

```python
mapper = DataFrameMapper([
    (['Age'], [Imputer()]),  # OK
    ('Age', [Imputer()]),  # NO!
])
```

## Pipeline

Now that the you defined the features you want to use, you can build a scikit-learn `Pipeline`. The first step of the Pipeline is the `mapper` you have just defined. The last step is a scikit-learn `Estimator` that will run the classification. In this case I chose a `RandomForestClassifier` with a basic configuration. Between these two steps you can define additional ones. For example, you might want to [z-normalize](https://en.wikipedia.org/wiki/Standard_score) your features with a `StandardScaler`.

```python
pipeline = Pipeline([
    ('feature_mapper', mapper),
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier(n_estimators=50, random_state=seed))
])
```

## Cross validation

The pipeline is ready, so you can train your model. In order to provide several estimates of the model's accuracy you can use cross validation. scikit-learn provides the convenient function `cross_val_score` to do that, but you can also do it manually. Keep in mind that we are not touching the test set here: `xx_train` and `xx_test` are both part of the entire training set. We just split the entire training set to train it on `xx_train` and predict on `xx_test`.

```python
x_train = df_train[df_train.columns.drop(['Survived'])]
y_train = df_train['Survived']

# one way of computing cross-validated accuracy estimates
skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=seed)
scores = cross_val_score(pipeline, x_train, y_train, cv=skf)
print('Accuracy estimates: {}'.format(scores))

# another way of computing cross-validated accuracy estimates
for i_split, (ii_train, ii_test) in enumerate(skf.split(X=x_train, y=y_train)):
    # x_train (independent variables, aka features) is a pandas DataFrame.
    # xx_train and xx_test are pandas dataframes
    xx_train = x_train.iloc[ii_train, :]
    xx_test = x_train.iloc[ii_test, :]
    # y_train (target variable) is a pandas Series.
    # yy_train and yy_test are numpy arrays
    yy_train = y_train.values[ii_train]
    yy_test = y_train.values[ii_test]

    model = pipeline.fit(X=xx_train, y=yy_train)
    predictions = model.predict(xx_test)
    score = accuracy_score(y_true=yy_test, y_pred=predictions)
    print('Accuracy of split num {}: {}'.format(i_split, score))

# final model (retrain it on the entire train set)
model = pipeline.fit(X=x_train, y=y_train)
```

## Predict

Now that the model is trained we can finally predict data that we have never seen before (i.e. the test set).

```python
# In this problem df_test doesn't contain the target variable 'Survived'
x_test = df_test
predictions = model.predict(x_test)
print('Predictions (0 = dead, 1 = survived)')
print(predictions)
```

## The entire script

Here is the entire script:

```python
import os
import pandas as pd
from sklearn.preprocessing import LabelBinarizer, Imputer, LabelEncoder, \
    FunctionTransformer, Binarizer, StandardScaler, MultiLabelBinarizer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score
from sklearn_pandas import DataFrameMapper, CategoricalImputer


here = os.path.abspath(os.path.dirname(__file__))


def main(seed=42):
    data_directory = os.path.abspath(os.path.join(here, 'data', 'titanic'))
    train_csv = os.path.join(data_directory, 'train.csv')
    test_csv = os.path.join(data_directory, 'test.csv')

    df_train = pd.read_csv(train_csv, header=0, index_col='PassengerId')
    df_test = pd.read_csv(test_csv, header=0, index_col='PassengerId')
    df = pd.concat([df_train, df_test], keys=['train', 'test'])

    print('--- Info ---')
    print(df.info())
    print('--- Describe ---')
    print(df.describe())
    print('--- Features ---')
    for feature in set(df_train.columns.values).difference(set(['Name'])):
        print(feature)
        print(df[feature].value_counts(dropna=False))
        print('-' * 40)

    mapper = DataFrameMapper([
        ('Pclass', None),
        ('Sex', LabelBinarizer()),
        (['Age'], [Imputer()]),
        ('SibSp', None, {'alias': 'Some variable'}),
        (['Ticket'], [LabelBinarizer()]),
        (['Fare'], Imputer()),
        ('Embarked', [CategoricalImputer(), MultiLabelBinarizer()]),
        ], default=False)

    pipeline = Pipeline([
        ('feature_mapper', mapper),
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=seed))
    ])

    x_train = df_train[df_train.columns.drop(['Survived'])]
    y_train = df_train['Survived']

    # one way of computing cross-validated accuracy estimates
    skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=seed)
    scores = cross_val_score(pipeline, x_train, y_train, cv=skf)
    print('Accuracy estimates: {}'.format(scores))

    # another way of computing cross-validated accuracy estimates
    for i_split, (ii_train, ii_test) in enumerate(skf.split(X=x_train, y=y_train)):
        # x_train (independent variables, aka features) is a pandas DataFrame.
        # xx_train and xx_test are pandas dataframes
        xx_train = x_train.iloc[ii_train, :]
        xx_test = x_train.iloc[ii_test, :]
        # y_train (target variable) is a pandas Series.
        # yy_train and yy_test are numpy arrays
        yy_train = y_train.values[ii_train]
        yy_test = y_train.values[ii_test]

        model = pipeline.fit(X=xx_train, y=yy_train)
        predictions = model.predict(xx_test)
        score = accuracy_score(y_true=yy_test, y_pred=predictions)
        print('Accuracy of split num {}: {}'.format(i_split, score))

    # final model (retrain it on the entire train set)
    model = pipeline.fit(X=x_train, y=y_train)

    # In this problem df_test doesn't contain the target variable 'Survived'
    x_test = df_test
    predictions = model.predict(x_test)
    print('Predictions (0 = dead, 1 = survived)')
    print(predictions)

if __name__ == '__main__':
    main()
```

If you run it, you should get these results with `seed=42`:

```shell
Accuracy estimates: [ 0.7979798   0.83501684  0.81144781]
Accuracy of split num 0: 0.797979797979798
Accuracy of split num 1: 0.835016835016835
Accuracy of split num 2: 0.8114478114478114
Predictions (0 = dead, 1 = survived)
[0 0 0 0 0 0 0 0 1 0 0 0 1 0 1 1 0 0 0 1 1 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 0
 0 0 1 0 0 0 1 1 0 0 0 1 1 0 0 1 1 0 0 0 0 0 1 0 0 0 1 1 1 1 0 0 1 1 0 0 0
 1 0 0 1 0 1 0 0 0 0 0 0 1 0 1 1 0 0 1 0 0 0 1 0 0 0 1 0 0 0 1 0 0 0 0 0 0
 1 1 0 1 0 0 1 1 1 1 0 1 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0
 0 0 1 0 0 1 0 0 1 0 0 0 1 1 1 0 0 1 0 0 1 0 0 0 0 0 0 1 1 1 1 1 0 1 1 0 1
 0 1 0 0 0 0 0 0 0 1 0 1 0 0 0 1 1 0 1 0 0 0 0 1 0 0 0 0 1 0 0 1 0 1 0 1 0
 1 0 1 1 0 1 0 0 0 1 0 0 1 0 0 0 1 1 1 1 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 1
 0 0 0 1 1 0 0 0 0 0 0 0 0 1 1 0 1 0 0 0 0 0 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0
 1 0 0 0 0 0 0 0 1 1 1 1 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 1 0 1 0 0 0 1 0 0
 1 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 1 1 0 0 0 1 0 1 0 0 0 0 1 1 0 1 0 0 0 1 0
 0 1 0 0 1 1 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 1 0 1 0 0 1 0 1 0 0 0 0
 0 1 1 1 1 0 0 1 0 0 0]
```
