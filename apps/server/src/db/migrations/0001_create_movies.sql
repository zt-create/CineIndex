-- 0001_create_movies.sql
-- Cinelndex 初始表结构：影片类型枚举 + movies 表 + 查询索引。

-- ── 影片类型枚举 ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movie_genre') THEN
    CREATE TYPE movie_genre AS ENUM (
      'action',
      'comedy',
      'drama',
      'documentary',
      'horror',
      'romance',
      'sci-fi',
      'thriller',
      'animation'
    );
  END IF;
END
$$;

-- ── movies ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT         NOT NULL CHECK (length(trim(title)) > 0),
  original_title   TEXT,
  release_year     INTEGER      NOT NULL CHECK (release_year BETWEEN 1888 AND 2200),
  genre            movie_genre  NOT NULL,
  director         TEXT         NOT NULL CHECK (length(trim(director)) > 0),
  rating           NUMERIC(3, 1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  runtime_minutes  INTEGER      CHECK (runtime_minutes IS NULL OR runtime_minutes > 0),
  synopsis         TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE movies IS '影片索引条目';

-- ── 索引 ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS movies_title_idx        ON movies (lower(title));
CREATE INDEX IF NOT EXISTS movies_director_idx     ON movies (lower(director));
CREATE INDEX IF NOT EXISTS movies_genre_idx        ON movies (genre);
CREATE INDEX IF NOT EXISTS movies_release_year_idx ON movies (release_year DESC);
CREATE INDEX IF NOT EXISTS movies_created_at_idx   ON movies (created_at DESC);

-- ── updated_at 自动维护 ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS movies_set_updated_at ON movies;
CREATE TRIGGER movies_set_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
