import dns from 'dns';
import axios from 'axios';
import * as cheerio from 'cheerio';

dns.setDefaultResultOrder('ipv4first');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

async function testSearchEngine() {
  console.log('Testing DuckDuckGo / Bing search...');
  
  try {
    const res = await axios.get('https://html.duckduckgo.com/html/?q=Maracay+gmail.com+contacto', {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://duckduckgo.com/'
      },
      timeout: 10000
    });
    console.log('DDG HTML Status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    const results = $('.result');
    console.log('DDG Results count:', results.length);
    
    const emails = res.data.match(/[a-zA-Z0-9._%+-]+@gmail\.com/gi) || [];
    console.log('Gmails in DDG:', [...new Set(emails)]);
  } catch (err) {
    console.log('DDG Error:', err.message);
  }

  try {
    const res2 = await axios.get('https://www.bing.com/search?q=Maracay+gmail.com+contacto', {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'es-ES,es;q=0.9'
      },
      timeout: 10000
    });
    console.log('Bing Status:', res2.status, 'Length:', res2.data.length);
    const emails2 = res2.data.match(/[a-zA-Z0-9._%+-]+@gmail\.com/gi) || [];
    console.log('Gmails in Bing:', [...new Set(emails2)]);
  } catch (err) {
    console.log('Bing Error:', err.message);
  }
}

testSearchEngine();
