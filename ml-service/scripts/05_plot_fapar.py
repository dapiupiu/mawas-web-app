from pathlib import Path
import matplotlib.pyplot as plt
import rasterio

pairs = [
    ("data/FAPAR/2022/fpanv_m_gdo_20220621_t_300_z01.tif", "21 Jun 2022 (NaN 4.9%)"),
    ("data/FAPAR/2021/fpanv_m_gdo_20210121_t_300_z03.tif", "21 Jan 2021 (NaN 97.6%)"),
]

Path("data/figures").mkdir(parents=True, exist_ok=True)

fig, axes = plt.subplots(1, 2, figsize=(14, 4))

for ax, (path, title) in zip(axes, pairs):
    with rasterio.open(path) as src:
        data = src.read(1)
        left, bottom, right, top = src.bounds
    im = ax.imshow(data, extent=(left, right, bottom, top),
                   cmap="RdYlGn", vmin=-3, vmax=3)
    ax.set_title(title)
    ax.set_xlabel("Bujur")
    ax.set_ylabel("Lintang")
    fig.colorbar(im, ax=ax, shrink=0.8)

fig.tight_layout()
fig.savefig("data/figures/fapar_dua_tanggal.png", dpi=120)
print("Tersimpan di data/figures/fapar_dua_tanggal.png")