import axios from 'axios';

const TARGET_URL = 'https://chiikawamarket.jp/en/products/4571609374060';
import { JSDOM } from "jsdom";
async function fetchHtml(url){
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrawlerBot/1.0)' },
      timeout: 20000
    });
    return res.data;
  } catch(err){
    console.error('Error fetching page:', err.message || err);
    return null;
  }
}
const html = await fetchHtml(TARGET_URL);
const dom = new JSDOM(html);
const document = dom.window.document;

const imageList = document.querySelector("ul.thumbnail-list").querySelectorAll("li")
for (let i = 0; i < imageList.length; i++){
    console.log("https:" + imageList[i].querySelector("img").src.split('?')[0])
}
