function formatRetryAfter(seconds) {
  if (!seconds || Number.isNaN(seconds)) {
    return '稍后';
  }

  if (seconds < 60) {
    return `${seconds} 秒后`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} 分钟后`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} 小时后`;
}

export function formatApiErrorMessage(error, actionLabel = '操作') {
  if (error?.status === 429) {
    if (error.limitType === 'quota' && error.message) {
      return error.message;
    }

    return `请求太快了，请在 ${formatRetryAfter(error.retryAfter)}再试。`;
  }

  if (actionLabel === '起名') {
    return '起名过程遇到阻碍，请检查 API 配置或稍后重试。';
  }

  if (actionLabel === '打分') {
    return '打分失败，请稍后重试或检查配置。';
  }

  return `${actionLabel}失败，请稍后重试。`;
}
