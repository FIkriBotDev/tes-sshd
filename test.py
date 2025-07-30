data_siswa = [
    {'nama':'Andi','kelas':'XII IPA 1','nilai_ipa':80},
    {'nama':'Budi','kelas':'XII IPA 1','nilai_ipa':70},
    {'nama':'Candra','kelas':'XII IPA 1','nilai_ipa':86},
    {'nama':'Dani','kelas':'XII IPA 1','nilai_ipa':85},
    {'nama':'Edwin','kelas':'XII IPA 1','nilai_ipa':89},
    {'nama':'Fikri','kelas':'XII IPA 1','nilai_ipa':91},
    {'nama':'Gani','kelas':'XII IPA 1','nilai_ipa':78},
    {'nama':'Hanhan','kelas':'XII IPA 1','nilai_ipa':98}
]

total_siswa_lulus = 0

for siswa in data_siswa:
    nilai_ipa = siswa['nilai_ipa']
    if nilai_ipa > 75:
        print(f'Nama: {siswa['nama']} - Kelas: {siswa['kelas']} - Nilai IPA: {siswa['nilai_ipa']} - Status: Lulus')
        total_siswa_lulus += 1
    else:
        print(f'Nama: {siswa['nama']} - Kelas: {siswa['kelas']} - Nilai IPA: {siswa['nilai_ipa']} - Status: Tidak Lulus')

print(f'\nTotal siswa yang lulus: {total_siswa_lulus}')
