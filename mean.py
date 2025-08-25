import numpy as np
import pandas as pd
raw_data = pd.read_csv("https://uploader.exoduscloud.my.id/tmp/dataset_statistic.csv", sep=';')
print(raw_data)
# mengambil hanya data untuk produk 'A'
produk_A = raw_data[raw_data['Produk'] == 'A']
 
# menghitung rerata pendapatan menggunakan method .mean pada objek pandas DataFrame
print (produk_A['Pendapatan'].mean())

# menghitung rerata pendapatan menggunakan method .mean pada objek pandas DataFrame dengan numpy
'''print (np.mean(produk_A['Pendapatan']))'''

produk_D = raw_data[raw_data['Produk'] == 'D']
print('Rata-rata Pendapatan Produk D:',produk_D['Pendapatan'].mean())
print('Pendapatan Tertinggi Produk D:',produk_D['Pendapatan'].max())
print('Pendapatan Terendah Produk D:',produk_D['Pendapatan'].min())
print('Describe Produk D:',produk_D['Pendapatan'].describe())
