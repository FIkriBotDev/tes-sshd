import pandas as pd
import statsmodels.api as sm

# Load dataset
raw_data = pd.read_csv('https://storage.googleapis.com/dqlab-dataset/dataset_statistic.csv', sep=';')

print(raw_data)

# Variabel tak bebas (y)
nilai_Y = raw_data[['Total']]

# Variabel bebas (x)
nilai_X = sm.add_constant(raw_data[['Pendapatan']])
