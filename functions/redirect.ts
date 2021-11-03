import { Handler, HandlerEvent } from '@netlify/functions'
import fetch from 'node-fetch';

let examplesCache = new Map();

async function getExamples(ref = "latest") {
  if (examplesCache.has(ref)) {
    return examplesCache.get(ref);
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
  }
  if (typeof process.env.VITE_GITHUB_TOKEN === 'undefined') {
    console.warn(`VITE_GITHUB_TOKEN is undefined. You may run into rate-limiting issues.`);
  } else {
    headers['Authorization'] = `token ${process.env.VITE_GITHUB_TOKEN}`;
  }
  const examples = await fetch(
    `https://api.github.com/repos/snowpackjs/astro/contents/examples?ref=${ref}`,
    {
      headers
    }
  ).then((res) => res.json());

  if (!Array.isArray(examples)) {
    console.log(examples);
    throw new Error(`Unable to fetch templates from GitHub`);
  }

  const values = examples.map(example => (example.size > 0 ? null : ({
    name: example.name,
    github: example.html_url,
    netlify: 'https://astro.build',
    stackblitz: `https://stackblitz.com/github/snowpackjs/astro/tree/${ref}/examples/${example.name}`,
    codesandbox: `https://githubbox.com//snowpackjs/astro/tree/${ref}/examples/${example.name}`,
  }))).filter(x => x);

  examplesCache.set(ref, values);

  return values
}

function isRef(name: string) {
  return name === 'next' || name === 'latest';
}

const PLATFORMS = new Set(['stackblitz', 'codesandbox', 'netlify', 'github']);
function isPlatform(name: string) {
  return PLATFORMS.has(name);
}

function parseReq(event: HandlerEvent) {
  let { path, queryStringParameters: { on: platform = 'stackblitz' } } = event;
  path = path.slice(1);

  if (!isPlatform(platform)) {
    throw new Error(`Unsupported "on" query! Supported platforms are:\n  - ${Array.from(PLATFORMS.values()).map(x => x).join(`\n  - `)}`)
  }

  let value = {
    ref: 'latest',
    template: path,
    platform
  }

  if (path.indexOf('@') > -1) {
    const [template, ref] = path.split('@')
    if (!isRef(ref)) {
      throw new Error(`Invalid version "@${ref}"! Supported versions are "@next" or "@latest".`);
    }
    value.template = template;
    if (ref === 'next') {
      value.ref = 'main';
    } else if (ref === 'latest') {
      value.ref = 'latest';
    }
  }
  
  return value;
}


const handler: Handler = async (event, context) => {
  try {
    const { ref, template, platform } = parseReq(event);
    
    const examples = await getExamples(ref);
    const example = examples.find(x => x.name === template);

    if (!example) {
      return {
        statusCode: 404,
        body: `Unable to find ${template}! Supported templates are:\n  - ${examples.map(x => x.name).join(`\n  - `)}`
      }
    }

    return {
      statusCode: 302,
      headers: {
        Location: example[platform]
      }
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: `${e.message}`
    }
  }
}

export { handler }
