// scrape_many_products.js
import axios from "axios";
import fs from "fs";
import { JSDOM } from "jsdom";

// Đọc file chứa danh sách link (mỗi link 1 dòng)
const content = fs.readFileSync("product_links_PlushMascot.csv", "utf8");
const lines = content.split("\n");

// Hàm tải HTML
async function fetchHtml(url) {
  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CrawlerBot/1.0)" },
      timeout: 20000,
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching page:", err.message || err);
    return null;
  }
}

const products = []

// Duyệt từng dòng (từng link)
for (let i = 0; i < 201; i++) {
  const TARGET_URL = lines[i].trim();
  if (!TARGET_URL || TARGET_URL.startsWith("#")) continue; // bỏ dòng trống hoặc comment

  console.log(`\Đang xử lý link ${i + 1}: ${TARGET_URL}`);

  const html = await fetchHtml(TARGET_URL);
  if (!html) {
    console.log("Bỏ qua vì không tải được trang.");
    continue;
  }

  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Lấy danh sách ảnh
  const imageListHtml = document.querySelector("ul.thumbnail-list")?.querySelectorAll("li") || [];
  const categoryListHtml = document.querySelector("ul.tag_list")?.querySelectorAll("li") || [];
  const images = [];
  const characters = [];

  for (let j = 0; j < imageListHtml.length; j++) {
    const img = imageListHtml[j].querySelector("img");
    if (img && img.src) {
      const src = img.src.split("?")[0];
      images.push(src.startsWith("http") ? src : "https:" + src);
    }
  }

  for (let j = 0; j < categoryListHtml.length; j++) {
  const a = categoryListHtml[j].querySelector("a");
  if (a) {
    const name = a.innerHTML.trim();
    const slug = name.toLowerCase().replace(/\s+/g, "-"); // tạo slug đơn giản
    characters.push({ name, slug });
    }
  }

  const variants = [];
  const variantsListHtml = document.querySelector("div.colorProductsGroup")?.querySelectorAll("div.colorProductsGroup__item") || [];
  for (let j = 0; j < variantsListHtml.length;j++){
    const varID = variantsListHtml[j].querySelector("a").href.split("/")[variantsListHtml[j].querySelector("a").href.split("/").length - 1];
    const varIMG = "https:" +  variantsListHtml[j].querySelector("img").src.split("?")[0]
    const varName = variantsListHtml[j].querySelector("div.caption")?.innerHTML || "";
    variants.push({
      id: varID,
      name: varName,
      img: varIMG
    })
  }
  // console.log(variantsListHtml.length)

  const id = document.querySelector("div.product__jan").querySelector("span")?.innerHTML || "";
  const priceText = document.querySelector("span.price-item")?.innerHTML || "";
  const price = Number(priceText.split("<")[0].split("¥")[1]?.replace(/,/g, "") || 0);
  const name = document.querySelector("div.product__title h1")?.innerHTML || "";
  const description = document.querySelector("div.product__description")?.textContent.trim() || "";
  const vendor = document.querySelector("div.product__vendor")?.innerHTML || "";
  const status_item = document.querySelector("div.product-form__buttons").querySelector("button.product-form__submit").querySelector("span").innerHTML || "";  
  // console.log(status_item.length);
  let status = ""
  if (status_item.length == 12){
    status = "available"
    // console.log(status)
  }
  else{
    status = "sold_out"
    // console.log(status)
  }

  const product = {
    // url: TARGET_URL,
    id,
    variants,
    price,
    name,
    description,
    status,
    images,
    categories: [
      {
        "name": "Plush/Mascot",
        "slug": "nuigurumi-mascot"
      }
    ],
    characters,
    vendor,
  };

  products.push(product)
  const jsonContent = JSON.stringify(products, null, 2);

// Ghi ra file JSON
  fs.writeFileSync("products.json", jsonContent, "utf8");

  console.log("Đã xuất file products.json");
}
