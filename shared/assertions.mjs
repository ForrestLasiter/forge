/**
 * assertions.mjs — how React exercises are graded.
 *
 * Shared between two callers on purpose:
 *   - src/components/ReactPreview.jsx  (the live preview inside the app)
 *   - scripts/verify-lessons.js        (the headless test run, via jsdom)
 * One implementation means the tests grade exactly what the app grades.
 *
 * The functions here operate on a real mounted DOM node. They click real
 * buttons and type into real inputs, so a component that "looks right" but is
 * not actually wired up still fails — which is the point.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Typing into a React-controlled input is not as simple as setting .value.
 * React attaches its own value setter to the element, and assigning through it
 * does not trigger the internal change tracking. So we call the NATIVE setter
 * from the prototype, then dispatch a real 'input' event — which is what React
 * actually listens for behind its onChange prop.
 */
function setNativeValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function text(container) {
  return (container.textContent || '').replace(/\s+/g, ' ').trim();
}

function describe(a) {
  switch (a.type) {
    case 'textIncludes': return `the output should contain "${a.value}"`;
    case 'textNotIncludes': return `the output should NOT contain "${a.value}"`;
    case 'exists': return `there should be a <${a.selector}> element`;
    case 'count': return `there should be exactly ${a.value} "${a.selector}" element(s)`;
    case 'attr': return `"${a.selector}" should have ${a.name}="${a.value}"`;
    case 'click': return `after clicking "${a.selector}"${a.times > 1 ? ` ${a.times} times` : ''}, the output should contain "${a.then}"`;
    case 'type': return `after typing "${a.text}" into "${a.selector}", the output should contain "${a.then}"`;
    case 'codeIncludes': return `your code should use \`${a.value}\``;
    case 'wait': return `waiting ${a.ms}ms`;
    default: return a.type;
  }
}

/**
 * Run every assertion in order against the mounted component.
 * Order matters: a `click` assertion changes the DOM that later assertions see,
 * which is how a three-step interaction is expressed as a flat list.
 *
 * Returns { pass, message, failedAt }.
 */
export async function runAssertions(container, assertions, code = '') {
  for (let i = 0; i < assertions.length; i++) {
    const a = assertions[i];
    const fail = (extra) => ({
      pass: false,
      failedAt: i,
      message: `Check ${i + 1} failed — ${describe(a)}.${extra ? ' ' + extra : ''}`,
    });

    switch (a.type) {
      case 'wait':
        await sleep(a.ms || 50);
        break;

      case 'codeIncludes':
        if (!code.includes(a.value)) return fail();
        break;

      case 'textIncludes':
        if (!text(container).includes(a.value)) return fail(`Got: "${text(container).slice(0, 160)}"`);
        break;

      case 'textNotIncludes':
        if (text(container).includes(a.value)) return fail(`Got: "${text(container).slice(0, 160)}"`);
        break;

      case 'exists':
        if (!container.querySelector(a.selector)) return fail();
        break;

      case 'count': {
        const n = container.querySelectorAll(a.selector).length;
        if (n !== a.value) return fail(`Found ${n}.`);
        break;
      }

      case 'attr': {
        const el = container.querySelector(a.selector);
        if (!el) return fail('That element does not exist.');
        if (el.getAttribute(a.name) !== a.value) return fail(`Got ${a.name}="${el.getAttribute(a.name)}".`);
        break;
      }

      case 'click': {
        const el = container.querySelector(a.selector);
        if (!el) return fail('That element does not exist.');
        const times = a.times || 1;
        for (let t = 0; t < times; t++) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          await sleep(0);
        }
        await sleep(20);
        if (a.then && !text(container).includes(a.then)) return fail(`Got: "${text(container).slice(0, 160)}"`);
        break;
      }

      case 'type': {
        const el = container.querySelector(a.selector);
        if (!el) return fail('That element does not exist.');
        setNativeValue(el, a.text);
        await sleep(20);
        if (a.then && !text(container).includes(a.then)) return fail(`Got: "${text(container).slice(0, 160)}"`);
        break;
      }

      default:
        return { pass: false, failedAt: i, message: `Unknown assertion type "${a.type}"` };
    }
  }

  return { pass: true, message: 'All checks passed.' };
}

export { setNativeValue, text as renderedText };
