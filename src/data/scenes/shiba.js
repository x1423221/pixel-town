// 第 3 區：芝公園（傍晚）
// 標「待填」的地方等你把回憶給我之後再換掉

export default {
  id: 'shiba',
  title: '芝公園',
  theme: 'park',
  width: 24,

  // 背景每一格：, 銀杏樹   S 路燈
  stalls: ',,,,S,,,,,,S,,,,,,S,,,,,',

  tower: { screenX: 200 }, // 背景鐵塔一開始在畫面上的位置（越往右走越靠中間）
  gate: { x: 21 },         // 鐵塔入口從第幾格開始（佔 3 格）

  start: { x: 0.5, lane: 2, facing: 'right' },

  intro: [
    '下午四點的芝公園……',
    '銀杏葉都變黃了，好漂亮。',
    '第三片回憶碎片，就在這座公園裡。',
  ],

  objects: [
    { id: 'sign', sprite: 'sign', x: 0.8, lane: 0, name: '看板', lines: ['芝公園　→ 往鐵塔'] },
    {
      id: 'bench', sprite: 'bench', x: 6.2, lane: 0,
      name: '長椅',
      lines: ['長椅上放著一片很漂亮的銀杏葉。', '翻過來一看，背面寫著小小的字：「再往前走一點。」'],
    },
    {
      id: 'sweeper', sprite: 'npc', colors: { hair: '#c8c8d0', coat: '#5a6a4a', cap: '#3a4a32' }, x: 9, lane: 1,
      name: '掃落葉的爺爺',
      lines: ['這個季節的銀杏葉，掃也掃不完呢。', '不過掃成一堆，踩上去沙沙的，小朋友最喜歡了。'],
    },
    {
      id: 'busker',
      sprite: 'npc',
      colors: { hair: '#3a2a20', coat: '#3a4a6a', guitar: true },
      x: 13, lane: 0,
      name: '街頭藝人',
      lines: [
        '（溫柔的吉他聲）',
        '……紅色貝蕾帽，妳就是那位吧？',
        '今天下午有位客人點了一首歌，說要彈給戴紅色貝蕾帽的人聽。',
        '他說如果妳猜得出是哪一首，就把這個交給妳。',
      ],
      quiz: {
        question: '（回憶題待填）例：我們兩個的歌是哪一首？',
        options: ['正確答案（待填）', '錯誤選項（待填）', '錯誤選項（待填）'],
        answer: 0,
        hints: [
          '嗯……不是這首喔。',
        ],
        successLines: [
          '就是這首！',
          '（吉他聲換成了那首歌的旋律）',
          '這是那位客人託我轉交的。',
        ],
        reward: {
          id: 'tickets',
          name: '展望台門票',
          note: '一張給妳，一張給我。\n\n（他留的話：待填）',
          fragment: { n: 3, of: 4, text: '一起看過的每一片風景——' },
        },
      },
      afterLines: ['拿著門票，去鐵塔上看看吧。'],
      setFlag: 'shibaClue',
    },
    {
      id: 'photographer', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#2a2a38', cap: '#2a2a38' }, x: 16, lane: 3,
      name: '攝影師',
      lines: ['從這個角度拍鐵塔最漂亮喔！', '再過一會兒天黑，鐵塔就會點燈了。'],
    },
    {
      id: 'mom', sprite: 'npc', colors: { hair: '#6a3a2a', coat: '#d98aa0' }, x: 7, lane: 2, walk: { from: 3, to: 12 },
      name: '帶小孩的媽媽', lines: ['小朋友一直撿銀杏葉，口袋都塞滿了。'],
    },
    {
      id: 'staff', sprite: 'npc', colors: { hair: '#2a2a3a', coat: '#e8582a', cap: '#e8582a' }, x: 20, lane: 1,
      name: '入口的工作人員', lines: ['展望台入口在這邊喔，請準備好門票。'],
    },

    // 背景人潮
    { id: 'runner', sprite: 'npc', colors: { hair: '#2a2a3a', coat: '#2e6ad0' }, x: 4, lane: 4, walk: { from: 2, to: 19 } },
    { id: 'crowd-1', sprite: 'npc', colors: { hair: '#8a6a4a', coat: '#7a4a4a' }, x: 11, lane: 3, walk: { from: 6, to: 18 } },
    { id: 'crowd-2', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#c8b89a' }, x: 17, lane: 2, walk: { from: 12, to: 20 } },
    { id: 'crowd-3', sprite: 'npc', colors: { hair: '#4a3030', coat: '#3a6a5a' }, x: 2, lane: 1, walk: { from: 1, to: 8 } },
  ],

  exit: {
    x: 22.4, // 鐵塔入口
    requireFlag: 'shibaClue',
    lockedLines: ['入口前排著隊……', '沒有門票進不去，先在公園裡找找線索吧。'],
    doneLines: [
      '（把兩張門票交給工作人員）',
      '展望台上，整個東京的燈都亮了起來。',
      '窗邊貼著一張紙條：',
      '「最後一片，在海的那一邊。明天見。」',
    ],
  },
}
