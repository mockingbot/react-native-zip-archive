#!/usr/bin/env node
/**
 * Create (or reuse) an Announcements discussion for a minor, then link it
 * from the listed GitHub Releases. Idempotent.
 *
 * Usage:
 *   node .github/scripts/upsert-minor-discussion.js [vX.Y.md ...]
 * Env: GITHUB_TOKEN, GITHUB_REPOSITORY (owner/repo)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const repoFull = process.env.GITHUB_REPOSITORY;
if (!token || !repoFull) {
  console.error('GITHUB_TOKEN and GITHUB_REPOSITORY are required');
  process.exit(1);
}
const [owner, repo] = repoFull.split('/');
const api = 'https://api.github.com';

async function gh(method, urlPath, body) {
  const res = await fetch(`${api}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rnza-minor-discussion',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`${method} ${urlPath} ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json;
}

async function graphql(query, variables) {
  const json = await gh('POST', '/graphql', { query, variables });
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

function parseAnnouncement(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  if (!titleMatch) {
    throw new Error(`${filePath} needs an H1 title`);
  }
  const releasesMatch = raw.match(/<!--\s*releases:\s*(.+?)\s*-->/);
  const releases = releasesMatch
    ? releasesMatch[1].trim().split(/\s+/).filter(Boolean)
    : [];
  const body = raw.replace(/^#\s+.+\n/, '').replace(/<!--\s*releases:[\s\S]*?-->\n?/, '').trim();
  return { title: titleMatch[1].trim(), body, releases, filePath };
}

function announcementFilesFromArgs() {
  const args = process.argv.slice(2);
  if (args.length) {
    return args;
  }
  const dir = path.join(process.cwd(), '.github/announcements');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

async function closeProbeIssue() {
  try {
    await gh('PATCH', `/repos/${owner}/${repo}/issues/387`, {
      state: 'closed',
      state_reason: 'not_planned',
    });
    console.log('Closed probe issue #387');
  } catch (e) {
    if (e.status === 404) {
      return;
    }
    console.log(`Could not close #387 (${e.message})`);
  }
}

async function upsert(file) {
  const parsed = parseAnnouncement(file);
  const prefix = parsed.title.split(':')[0].trim(); // "9.5"

  const repoData = await graphql(
    `
      query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
          discussionCategories(first: 20) {
            nodes {
              id
              name
            }
          }
          discussions(first: 50) {
            nodes {
              id
              number
              title
              url
            }
          }
        }
      }
    `,
    { owner, name: repo }
  );

  const category = repoData.repository.discussionCategories.nodes.find(
    (c) => c.name === 'Announcements'
  );
  if (!category) {
    throw new Error('Announcements discussion category not found');
  }

  const existing = repoData.repository.discussions.nodes.find(
    (d) => d.title === parsed.title || d.title.startsWith(`${prefix}:`)
  );

  let discussion = existing;
  if (!discussion) {
    const created = await graphql(
      `
        mutation ($repo: ID!, $category: ID!, $title: String!, $body: String!) {
          createDiscussion(
            input: {
              repositoryId: $repo
              categoryId: $category
              title: $title
              body: $body
            }
          ) {
            discussion {
              id
              number
              title
              url
            }
          }
        }
      `,
      {
        repo: repoData.repository.id,
        category: category.id,
        title: parsed.title,
        body: parsed.body,
      }
    );
    discussion = created.createDiscussion.discussion;
    console.log(`Created discussion ${discussion.url}`);
  } else {
    console.log(`Reusing discussion ${discussion.url}`);
  }

  const linkLine = `**Discussion:** [${discussion.title}](${discussion.url})`;
  for (const tag of parsed.releases) {
    let release;
    try {
      release = await gh('GET', `/repos/${owner}/${repo}/releases/tags/${tag}`);
    } catch (e) {
      console.log(`Skip missing release ${tag}: ${e.message}`);
      continue;
    }
    const body = release.body || '';
    if (body.includes(discussion.url)) {
      console.log(`${tag} already links the discussion`);
      continue;
    }
    const next = `${linkLine}\n\n${body}`.trim() + '\n';
    await gh('PATCH', `/repos/${owner}/${repo}/releases/${release.id}`, {
      body: next,
    });
    console.log(`Linked discussion from ${tag}`);
  }

  return discussion;
}

async function main() {
  const files = announcementFilesFromArgs();
  if (!files.length) {
    console.log('No announcement files');
    return;
  }
  for (const file of files) {
    await upsert(file);
  }
  await closeProbeIssue();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
