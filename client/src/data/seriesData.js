// seriesData.js — LeetCode Series problem lists
// Each series: { id, name, description, modes (optional), categories: { name: [problems] } }
// Each problem: { id, name, difficulty, url }

const LC = (id, name, diff) => ({
  id, name, difficulty: diff,
  url: `https://leetcode.com/problems/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}/`,
})

// ─── NEETCODE 150 ──────────────────────────────────────────────
const neetcode150 = {
  'Arrays & Hashing': [
    LC(217,'Contains Duplicate','Easy'), LC(242,'Valid Anagram','Easy'), LC(1,'Two Sum','Easy'),
    LC(49,'Group Anagrams','Medium'), LC(347,'Top K Frequent Elements','Medium'),
    LC(238,'Product of Array Except Self','Medium'), LC(36,'Valid Sudoku','Medium'),
    LC(271,'Encode and Decode Strings','Medium'), LC(128,'Longest Consecutive Sequence','Medium'),
  ],
  'Two Pointers': [
    LC(125,'Valid Palindrome','Easy'), LC(167,'Two Sum II Input Array Is Sorted','Medium'),
    LC(15,'3Sum','Medium'), LC(11,'Container With Most Water','Medium'),
    LC(42,'Trapping Rain Water','Hard'),
  ],
  'Sliding Window': [
    LC(121,'Best Time to Buy and Sell Stock','Easy'),
    LC(3,'Longest Substring Without Repeating Characters','Medium'),
    LC(424,'Longest Repeating Character Replacement','Medium'),
    LC(567,'Permutation in String','Medium'),
    LC(76,'Minimum Window Substring','Hard'),
    LC(239,'Sliding Window Maximum','Hard'),
  ],
  'Stack': [
    LC(20,'Valid Parentheses','Easy'), LC(155,'Min Stack','Medium'),
    LC(150,'Evaluate Reverse Polish Notation','Medium'),
    LC(22,'Generate Parentheses','Medium'), LC(739,'Daily Temperatures','Medium'),
    LC(853,'Car Fleet','Medium'), LC(84,'Largest Rectangle in Histogram','Hard'),
  ],
  'Binary Search': [
    LC(704,'Binary Search','Easy'), LC(74,'Search a 2D Matrix','Medium'),
    LC(875,'Koko Eating Bananas','Medium'), LC(33,'Search in Rotated Sorted Array','Medium'),
    LC(153,'Find Minimum in Rotated Sorted Array','Medium'),
    LC(981,'Time Based Key Value Store','Medium'),
    LC(4,'Median of Two Sorted Arrays','Hard'),
  ],
  'Linked List': [
    LC(206,'Reverse Linked List','Easy'), LC(21,'Merge Two Sorted Lists','Easy'),
    LC(143,'Reorder List','Medium'), LC(19,'Remove Nth Node From End of List','Medium'),
    LC(138,'Copy List With Random Pointer','Medium'),
    LC(2,'Add Two Numbers','Medium'), LC(141,'Linked List Cycle','Easy'),
    LC(287,'Find the Duplicate Number','Medium'),
    LC(146,'LRU Cache','Medium'), LC(23,'Merge K Sorted Lists','Hard'),
    LC(25,'Reverse Nodes in K Group','Hard'),
  ],
  'Trees': [
    LC(226,'Invert Binary Tree','Easy'), LC(104,'Maximum Depth of Binary Tree','Easy'),
    LC(543,'Diameter of Binary Tree','Easy'), LC(110,'Balanced Binary Tree','Easy'),
    LC(100,'Same Tree','Easy'), LC(572,'Subtree of Another Tree','Easy'),
    LC(235,'Lowest Common Ancestor of a BST','Medium'),
    LC(102,'Binary Tree Level Order Traversal','Medium'),
    LC(199,'Binary Tree Right Side View','Medium'),
    LC(1448,'Count Good Nodes in Binary Tree','Medium'),
    LC(98,'Validate Binary Search Tree','Medium'),
    LC(230,'Kth Smallest Element in a BST','Medium'),
    LC(105,'Construct Binary Tree From Preorder and Inorder Traversal','Medium'),
    LC(124,'Binary Tree Maximum Path Sum','Hard'),
    LC(297,'Serialize and Deserialize Binary Tree','Hard'),
  ],
  'Tries': [
    LC(208,'Implement Trie Prefix Tree','Medium'),
    LC(211,'Design Add and Search Words Data Structure','Medium'),
    LC(212,'Word Search II','Hard'),
  ],
  'Heap / Priority Queue': [
    LC(703,'Kth Largest Element in a Stream','Easy'),
    LC(1046,'Last Stone Weight','Easy'),
    LC(973,'K Closest Points to Origin','Medium'),
    LC(215,'Kth Largest Element in an Array','Medium'),
    LC(621,'Task Scheduler','Medium'),
    LC(355,'Design Twitter','Medium'),
    LC(295,'Find Median From Data Stream','Hard'),
  ],
  'Backtracking': [
    LC(78,'Subsets','Medium'), LC(39,'Combination Sum','Medium'),
    LC(46,'Permutations','Medium'), LC(90,'Subsets II','Medium'),
    LC(40,'Combination Sum II','Medium'), LC(79,'Word Search','Medium'),
    LC(131,'Palindrome Partitioning','Medium'), LC(17,'Letter Combinations of a Phone Number','Medium'),
    LC(51,'N Queens','Hard'),
  ],
  'Graphs': [
    LC(200,'Number of Islands','Medium'), LC(133,'Clone Graph','Medium'),
    LC(695,'Max Area of Island','Medium'), LC(417,'Pacific Atlantic Water Flow','Medium'),
    LC(130,'Surrounded Regions','Medium'), LC(994,'Rotting Oranges','Medium'),
    LC(286,'Walls and Gates','Medium'), LC(207,'Course Schedule','Medium'),
    LC(210,'Course Schedule II','Medium'), LC(684,'Redundant Connection','Medium'),
    LC(323,'Number of Connected Components in an Undirected Graph','Medium'),
    LC(261,'Graph Valid Tree','Medium'),
    LC(127,'Word Ladder','Hard'),
  ],
  'Advanced Graphs': [
    LC(332,'Reconstruct Itinerary','Hard'),
    LC(1584,'Min Cost to Connect All Points','Medium'),
    LC(743,'Network Delay Time','Medium'),
    LC(787,'Cheapest Flights Within K Stops','Medium'),
    LC(269,'Alien Dictionary','Hard'),
  ],
  '1-D Dynamic Programming': [
    LC(70,'Climbing Stairs','Easy'), LC(746,'Min Cost Climbing Stairs','Easy'),
    LC(198,'House Robber','Medium'), LC(213,'House Robber II','Medium'),
    LC(5,'Longest Palindromic Substring','Medium'),
    LC(647,'Palindromic Substrings','Medium'), LC(91,'Decode Ways','Medium'),
    LC(322,'Coin Change','Medium'), LC(152,'Maximum Product Subarray','Medium'),
    LC(139,'Word Break','Medium'), LC(300,'Longest Increasing Subsequence','Medium'),
    LC(416,'Partition Equal Subset Sum','Medium'),
  ],
  '2-D Dynamic Programming': [
    LC(62,'Unique Paths','Medium'), LC(1143,'Longest Common Subsequence','Medium'),
    LC(309,'Best Time to Buy and Sell Stock With Cooldown','Medium'),
    LC(518,'Coin Change II','Medium'), LC(494,'Target Sum','Medium'),
    LC(97,'Interleaving String','Medium'), LC(329,'Longest Increasing Path in a Matrix','Hard'),
    LC(115,'Distinct Subsequences','Hard'), LC(72,'Edit Distance','Medium'),
    LC(312,'Burst Balloons','Hard'), LC(10,'Regular Expression Matching','Hard'),
  ],
  'Greedy': [
    LC(53,'Maximum Subarray','Medium'), LC(55,'Jump Game','Medium'),
    LC(45,'Jump Game II','Medium'), LC(134,'Gas Station','Medium'),
    LC(846,'Hand of Straights','Medium'), LC(1899,'Merge Triplets to Form Target Triplet','Medium'),
    LC(763,'Partition Labels','Medium'), LC(678,'Valid Parenthesis String','Medium'),
  ],
  'Intervals': [
    LC(57,'Insert Interval','Medium'), LC(56,'Merge Intervals','Medium'),
    LC(435,'Non Overlapping Intervals','Medium'),
    LC(252,'Meeting Rooms','Easy'), LC(253,'Meeting Rooms II','Medium'),
    LC(1851,'Minimum Interval to Include Each Query','Hard'),
  ],
  'Math & Geometry': [
    LC(48,'Rotate Image','Medium'), LC(54,'Spiral Matrix','Medium'),
    LC(73,'Set Matrix Zeroes','Medium'), LC(202,'Happy Number','Easy'),
    LC(66,'Plus One','Easy'), LC(50,'Pow X N','Medium'),
    LC(43,'Multiply Strings','Medium'), LC(2013,'Detect Squares','Medium'),
  ],
  'Bit Manipulation': [
    LC(136,'Single Number','Easy'), LC(191,'Number of 1 Bits','Easy'),
    LC(338,'Counting Bits','Easy'), LC(190,'Reverse Bits','Easy'),
    LC(268,'Missing Number','Easy'), LC(371,'Sum of Two Integers','Medium'),
    LC(7,'Reverse Integer','Medium'),
  ],
}

// ─── Extra problems for NEETCODE 250 ──────────────────────────
const neetcode250Extra = {
  'Arrays & Hashing': [
    LC(659,'Split Array into Consecutive Subsequences','Medium'),
    LC(290,'Word Pattern','Easy'), LC(605,'Can Place Flowers','Easy'),
    LC(380,'Insert Delete GetRandom O1','Medium'),
    LC(1189,'Maximum Number of Balloons','Easy'),
    LC(14,'Longest Common Prefix','Easy'),
    LC(27,'Remove Element','Easy'),
    LC(929,'Unique Email Addresses','Easy'),
    LC(554,'Brick Wall','Medium'),
    LC(1396,'Design Underground System','Medium'),
  ],
  'Two Pointers': [
    LC(680,'Valid Palindrome II','Easy'), LC(1968,'Array With Elements Not Equal to Average of Neighbors','Medium'),
    LC(75,'Sort Colors','Medium'), LC(31,'Next Permutation','Medium'),
  ],
  'Sliding Window': [
    LC(1343,'Number of Sub arrays of Size K and Average Greater than or Equal to Threshold','Medium'),
    LC(904,'Fruit Into Baskets','Medium'),
    LC(1456,'Maximum Number of Vowels in a Substring of Given Size','Medium'),
  ],
  'Stack': [
    LC(735,'Asteroid Collision','Medium'), LC(394,'Decode String','Medium'),
    LC(496,'Next Greater Element I','Easy'),
    LC(503,'Next Greater Element II','Medium'),
    LC(901,'Online Stock Span','Medium'),
  ],
  'Binary Search': [
    LC(35,'Search Insert Position','Easy'), LC(540,'Single Element in a Sorted Array','Medium'),
    LC(34,'Find First and Last Position of Element in Sorted Array','Medium'),
    LC(162,'Find Peak Element','Medium'),
    LC(69,'Sqrt X','Easy'),
  ],
  'Linked List': [
    LC(160,'Intersection of Two Linked Lists','Easy'), LC(234,'Palindrome Linked List','Easy'),
    LC(876,'Middle of the Linked List','Easy'),
    LC(142,'Linked List Cycle II','Medium'),
    LC(61,'Rotate List','Medium'),
    LC(82,'Remove Duplicates From Sorted List II','Medium'),
  ],
  'Trees': [
    LC(144,'Binary Tree Preorder Traversal','Easy'), LC(94,'Binary Tree Inorder Traversal','Easy'),
    LC(236,'Lowest Common Ancestor of a Binary Tree','Medium'),
    LC(145,'Binary Tree Postorder Traversal','Easy'),
    LC(108,'Convert Sorted Array to Binary Search Tree','Easy'),
    LC(662,'Maximum Width of Binary Tree','Medium'),
    LC(437,'Path Sum III','Medium'),
    LC(1038,'Binary Search Tree to Greater Sum Tree','Medium'),
  ],
  'Heap / Priority Queue': [
    LC(1337,'The K Weakest Rows in a Matrix','Easy'),
    LC(378,'Kth Smallest Element in a Sorted Matrix','Medium'),
    LC(767,'Reorganize String','Medium'),
    LC(1642,'Furthest Building You Can Reach','Medium'),
  ],
  'Backtracking': [
    LC(77,'Combinations','Medium'), LC(37,'Sudoku Solver','Hard'),
    LC(1849,'Splitting a String Into Descending Consecutive Values','Medium'),
    LC(698,'Partition to K Equal Sum Subsets','Medium'),
  ],
  'Graphs': [
    LC(463,'Island Perimeter','Easy'), LC(1091,'Shortest Path in Binary Matrix','Medium'),
    LC(785,'Is Graph Bipartite','Medium'),
    LC(1254,'Number of Closed Islands','Medium'),
    LC(1905,'Count Sub Islands','Medium'),
    LC(399,'Evaluate Division','Medium'),
    LC(1976,'Number of Ways to Arrive at Destination','Medium'),
  ],
  'Advanced Graphs': [
    LC(778,'Swim in Rising Water','Hard'),
    LC(1631,'Path With Minimum Effort','Medium'),
  ],
  '1-D Dynamic Programming': [
    LC(509,'Fibonacci Number','Easy'), LC(377,'Combination Sum IV','Medium'),
    LC(983,'Minimum Cost For Tickets','Medium'),
    LC(279,'Perfect Squares','Medium'),
  ],
  '2-D Dynamic Programming': [
    LC(64,'Minimum Path Sum','Medium'), LC(516,'Longest Palindromic Subsequence','Medium'),
    LC(1049,'Last Stone Weight II','Medium'),
    LC(474,'Ones and Zeroes','Medium'),
  ],
  'Greedy': [
    LC(1005,'Maximize Sum of Array After K Negations','Easy'),
    LC(135,'Candy','Hard'),
    LC(860,'Lemonade Change','Easy'),
    LC(455,'Assign Cookies','Easy'),
  ],
  'Intervals': [
    LC(986,'Interval List Intersections','Medium'),
    LC(452,'Minimum Number of Arrows to Burst Balloons','Medium'),
    LC(1288,'Remove Covered Intervals','Medium'),
  ],
  'Math & Geometry': [
    LC(9,'Palindrome Number','Easy'), LC(12,'Integer to Roman','Medium'),
    LC(168,'Excel Sheet Column Title','Easy'),
    LC(1041,'Robot Bounded in Circle','Medium'),
  ],
  'Bit Manipulation': [
    LC(1318,'Minimum Flips to Make a OR b Equal to c','Medium'),
    LC(231,'Power of Two','Easy'),
  ],
}

// ─── BLIND 75 ─────────────────────────────────────────────────
const blind75Categories = {
  'Array': [
    LC(1,'Two Sum','Easy'), LC(121,'Best Time to Buy and Sell Stock','Easy'),
    LC(217,'Contains Duplicate','Easy'), LC(238,'Product of Array Except Self','Medium'),
    LC(53,'Maximum Subarray','Medium'), LC(152,'Maximum Product Subarray','Medium'),
    LC(153,'Find Minimum in Rotated Sorted Array','Medium'),
    LC(33,'Search in Rotated Sorted Array','Medium'),
    LC(15,'3Sum','Medium'), LC(11,'Container With Most Water','Medium'),
  ],
  'Binary': [
    LC(371,'Sum of Two Integers','Medium'), LC(191,'Number of 1 Bits','Easy'),
    LC(338,'Counting Bits','Easy'), LC(268,'Missing Number','Easy'),
    LC(190,'Reverse Bits','Easy'),
  ],
  'Dynamic Programming': [
    LC(70,'Climbing Stairs','Easy'), LC(322,'Coin Change','Medium'),
    LC(300,'Longest Increasing Subsequence','Medium'),
    LC(1143,'Longest Common Subsequence','Medium'),
    LC(139,'Word Break','Medium'), LC(377,'Combination Sum IV','Medium'),
    LC(198,'House Robber','Medium'), LC(213,'House Robber II','Medium'),
    LC(91,'Decode Ways','Medium'), LC(62,'Unique Paths','Medium'),
    LC(55,'Jump Game','Medium'),
  ],
  'Graph': [
    LC(133,'Clone Graph','Medium'), LC(207,'Course Schedule','Medium'),
    LC(417,'Pacific Atlantic Water Flow','Medium'), LC(200,'Number of Islands','Medium'),
    LC(128,'Longest Consecutive Sequence','Medium'),
    LC(269,'Alien Dictionary','Hard'),
    LC(261,'Graph Valid Tree','Medium'),
    LC(323,'Number of Connected Components in an Undirected Graph','Medium'),
  ],
  'Interval': [
    LC(57,'Insert Interval','Medium'), LC(56,'Merge Intervals','Medium'),
    LC(435,'Non Overlapping Intervals','Medium'),
    LC(252,'Meeting Rooms','Easy'), LC(253,'Meeting Rooms II','Medium'),
  ],
  'Linked List': [
    LC(206,'Reverse Linked List','Easy'), LC(141,'Linked List Cycle','Easy'),
    LC(21,'Merge Two Sorted Lists','Easy'), LC(23,'Merge K Sorted Lists','Hard'),
    LC(19,'Remove Nth Node From End of List','Medium'),
    LC(143,'Reorder List','Medium'),
  ],
  'Matrix': [
    LC(73,'Set Matrix Zeroes','Medium'), LC(54,'Spiral Matrix','Medium'),
    LC(48,'Rotate Image','Medium'), LC(79,'Word Search','Medium'),
  ],
  'String': [
    LC(3,'Longest Substring Without Repeating Characters','Medium'),
    LC(424,'Longest Repeating Character Replacement','Medium'),
    LC(76,'Minimum Window Substring','Hard'),
    LC(242,'Valid Anagram','Easy'), LC(49,'Group Anagrams','Medium'),
    LC(20,'Valid Parentheses','Easy'), LC(125,'Valid Palindrome','Easy'),
    LC(5,'Longest Palindromic Substring','Medium'),
    LC(647,'Palindromic Substrings','Medium'),
    LC(271,'Encode and Decode Strings','Medium'),
  ],
  'Tree': [
    LC(104,'Maximum Depth of Binary Tree','Easy'), LC(100,'Same Tree','Easy'),
    LC(226,'Invert Binary Tree','Easy'), LC(124,'Binary Tree Maximum Path Sum','Hard'),
    LC(102,'Binary Tree Level Order Traversal','Medium'),
    LC(297,'Serialize and Deserialize Binary Tree','Hard'),
    LC(572,'Subtree of Another Tree','Easy'),
    LC(105,'Construct Binary Tree From Preorder and Inorder Traversal','Medium'),
    LC(98,'Validate Binary Search Tree','Medium'),
    LC(230,'Kth Smallest Element in a BST','Medium'),
    LC(235,'Lowest Common Ancestor of a BST','Medium'),
    LC(208,'Implement Trie Prefix Tree','Medium'),
    LC(211,'Design Add and Search Words Data Structure','Medium'),
    LC(212,'Word Search II','Hard'),
  ],
  'Heap': [
    LC(23,'Merge K Sorted Lists','Hard'),
    LC(347,'Top K Frequent Elements','Medium'),
    LC(295,'Find Median From Data Stream','Hard'),
  ],
}

// ─── STRIVER SHEET (SDE Sheet — Top problems) ────────────────
const striverCategories = {
  'Arrays': [
    LC(73,'Set Matrix Zeroes','Medium'), LC(118,'Pascals Triangle','Easy'),
    LC(31,'Next Permutation','Medium'), LC(53,'Maximum Subarray','Medium'),
    LC(75,'Sort Colors','Medium'), LC(121,'Best Time to Buy and Sell Stock','Easy'),
    LC(56,'Merge Intervals','Medium'), LC(88,'Merge Sorted Array','Easy'),
    LC(287,'Find the Duplicate Number','Medium'), LC(26,'Remove Duplicates From Sorted Array','Easy'),
    LC(1,'Two Sum','Easy'), LC(15,'3Sum','Medium'),
    LC(18,'4Sum','Medium'), LC(128,'Longest Consecutive Sequence','Medium'),
    LC(169,'Majority Element','Easy'), LC(229,'Majority Element II','Medium'),
    LC(62,'Unique Paths','Medium'), LC(48,'Rotate Image','Medium'),
  ],
  'Linked List': [
    LC(206,'Reverse Linked List','Easy'), LC(876,'Middle of the Linked List','Easy'),
    LC(21,'Merge Two Sorted Lists','Easy'), LC(19,'Remove Nth Node From End of List','Medium'),
    LC(2,'Add Two Numbers','Medium'), LC(160,'Intersection of Two Linked Lists','Easy'),
    LC(141,'Linked List Cycle','Easy'), LC(142,'Linked List Cycle II','Medium'),
    LC(234,'Palindrome Linked List','Easy'), LC(25,'Reverse Nodes in K Group','Hard'),
    LC(61,'Rotate List','Medium'), LC(138,'Copy List With Random Pointer','Medium'),
    LC(146,'LRU Cache','Medium'), LC(143,'Reorder List','Medium'),
  ],
  'Greedy': [
    LC(455,'Assign Cookies','Easy'), LC(55,'Jump Game','Medium'),
    LC(45,'Jump Game II','Medium'), LC(134,'Gas Station','Medium'),
    LC(135,'Candy','Hard'), LC(763,'Partition Labels','Medium'),
    LC(860,'Lemonade Change','Easy'),
  ],
  'Binary Search': [
    LC(704,'Binary Search','Easy'), LC(34,'Find First and Last Position of Element in Sorted Array','Medium'),
    LC(33,'Search in Rotated Sorted Array','Medium'),
    LC(153,'Find Minimum in Rotated Sorted Array','Medium'),
    LC(162,'Find Peak Element','Medium'), LC(69,'Sqrt X','Easy'),
    LC(875,'Koko Eating Bananas','Medium'), LC(4,'Median of Two Sorted Arrays','Hard'),
  ],
  'Recursion & Backtracking': [
    LC(78,'Subsets','Medium'), LC(90,'Subsets II','Medium'),
    LC(46,'Permutations','Medium'), LC(39,'Combination Sum','Medium'),
    LC(40,'Combination Sum II','Medium'), LC(131,'Palindrome Partitioning','Medium'),
    LC(51,'N Queens','Hard'), LC(37,'Sudoku Solver','Hard'),
    LC(79,'Word Search','Medium'), LC(17,'Letter Combinations of a Phone Number','Medium'),
  ],
  'Stack & Queue': [
    LC(20,'Valid Parentheses','Easy'), LC(155,'Min Stack','Medium'),
    LC(84,'Largest Rectangle in Histogram','Hard'),
    LC(239,'Sliding Window Maximum','Hard'),
    LC(739,'Daily Temperatures','Medium'),
    LC(496,'Next Greater Element I','Easy'),
    LC(503,'Next Greater Element II','Medium'),
    LC(150,'Evaluate Reverse Polish Notation','Medium'),
  ],
  'Trees': [
    LC(94,'Binary Tree Inorder Traversal','Easy'),
    LC(144,'Binary Tree Preorder Traversal','Easy'),
    LC(145,'Binary Tree Postorder Traversal','Easy'),
    LC(104,'Maximum Depth of Binary Tree','Easy'),
    LC(110,'Balanced Binary Tree','Easy'), LC(543,'Diameter of Binary Tree','Easy'),
    LC(226,'Invert Binary Tree','Easy'), LC(102,'Binary Tree Level Order Traversal','Medium'),
    LC(199,'Binary Tree Right Side View','Medium'),
    LC(105,'Construct Binary Tree From Preorder and Inorder Traversal','Medium'),
    LC(124,'Binary Tree Maximum Path Sum','Hard'),
    LC(297,'Serialize and Deserialize Binary Tree','Hard'),
  ],
  'BST': [
    LC(700,'Search in a Binary Search Tree','Easy'),
    LC(98,'Validate Binary Search Tree','Medium'),
    LC(235,'Lowest Common Ancestor of a BST','Medium'),
    LC(230,'Kth Smallest Element in a BST','Medium'),
    LC(236,'Lowest Common Ancestor of a Binary Tree','Medium'),
  ],
  'Heap': [
    LC(215,'Kth Largest Element in an Array','Medium'),
    LC(347,'Top K Frequent Elements','Medium'),
    LC(295,'Find Median From Data Stream','Hard'),
    LC(23,'Merge K Sorted Lists','Hard'),
    LC(973,'K Closest Points to Origin','Medium'),
  ],
  'Graph': [
    LC(200,'Number of Islands','Medium'), LC(133,'Clone Graph','Medium'),
    LC(207,'Course Schedule','Medium'), LC(210,'Course Schedule II','Medium'),
    LC(695,'Max Area of Island','Medium'), LC(417,'Pacific Atlantic Water Flow','Medium'),
    LC(994,'Rotting Oranges','Medium'), LC(130,'Surrounded Regions','Medium'),
    LC(127,'Word Ladder','Hard'), LC(743,'Network Delay Time','Medium'),
  ],
  'Dynamic Programming': [
    LC(70,'Climbing Stairs','Easy'), LC(198,'House Robber','Medium'),
    LC(213,'House Robber II','Medium'), LC(322,'Coin Change','Medium'),
    LC(300,'Longest Increasing Subsequence','Medium'),
    LC(1143,'Longest Common Subsequence','Medium'),
    LC(72,'Edit Distance','Medium'), LC(416,'Partition Equal Subset Sum','Medium'),
    LC(494,'Target Sum','Medium'), LC(5,'Longest Palindromic Substring','Medium'),
    LC(139,'Word Break','Medium'), LC(312,'Burst Balloons','Hard'),
    LC(62,'Unique Paths','Medium'), LC(64,'Minimum Path Sum','Medium'),
    LC(10,'Regular Expression Matching','Hard'),
  ],
  'Strings': [
    LC(242,'Valid Anagram','Easy'), LC(3,'Longest Substring Without Repeating Characters','Medium'),
    LC(76,'Minimum Window Substring','Hard'), LC(49,'Group Anagrams','Medium'),
    LC(647,'Palindromic Substrings','Medium'), LC(14,'Longest Common Prefix','Easy'),
    LC(680,'Valid Palindrome II','Easy'),
  ],
  'Trie': [
    LC(208,'Implement Trie Prefix Tree','Medium'),
    LC(211,'Design Add and Search Words Data Structure','Medium'),
    LC(212,'Word Search II','Hard'),
  ],
}

// ─── Build series objects ─────────────────────────────────────
function merge250(base, extra) {
  const result = {}
  for (const cat of Object.keys(base)) {
    const ids = new Set(base[cat].map(p => p.id))
    const extras = (extra[cat] || []).filter(p => !ids.has(p.id))
    result[cat] = [...base[cat], ...extras]
  }
  for (const cat of Object.keys(extra)) {
    if (!result[cat]) result[cat] = extra[cat]
  }
  return result
}

const neetcode250Categories = merge250(neetcode150, neetcode250Extra)

export const SERIES = [
  {
    id: 'neetcode',
    name: 'NeetCode',
    description: 'Curated by NeetCode — the most popular DSA problem list',
    icon: '🚀',
    color: '#7c6ff7',
    modes: [
      { label: '150', value: '150' },
      { label: '250', value: '250' },
    ],
    defaultMode: '150',
    categories: {
      '150': neetcode150,
      '250': neetcode250Categories,
    },
  },
  {
    id: 'striver',
    name: 'Striver SDE Sheet',
    description: "Striver's SDE Sheet — top DSA problems for interviews",
    icon: '🔥',
    color: '#eab308',
    modes: null,
    categories: striverCategories,
  },
  {
    id: 'blind75',
    name: 'Blind 75',
    description: 'The original 75 most frequently asked interview questions',
    icon: '👁️',
    color: '#22c55e',
    modes: null,
    categories: blind75Categories,
  },
]
