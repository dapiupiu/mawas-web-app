import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from pathlib import Path
import numpy as np
from scripts.fapar_utils import baca_fapar, bersihkan_fapar

folder = Path("data/FAPAR")
files = sorted(folder.rglob("*.tif"))
print("Jumlah file:", len(files))

file_bergaya_nol = 0
total_nol = 0

for f in files:
    arr = baca_fapar(f)
    nol_sebelum = int((arr == 0).sum())
    nan_sebelum = int(np.isnan(arr).sum())

    bersih = bersihkan_fapar(arr)

    # cek 1: tidak ada nilai 0 tersisa
    assert (bersih == 0).sum() == 0, f"Masih ada 0 di {f.name}"
    # cek 2: NaN baru = NaN lama + 0 yang diubah
    assert np.isnan(bersih).sum() == nan_sebelum + nol_sebelum, (
        f"Hitungan tidak cocok di {f.name}"
    )
    # cek 3: array asli tidak berubah
    assert (arr == 0).sum() == nol_sebelum, f"Array asli berubah di {f.name}"

    if nol_sebelum > 0:
        file_bergaya_nol += 1
        total_nol += nol_sebelum

print("File bergaya-0:", file_bergaya_nol)
print("Total piksel 0 diubah jadi NaN:", total_nol)
print("Semua cek lolos.")
