const fetch = require('node-fetch');

// Category mapping from LeetCode topic tags to NeetCode roadmap categories
const TOPIC_TO_CATEGORY = {
  'array': 'Arrays & Hashing',
  'hash-table': 'Arrays & Hashing',
  'string': 'Arrays & Hashing',
  'two-pointers': 'Two Pointers',
  'sliding-window': 'Sliding Window',
  'stack': 'Stack',
  'monotonic-stack': 'Stack',
  'binary-search': 'Binary Search',
  'linked-list': 'Linked List',
  'tree': 'Trees',
  'binary-tree': 'Trees',
  'binary-search-tree': 'Trees',
  'trie': 'Tries',
  'heap': 'Heap / Priority Queue',
  'priority-queue': 'Heap / Priority Queue',
  'backtracking': 'Backtracking',
  'graph': 'Graphs',
  'breadth-first-search': 'Graphs',
  'depth-first-search': 'Graphs',
  'topological-sort': 'Advanced Graphs',
  'shortest-path': 'Advanced Graphs',
  'dynamic-programming': '1-D Dynamic Programming',
  'greedy': 'Greedy',
  'interval': 'Intervals',
  'math': 'Math & Geometry',
  'geometry': 'Math & Geometry',
  'bit-manipulation': 'Bit Manipulation',
  'matrix': '2-D Dynamic Programming',
};

const CATEGORY_PRIORITY = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Heap / Priority Queue',
  'Backtracking',
  'Tries',
  'Graphs',
  'Advanced Graphs',
  '1-D Dynamic Programming',
  '2-D Dynamic Programming',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
];

function getCategoryPriority(cat) {
  const idx = CATEGORY_PRIORITY.indexOf(cat);
  return idx === -1 ? 999 : idx;
}

function mapTopicsToCategory(topicTags) {
  if (!topicTags || topicTags.length === 0) return 'Arrays & Hashing';
  for (const tag of topicTags) {
    const slug = tag.slug || '';
    if (TOPIC_TO_CATEGORY[slug]) return TOPIC_TO_CATEGORY[slug];
  }
  // fallback: check name
  for (const tag of topicTags) {
    const name = (tag.name || '').toLowerCase();
    for (const [key, val] of Object.entries(TOPIC_TO_CATEGORY)) {
      if (name.includes(key.replace('-', ' '))) return val;
    }
  }
  return 'Arrays & Hashing';
}

async function searchLeetCode(query) {
  const graphqlQuery = {
    query: `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          questions: data {
            questionFrontendId
            title
            titleSlug
            difficulty
            topicTags { name slug }
          }
        }
      }
    `,
    variables: {
      categorySlug: '',
      limit: 10,
      skip: 0,
      filters: { searchKeywords: query },
    },
  };

  const LEETCODE_URL = process.env.LEETCODE_GRAPHQL_URL || 'https://leetcode.com/graphql';
  const resp = await fetch(LEETCODE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0',
    },
    body: JSON.stringify(graphqlQuery),
  });

  if (!resp.ok) throw new Error(`LeetCode API returned ${resp.status}`);
  const data = await resp.json();
  const questions = data?.data?.problemsetQuestionList?.questions || [];

  return questions.map(q => ({
    leetcode_id: parseInt(q.questionFrontendId),
    name: q.title,
    difficulty: q.difficulty,
    category: mapTopicsToCategory(q.topicTags),
    leetcode_url: `https://leetcode.com/problems/${q.titleSlug}/`,
  }));
}

module.exports = { searchLeetCode, getCategoryPriority, CATEGORY_PRIORITY };
