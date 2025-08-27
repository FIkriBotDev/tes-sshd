import pandas as pd
import matplotlib.pyplot as plt
raw_data = pd.read_csv("https://storage.googleapis.com/dqlab-dataset/dataset_statistic.csv", sep=';')
plt.clf()

print('\n\nData:\n\n',raw_data)
print('\n\nPendapatan\nPendapatan: \n',raw_data['Pendapatan'])
print('Pendapatan Minimal: ',raw_data['Pendapatan'].min())
print('Pendapatan Maximal: ',raw_data['Pendapatan'].max(),)
print('Rata-rata Pendapatan: ',raw_data['Pendapatan'].mean())
print('\n\nTingkat Kepuasan\nTingkat Kepuasan Terkecil: ',raw_data['Tingkat Kepuasan'].min())
print('Tingkat Kepuasan Tertinggi: ',raw_data['Tingkat Kepuasan'].max())
print('Rata-rata Tingkat Kepuasan: ',raw_data['Tingkat Kepuasan'].mean())

plt.figure()
# melihat distribusi data kolom 'Pendapatan' menggunakan 'hist' dari pandas
raw_data.hist(column='Pendapatan')
plt.title('Data Pendapatan', size=14)
plt.tight_layout()
plt.show()

plt.figure()
raw_data.hist(column='Tingkat Kepuasan')
plt.title('Data Tingkat Kepuasan Pelanggan', size=14)
plt.tight_layout()
plt.show()

plt.figure()
# melihat distribusi data kolom 'Pendapatan' menggunakan '.hist' dari matplotlib.pyplot
plt.hist(x='Pendapatan', data=raw_data)
plt.xlabel('Pendapatan')
plt.title('.hist dari matplotlib.pyplot', size=14)
plt.tight_layout()
plt.show()

plt.figure()
plt.hist(x='Tingkat Kepuasan', data=raw_data)
plt.xlabel('Tingkat Kepuasan')
plt.title('Data Tingkat Kepuasan Pelanggan', size=14)
plt.tight_layout()
plt.show()
