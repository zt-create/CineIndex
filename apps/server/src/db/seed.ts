/**
 * 演示数据：`pnpm db:seed`
 *
 * 幂等：以 (title, release_year) 是否已存在作为判据，重复执行不会产生重复行。
 */

import type { CreateMovieInput } from '@cinelndex/shared';
import { logger } from '../config/logger.js';
import { closePool, query } from './pool.js';

const SAMPLE_MOVIES: CreateMovieInput[] = [
  {
    title: '银翼杀手 2049',
    originalTitle: 'Blade Runner 2049',
    releaseYear: 2017,
    genre: 'sci-fi',
    director: '丹尼斯·维伦纽瓦',
    rating: 8.0,
    runtimeMinutes: 164,
    synopsis: '新一代银翼杀手 K 追查一桩尘封三十年的秘密，最终指向自己的身份。',
  },
  {
    title: '花样年华',
    originalTitle: 'In the Mood for Love',
    releaseYear: 2000,
    genre: 'romance',
    director: '王家卫',
    rating: 8.1,
    runtimeMinutes: 98,
    synopsis: '1960 年代的香港，两个被配偶背叛的邻居在克制中生出情愫。',
  },
  {
    title: '寄生虫',
    originalTitle: '기생충',
    releaseYear: 2019,
    genre: 'thriller',
    director: '奉俊昊',
    rating: 8.5,
    runtimeMinutes: 132,
    synopsis: '住在半地下室的一家人逐步渗透进富豪宅邸，阶层的气味无法掩盖。',
  },
  {
    title: '星际穿越',
    originalTitle: 'Interstellar',
    releaseYear: 2014,
    genre: 'sci-fi',
    director: '克里斯托弗·诺兰',
    rating: 8.7,
    runtimeMinutes: 169,
    synopsis: '地球濒临枯竭，一支探险队穿过虫洞为人类寻找新的家园。',
  },
  {
    title: '千与千寻',
    originalTitle: '千と千尋の神隠し',
    releaseYear: 2001,
    genre: 'animation',
    director: '宫崎骏',
    rating: 9.4,
    runtimeMinutes: 125,
    synopsis: '少女千寻误入神灵世界，为救回父母在汤屋中工作并找回自己的名字。',
  },
  {
    title: '教父',
    originalTitle: 'The Godfather',
    releaseYear: 1972,
    genre: 'drama',
    director: '弗朗西斯·福特·科波拉',
    rating: 9.2,
    runtimeMinutes: 175,
    synopsis: '柯里昂家族的权力交接，以及一个不愿接班的小儿子如何成为新的教父。',
  },
  {
    title: '疯狂的麦克斯：狂暴之路',
    originalTitle: 'Mad Max: Fury Road',
    releaseYear: 2015,
    genre: 'action',
    director: '乔治·米勒',
    rating: 8.1,
    runtimeMinutes: 120,
    synopsis: '末世荒漠中，一场几乎不停歇的追逐与逃亡。',
  },
  {
    title: '大佛普拉斯',
    originalTitle: null,
    releaseYear: 2017,
    genre: 'comedy',
    director: '黄信尧',
    rating: 8.6,
    runtimeMinutes: 102,
    synopsis: '两名看门人在行车记录仪里窥见老板的秘密，黑色幽默由此展开。',
  },
];

async function seed(): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (const movie of SAMPLE_MOVIES) {
    const { rowCount } = await query(
      'SELECT 1 FROM movies WHERE title = $1 AND release_year = $2',
      [movie.title, movie.releaseYear],
    );

    if ((rowCount ?? 0) > 0) {
      skipped += 1;
      continue;
    }

    await query(
      `INSERT INTO movies
         (title, original_title, release_year, genre, director, rating, runtime_minutes, synopsis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        movie.title,
        movie.originalTitle ?? null,
        movie.releaseYear,
        movie.genre,
        movie.director,
        movie.rating ?? null,
        movie.runtimeMinutes ?? null,
        movie.synopsis ?? null,
      ],
    );
    inserted += 1;
  }

  logger.info(`演示数据写入完成：新增 ${inserted} 条，跳过 ${skipped} 条`);
}

seed()
  .catch((error: unknown) => {
    logger.error('演示数据写入失败', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closePool();
  });
