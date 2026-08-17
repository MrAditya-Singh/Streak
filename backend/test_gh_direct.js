import { fetchGitHubData } from './src/integrations/github.js';

async function run() {
  try {
    const res = await fetchGitHubData('MrAditya-Singh');
    console.log('GitHub Direct Response:', JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
