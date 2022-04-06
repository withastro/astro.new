import toTitle from "title";

const TITLES = new Map([
  ["with-tailwindcss", "Tailwind CSS"],
  ["blog-multiple-authors", "Blog (Complex)"],
  ["with-markdown-plugins", "Markdown (Remark Plugins)"],
  ["framework-multiple", "Kitchen Sink (Multiple Frameworks)"],
]);
const FEATURED_TEMPLATES = new Set(["starter", "minimal"]);
const FEATURED_INTEGRATIONS = new Set(["tailwindcss"]);
const FRAMEWORK_ORDER = ["react", "preact", "vue", "svelte", "lit", "solid"].map(name => `framework-${name}`);

interface ExampleData {
  name: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
}
export interface Example {
  name: string;
  title: string;
  sourceUrl: string;
  stackblitzUrl: string;
  codesandboxUrl: string;
  gitpodUrl: string;
}

function toExample({ name }: ExampleData, ref: string): Example {
  const suffix = ref === 'main' ? '@next' : '';
  let title: string;
  if (TITLES.has(name)) {
    title = TITLES.get(name);
  } else {
    title = toTitle(name.replace(/^(with|framework)/, "").replace(/-/g, " ")).trim();
  }
  return {
    name,
    sourceUrl: `/${name}${suffix}?on=github`,
    stackblitzUrl: `/${name}${suffix}?on=stackblitz`,
    codesandboxUrl: `/${name}${suffix}?on=codesandbox`,
    gitpodUrl: `/${name}${suffix}?on=gitpod`,
    title,
  };
}

function groupExamplesByCategory(
  examples: ExampleData[],
  ref: string
): [string, Example[]][] {
  const groups: Record<string, Example[]> = {
    Templates: [],
    Frameworks: [],
    Integrations: [],
  };
  for (const example of examples) {
    if (example.size !== 0) continue;
    const data = toExample(example, ref);
    switch (true) {
      case example.name.startsWith("with-"):
        if (FEATURED_INTEGRATIONS.has(example.name.replace('with-', ''))) {
          groups["Integrations"].splice(0, 0, data);
        } else {
          groups["Integrations"].push(data);
        }
        break;
      case example.name.startsWith("framework-"):
        groups["Frameworks"].push(data);
        break;
      default: {
        if (FEATURED_TEMPLATES.has(example.name)) {
          groups["Templates"].splice(0, 0, data);
        } else {
          groups["Templates"].push(data);
        }
        break;
      }
    }
  }
  groups["Frameworks"] = groups["Frameworks"].sort((a, b) => {
    let aIndex = FRAMEWORK_ORDER.indexOf(a.name);
    let bIndex = FRAMEWORK_ORDER.indexOf(b.name);
    if (aIndex === -1) {
      aIndex = Infinity;
    }
    if (bIndex === -1) {
      bIndex = Infinity;
    }
    if (aIndex > bIndex) return 1;
    if (aIndex < bIndex) return -1;
  })
  return Object.entries(groups);
}

export async function getExamples(ref = "latest") {
  const headers = {
    Accept: "application/vnd.github.v3+json",
  }
  if (typeof import.meta.env.PUBLIC_VITE_GITHUB_TOKEN === 'undefined') {
    console.warn(`PUBLIC_VITE_GITHUB_TOKEN is undefined. You may run into rate-limiting issues.`);
  } else {
    headers['Authorization'] = `token ${import.meta.env.PUBLIC_VITE_GITHUB_TOKEN}`;
  }
  const examples = await fetch(
    `https://api.github.com/repos/withastro/astro/contents/examples?ref=${ref}`,
    {
      headers
    }
  ).then((res) => res.json());
  if (!Array.isArray(examples)) {
    console.log(examples);
    throw new Error(`GITHUB_TOKEN appears to be misconfigured`);
  }
  return groupExamplesByCategory(examples, ref);
}
