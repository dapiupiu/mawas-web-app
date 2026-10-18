\# Tabel training Mawas (`data/training/tabel\_training.parquet`)



Satu baris = satu kabupaten pada satu dekad (tanggal = awal dekad).

`data/` tidak masuk Git. Buat ulang dengan menjalankan, dari folder `ml-service`:



&#x20;   python scripts/24\_zonal\_all.py          # FAPAR per kabupaten per dekad (membaca .tif)

&#x20;   python scripts/27\_zonal\_final.py        # coba all\_touched + status ketersediaan

&#x20;   python scripts/30\_join\_fapar\_hujan.py   # join FAPAR + curah hujan

&#x20;   python scripts/32\_build\_training\_table.py   # lag, target, penanda kualitas



Prasyarat: kabupaten\_clean.geojson, rainfall\_kabupaten.parquet (skrip 10-18), dan 206 file FAPAR.



\## Ukuran

93.936 baris = 456 kabupaten x 206 dekad (2021-01-01 s.d. 2026-09-11).

Baris berlabel (`punya\_target`): 87.049. Baris `target\_andal`: 75.669.



\## Kolom

\- Kunci: `KDPKAB` (teks "NN.NN"), `tanggal`.

\- Fitur (17): `fapar\_mean`, `fapar\_lag1..3`, `rfh`, `rfh\_lag1..3`, `rfq`, `rfq\_lag1..3`,

&#x20; `r1h`, `r3h`, `r1q`, `r3q`, `bulan`.

\- Target: `target\_fapar\_t3` = `fapar\_mean` 3 dekad (\~30 hari) setelah baris ini.

\- Penanda: `punya\_target`, `target\_andal`.

\- Meta (BUKAN fitur): `status\_fapar`, `metode\_mask`, `n\_piksel`, `n\_valid`, `frac\_valid`,

&#x20; `frac\_valid\_t3`, `version\_hujan`, `anomaly\_status`.



\## Aturan pemakaian

1\. Fitur di baris t hanya berisi data sampai t. Lag memakai shift positif per kabupaten.

&#x20;  Dua jalur hitung (shift dan merge tanggal) sudah dicocokkan untuk target dan semua lag.

2\. `frac\_valid\_t3` memuat informasi dari t+3. Hanya untuk menyaring baris latih/uji,

&#x20;  TIDAK BOLEH menjadi fitur.

3\. Latih dan evaluasi hanya pada baris `target\_andal == True`.

4\. Validasi dengan split berdasarkan waktu, bukan acak.

5\. Baris tanpa target (3 dekad terakhir) sengaja dipertahankan untuk prakiraan sungguhan.

6\. `rfh\_avg`, `r1h\_avg`, `r3h\_avg` tidak dipakai (rata-rata jangka panjang, baseline belum

&#x20;  terverifikasi, informasinya sudah ada di `rfq`).



\## Keterbatasan

\- Satuan FAPAR anomaly belum terverifikasi dari dokumentasi HDX. \[NEEDS VERIFICATION]

\- Tersaring dari 514 kabupaten: 7 tanpa poligon, 39 tanpa data CHIRPS (di tabel FAPAR saja),

&#x20; 12 dengan FAPAR `tidak\_tersedia` (NaN di >= 100 dari 206 dekad; daftar di

&#x20; `data/fapar\_zonal/fapar\_status\_kabupaten.csv`).

\- Kota kecil memakai all\_touched: nilai FAPAR mewakili area di sekitar kota, bukan kotanya.

\- Rata-rata kabupaten dari sedikit piksel valid mudah ekstrem (awan). Target dengan

&#x20; `frac\_valid\_t3 < 0.2` ditandai tidak andal. Satu nilai ekstrem (-10,39) masih lolos aturan ini.

\- Baris `prelim` curah hujan (2026-09-01 dan 2026-09-11) tidak punya target. ID9109 (Mimika)

&#x20; anomali hujannya `estimated`.

\- Nilai kuantitatif akurasi nanti hanya berlaku pada baris dengan target andal.

