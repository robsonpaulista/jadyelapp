"use server";

import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
  image?: string;
}

const GOOGLE_FEED = 'https://www.google.com/alerts/feeds/17804356194972672813/1216134778087352017';
const TALKWALKER_FEED = 'https://alerts.talkwalker.com/alerts/rss/Z37HR5MYXHKNAIZQGSL3EJC4Z4QSWM3HO65FE4YJKEPWJ4RZGZ5TXLUZFQ6GGRZTK5TDIY7Y4CPR667I3LHBFMGJHNF2YIZF6TWIZHW4SJUAMYHDGR4RRK4S4OOHSTH2';

const parser = new Parser({
  customFields: {
    item: [['media:content', 'media']]
  }
});

async function fetchFeed(url: string, source: string, cidade: string): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items
      .filter(item => {
        const title = item.title?.toLowerCase() || '';
        const description = item.contentSnippet?.toLowerCase() || '';
        return title.includes(cidade.toLowerCase()) || description.includes(cidade.toLowerCase());
      })
      .map(item => ({
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate,
        source,
        image: (item as any).media?.$.url
      }));
  } catch (error) {
    console.error(`Erro ao buscar feed de ${source}:`, error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cidade = searchParams.get('cidade');

    if (!cidade) {
      return NextResponse.json({ error: 'Cidade não especificada' }, { status: 400 });
    }

    const [googleNews, talkwalkerNews] = await Promise.all([
      fetchFeed(GOOGLE_FEED, 'Google Alertas', cidade),
      fetchFeed(TALKWALKER_FEED, 'Talkwalker Alerts', cidade)
    ]);

    const allNews = [...googleNews, ...talkwalkerNews]
      .sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dateB - dateA;
      });

    return NextResponse.json(allNews);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return NextResponse.json({ error: 'Erro ao buscar notícias' }, { status: 500 });
  }
} 