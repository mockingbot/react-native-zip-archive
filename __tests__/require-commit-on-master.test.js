const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const script = path.join(__dirname, '..', 'scripts', 'require-commit-on-master.sh');

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function initRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'require-on-master-'));
  git(cwd, ['init', '-b', 'master']);
  git(cwd, ['config', 'user.email', 'test@example.com']);
  git(cwd, ['config', 'user.name', 'test']);
  fs.writeFileSync(path.join(cwd, 'package.json'), '{"version":"1.0.0"}\n');
  git(cwd, ['add', 'package.json']);
  git(cwd, ['commit', '-m', 'init']);
  return cwd;
}

function run(cwd) {
  try {
    return execFileSync('bash', [script], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, MASTER_REF: 'master' },
    });
  } catch (error) {
    const output = `${error.stdout || ''}\n${error.stderr || ''}`;
    error.message = `${error.message}\n${output}`;
    throw error;
  }
}

describe('require-commit-on-master', () => {
  test('accepts a commit that is already on master', () => {
    const cwd = initRepo();
    const output = run(cwd);
    expect(output).toMatch(/is on master/);
  });

  test('rejects a commit that exists only on an open branch', () => {
    const cwd = initRepo();
    git(cwd, ['checkout', '-b', 'release']);
    fs.writeFileSync(path.join(cwd, 'package.json'), '{"version":"1.0.1"}\n');
    git(cwd, ['commit', '-am', 'bump']);
    expect(() => run(cwd)).toThrow(/not on master/);
  });

  test('accepts the merge commit after the branch lands on master', () => {
    const cwd = initRepo();
    git(cwd, ['checkout', '-b', 'release']);
    fs.writeFileSync(path.join(cwd, 'package.json'), '{"version":"1.0.1"}\n');
    git(cwd, ['commit', '-am', 'bump']);
    git(cwd, ['checkout', 'master']);
    git(cwd, ['merge', '--ff-only', 'release']);
    const output = run(cwd);
    expect(output).toMatch(/is on master/);
  });
});
