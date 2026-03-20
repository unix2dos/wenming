export const BACK_LABEL = '返回上一层';

export function createRouteBackTarget(href) {
  return {
    kind: 'route',
    href,
    label: BACK_LABEL,
  };
}

export function createHandlerBackTarget(onBack) {
  return {
    kind: 'handler',
    onBack,
    label: BACK_LABEL,
  };
}

export function resolveBackTarget({
  page,
  state,
  hasCompareContext = false,
  onBack,
} = {}) {
  const homeTarget = createRouteBackTarget('#/');
  const collectionTarget = createRouteBackTarget('#/collection');

  switch (page) {
    case 'score':
    case 'generate':
      return state === 'result'
        ? createHandlerBackTarget(onBack)
        : homeTarget;
    case 'collection':
      return state === 'compare'
        ? createHandlerBackTarget(onBack)
        : homeTarget;
    case 'test':
      return state === 'result'
        ? createHandlerBackTarget(onBack)
        : homeTarget;
    case 'share':
      return homeTarget;
    case 'compare-report':
      return hasCompareContext ? collectionTarget : homeTarget;
    default:
      return homeTarget;
  }
}

export function renderBackAction(target, options = {}) {
  const className = options.className || 'back-action';
  const icon = options.icon || 'arrow-left';
  const iconHtml = `<i data-lucide="${icon}" style="width:1.2em; height:1.2em;"></i>`;

  if (target.kind === 'route') {
    return `<a href="${target.href}" class="${className}">${iconHtml}${target.label}</a>`;
  }

  const id = options.id || '';
  return `<button type="button" id="${id}" class="${className}">${iconHtml}${target.label}</button>`;
}
