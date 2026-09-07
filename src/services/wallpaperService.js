const axios = require('axios');

// In-memory cache for wallpaper requests (15 min TTL)
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

// Curated list of all main categories from 4kwallpapers.com
const CATEGORIES = [
  { id: 'all', name: 'All Wallpapers', icon: 'sparkles' },
  { id: 'black-dark', name: 'Black & Dark', icon: 'moon' },
  { id: 'space', name: 'Space & Galaxy', icon: 'rocket' },
  { id: 'games', name: 'Gaming', icon: 'gamepad-2' },
  { id: 'anime', name: 'Anime & Manga', icon: 'tv' },
  { id: 'abstract', name: 'Abstract', icon: 'palette' },
  { id: 'cars', name: 'Cars & Supercars', icon: 'car' },
  { id: 'nature', name: 'Nature & Landscapes', icon: 'trees' },
  { id: 'sci-fi', name: 'Sci-Fi & Cyberpunk', icon: 'cpu' },
  { id: 'minimal', name: 'Minimalist', icon: 'minimize-2' },
  { id: 'movies', name: 'Movies & TV', icon: 'film' },
  { id: 'animals', name: 'Animals & Wildlife', icon: 'cat' },
  { id: 'architecture', name: 'Architecture', icon: 'building' },
  { id: 'bikes', name: 'Bikes & Motorcycles', icon: 'bike' },
  { id: 'celebrations', name: 'Celebrations', icon: 'party-popper' },
  { id: 'cute', name: 'Cute & Kawaii', icon: 'heart' },
  { id: 'fantasy', name: 'Fantasy', icon: 'wand-2' },
  { id: 'flowers', name: 'Flowers', icon: 'flower' },
  { id: 'food', name: 'Food & Drink', icon: 'utensils' },
  { id: 'gradients', name: 'Gradients', icon: 'droplet' },
  { id: 'graphics-cgi', name: 'CGI & 3D Render', icon: 'box' },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'compass' },
  { id: 'love', name: 'Love & Romance', icon: 'heart-handshake' },
  { id: 'military', name: 'Military', icon: 'shield' },
  { id: 'music', name: 'Music', icon: 'music' },
  { id: 'people', name: 'People', icon: 'users' },
  { id: 'photography', name: 'Photography', icon: 'camera' },
  { id: 'quotes', name: 'Quotes & Typography', icon: 'quote' },
  { id: 'sports', name: 'Sports', icon: 'activity' },
  { id: 'technology', name: 'Technology', icon: 'laptop' },
  { id: 'world', name: 'World & Travel', icon: 'globe' },
  { id: 'aesthetic-wallpapers', name: 'Aesthetic', icon: 'sun' },
  { id: 'most-popular-4k-wallpapers', name: 'Most Popular', icon: 'flame' },
  { id: 'best-4k-wallpapers', name: 'Featured & Best', icon: 'star' },
  { id: 'random-wallpapers', name: 'Random', icon: 'shuffle' },
  { id: 'pitch-black-wallpapers', name: 'Pitch Black OLED', icon: 'circle-dot' }
];

// High quality fallback wallpapers in case 4kwallpapers.com is temporarily blocked or slow
const FALLBACK_WALLPAPERS = [
  {
    id: 'fb-1',
    title: 'Neon Cyberpunk City Night',
    keywords: 'Cyberpunk, Neon, City, Sci-Fi',
    thumb: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80',
    preview: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    full4k: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=3840&q=85',
    category: 'sci-fi'
  },
  {
    id: 'fb-2',
    title: 'Minimal Purple Deep Space Nebula',
    keywords: 'Space, Nebula, Stars, Galaxy',
    thumb: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80',
    preview: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    full4k: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=3840&q=85',
    category: 'space'
  },
  {
    id: 'fb-3',
    title: 'Dark Abstract Fluid Waves',
    keywords: 'Abstract, Fluid, Dark, 3D',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    full4k: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=3840&q=85',
    category: 'black-dark'
  },
  {
    id: 'fb-4',
    title: 'Misty Pine Forest & Mountains',
    keywords: 'Nature, Mountains, Forest, Fog',
    thumb: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=400&q=80',
    preview: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
    full4k: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=3840&q=85',
    category: 'nature'
  },
  {
    id: 'fb-5',
    title: 'Retro Synthwave Grid Sun',
    keywords: 'Synthwave, Retro, Grid, Neon',
    thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    preview: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    full4k: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=3840&q=85',
    category: 'games'
  }
];

class WallpaperService {
  getCategories() {
    return CATEGORIES;
  }

  async getWallpapers({ category = 'all', page = 1, query = '' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const cleanQuery = (query || '').trim();
    const cacheKey = `${category}_${pageNum}_${cleanQuery.toLowerCase()}`;

    // Check memory cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      let targetUrl = 'https://4kwallpapers.com/';

      if (cleanQuery) {
        targetUrl = `https://4kwallpapers.com/search/?q=${encodeURIComponent(cleanQuery)}`;
        if (pageNum > 1) {
          targetUrl += `&page=${pageNum}`;
        }
      } else if (category && category !== 'all') {
        const slug = category.replace(/^\/+|\/+$/g, '');
        targetUrl = `https://4kwallpapers.com/${slug}/`;
        if (pageNum > 1) {
          targetUrl += `?page=${pageNum}`;
        }
      } else {
        if (pageNum > 1) {
          targetUrl = `https://4kwallpapers.com/?page=${pageNum}`;
        }
      }

      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000
      });

      const html = response.data;
      const wallpapers = this.parseWallpapers(html);
      const pagination = this.parsePagination(html, pageNum);

      const result = {
        success: true,
        category,
        page: pageNum,
        totalPages: pagination.totalPages,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev,
        totalItems: wallpapers.length,
        wallpapers: wallpapers.length > 0 ? wallpapers : (pageNum === 1 ? FALLBACK_WALLPAPERS : []),
        categories: CATEGORIES
      };

      // Store in cache
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      return result;
    } catch (err) {
      console.warn('Failed to fetch from 4kwallpapers.com, using fallback:', err.message);

      // Return fallback result gracefully
      return {
        success: true,
        category,
        page: pageNum,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        totalItems: FALLBACK_WALLPAPERS.length,
        wallpapers: FALLBACK_WALLPAPERS,
        categories: CATEGORIES,
        isFallback: true
      };
    }
  }

  parseWallpapers(html) {
    const list = [];
    const itemRegex = /<p[^>]*class=["']wallpapers__item["'][^>]*>([\s\S]*?)<\/p>/gi;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
      const itemHtml = match[1];

      // Extract URL & title & id
      const aMatch = itemHtml.match(/<a[^>]+href=["']https:\/\/4kwallpapers\.com\/([^\/]+)\/([a-z0-9\-]+)-(\d+)\.html["'][^>]*title=["']([^"']*)["']/i) ||
                     itemHtml.match(/<a[^>]+title=["']([^"']*)["'][^>]+href=["']https:\/\/4kwallpapers\.com\/([^\/]+)\/([a-z0-9\-]+)-(\d+)\.html["']/i);

      let catSlug = '';
      let slug = '';
      let id = '';
      let title = '';

      if (aMatch) {
        if (/^\d+$/.test(aMatch[3])) {
          catSlug = aMatch[1];
          slug = aMatch[2];
          id = aMatch[3];
          title = aMatch[4] || '';
        } else {
          title = aMatch[1];
          catSlug = aMatch[2];
          slug = aMatch[3];
          id = aMatch[4];
        }
      } else {
        // Fallback match for URL
        const simpleHref = itemHtml.match(/href=["']https:\/\/4kwallpapers\.com\/([^\/]+)\/([a-z0-9\-]+)-(\d+)\.html["']/i);
        if (simpleHref) {
          catSlug = simpleHref[1];
          slug = simpleHref[2];
          id = simpleHref[3];
        }
        const titleMatch = itemHtml.match(/title=["']([^"']*)["']/i);
        if (titleMatch) title = titleMatch[1];
      }

      // Extract keywords
      let keywords = '';
      const kwMatch = itemHtml.match(/<meta[^>]+itemprop=["']keywords["'][^>]+content=["']([^"']*)["']/i);
      if (kwMatch) keywords = kwMatch[1];

      if (!title) {
        const altMatch = itemHtml.match(/alt=["']([^"']*)["']/i);
        if (altMatch) title = altMatch[1];
      }

      // Clean up title
      title = (title || '4K Wallpaper').replace(/\s*Wallpaper$/i, '').trim();

      if (id) {
        const thumb = `https://4kwallpapers.com/images/walls/thumbs/${id}.jpg`;
        const preview = `https://4kwallpapers.com/images/walls/thumbs_2t/${id}.jpg`;
        const full4k = slug ? `https://4kwallpapers.com/images/wallpapers/${slug}-3840x2160-${id}.jpg` : preview;

        list.push({
          id,
          title,
          slug,
          category: catSlug,
          keywords,
          thumb,
          preview,
          full4k,
          pageUrl: `https://4kwallpapers.com/${catSlug}/${slug}-${id}.html`
        });
      }
    }

    return list;
  }

  parsePagination(html, currentPage) {
    let totalPages = currentPage;

    // Check for pagination numbers
    const pageLinks = [...html.matchAll(/href=["']\?page=(\d+)["']/gi)];
    for (const p of pageLinks) {
      const num = parseInt(p[1], 10);
      if (num > totalPages) {
        totalPages = num;
      }
    }

    const hasNext = html.includes('class="ctrl-right"') || totalPages > currentPage;
    const hasPrev = currentPage > 1;

    return {
      currentPage,
      totalPages: Math.max(totalPages, currentPage),
      hasNext,
      hasPrev
    };
  }
}

module.exports = new WallpaperService();

