import { useState, type FormEvent } from 'react';
import { MOVIE_GENRES, type CreateMovieInput, type MovieGenre } from '@cinelndex/shared';

interface MovieFormProps {
  /** 编辑时传入初始值；新建时省略。 */
  initialValue?: Partial<CreateMovieInput>;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (input: CreateMovieInput) => void | Promise<void>;
}

/** 表单内部状态：数字字段用字符串保存，否则空输入框无法表达「未填写」。 */
interface FormState {
  title: string;
  originalTitle: string;
  releaseYear: string;
  genre: MovieGenre;
  director: string;
  rating: string;
  runtimeMinutes: string;
  synopsis: string;
}

function toFormState(initial?: Partial<CreateMovieInput>): FormState {
  return {
    title: initial?.title ?? '',
    originalTitle: initial?.originalTitle ?? '',
    releaseYear: String(initial?.releaseYear ?? new Date().getFullYear()),
    genre: initial?.genre ?? 'drama',
    director: initial?.director ?? '',
    rating: initial?.rating === null || initial?.rating === undefined ? '' : String(initial.rating),
    runtimeMinutes:
      initial?.runtimeMinutes === null || initial?.runtimeMinutes === undefined
        ? ''
        : String(initial.runtimeMinutes),
    synopsis: initial?.synopsis ?? '',
  };
}

/** 空字符串 → null，否则转数字。后端 schema 会做最终校验，这里只保证类型正确。 */
function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 影片表单：新建页与编辑页共用。
 * 校验交给后端（zod schema），这里的 required 属性只是为了少一次无效往返。
 */
export function MovieForm({ initialValue, submitLabel, loading = false, onSubmit }: MovieFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialValue));

  const update = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const input: CreateMovieInput = {
      title: form.title.trim(),
      originalTitle: form.originalTitle.trim() === '' ? null : form.originalTitle.trim(),
      releaseYear: Number(form.releaseYear),
      genre: form.genre,
      director: form.director.trim(),
      rating: toNullableNumber(form.rating),
      runtimeMinutes: toNullableNumber(form.runtimeMinutes),
      synopsis: form.synopsis.trim() === '' ? null : form.synopsis.trim(),
    };

    void onSubmit(input);
  };

  return (
    <form className="movie-form" onSubmit={handleSubmit}>
      <label>
        <span>片名 *</span>
        <input
          required
          maxLength={200}
          value={form.title}
          onChange={(event) => update('title', event.target.value)}
        />
      </label>

      <label>
        <span>原名</span>
        <input
          maxLength={200}
          value={form.originalTitle}
          onChange={(event) => update('originalTitle', event.target.value)}
        />
      </label>

      <div className="movie-form__row">
        <label>
          <span>上映年份 *</span>
          <input
            required
            type="number"
            min={1888}
            max={new Date().getFullYear() + 5}
            value={form.releaseYear}
            onChange={(event) => update('releaseYear', event.target.value)}
          />
        </label>

        <label>
          <span>类型 *</span>
          <select
            value={form.genre}
            onChange={(event) => update('genre', event.target.value as MovieGenre)}
          >
            {MOVIE_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>导演 *</span>
        <input
          required
          maxLength={120}
          value={form.director}
          onChange={(event) => update('director', event.target.value)}
        />
      </label>

      <div className="movie-form__row">
        <label>
          <span>评分（0 ~ 10）</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={form.rating}
            onChange={(event) => update('rating', event.target.value)}
          />
        </label>

        <label>
          <span>时长（分钟）</span>
          <input
            type="number"
            min={1}
            max={1200}
            value={form.runtimeMinutes}
            onChange={(event) => update('runtimeMinutes', event.target.value)}
          />
        </label>
      </div>

      <label>
        <span>剧情简介</span>
        <textarea
          rows={5}
          maxLength={4000}
          value={form.synopsis}
          onChange={(event) => update('synopsis', event.target.value)}
        />
      </label>

      <button type="submit" className="button button--primary" disabled={loading}>
        {loading ? '提交中…' : submitLabel}
      </button>
    </form>
  );
}
