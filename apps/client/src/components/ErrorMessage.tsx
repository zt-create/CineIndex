import type { ApiError } from '@cinelndex/shared';

interface ErrorMessageProps {
  error: ApiError;
  onRetry?: () => void;
}

/** 统一的错误展示：错误码 + 消息 + 字段级错误 + 重试按钮。 */
export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message" role="alert">
      <p className="error-message__title">
        <strong>{error.code}</strong> {error.message}
      </p>

      {error.details.length > 0 && (
        <ul className="error-message__details">
          {error.details.map((detail) => (
            <li key={`${detail.field}-${detail.message}`}>
              <code>{detail.field}</code>：{detail.message}
            </li>
          ))}
        </ul>
      )}

      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  );
}
