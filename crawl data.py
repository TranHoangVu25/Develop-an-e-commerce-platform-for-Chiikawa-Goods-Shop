import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import time
import csv

BASE_URL = "https://chiikawamarket.jp"
COLLECTION_PATH = "/en/collections/interior"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def extract_product_links_from_page(html, base=BASE_URL):
    soup = BeautifulSoup(html, "html.parser")
    links = set()
    # Tìm tất cả <a href="..."> rồi chọn href chứa '/products/'
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        # Thường product path trên site này chứa '/products/' hoặc '/en/products/'
        if re.search(r"/products/", href):
            full = urljoin(base, href)
            links.add(full)
    return links

def scrape_all_product_links(max_pages=200, sleep_sec=1.0):
    page = 1
    all_links = set()
    while page <= max_pages:
        if page == 1:
            url = urljoin(BASE_URL, COLLECTION_PATH)
        else:
            url = f"{urljoin(BASE_URL, COLLECTION_PATH)}?page={page}"
        print(f"[+] Lấy trang {page}: {url}")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                print(f"    ! Lỗi HTTP {resp.status_code}, dừng.")
                break
        except Exception as e:
            print(f"    ! Exception khi request: {e}, dừng.")
            break

        links_on_page = extract_product_links_from_page(resp.text)
        new_links = links_on_page - all_links
        print(f"    → tìm được {len(links_on_page)} link (mới: {len(new_links)}) trên trang này")

        if not new_links:
            # Nếu trang không có link mới (có thể hết trang), dừng
            print("    → Không tìm thấy link mới, dừng phân trang.")
            break

        all_links.update(new_links)
        page += 1
        time.sleep(sleep_sec)  # lịch sự: delay giữa các request

    return sorted(all_links)

def save_links_to_csv(links, filename="product_links.csv"):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["product_url"])
        for l in links:
            writer.writerow([l])
    print(f"[+] Đã lưu {len(links)} link vào {filename}")

if __name__ == "__main__":
    links = scrape_all_product_links(max_pages=100, sleep_sec=1.0)
    print(f"\nTổng link thu được: {len(links)} (hiển thị 10 đầu):")
    for l in links[:10]:
        print(" -", l)
    save_links_to_csv(links)
