// 第 2 區：小網神社（早上）
// 格式跟 ueno.js 一樣；x 是第幾格、lane 是第幾排（0 最裡面、4 最靠鏡頭）
// 標「待填」的地方等你把回憶給我之後再換掉

export default {
  id: 'koami',
  title: '小網神社',
  theme: 'shrine',
  width: 23,

  // 背景每一格放什麼：, 白牆   L 石燈籠   N 紅白旗   B 授與所（巫女站在裡面）
  stalls: ',,,,,,LN,,BB,NL,,L,,,,,',

  torii: { x: 3.4 },  // 鳥居中心
  hall: { x: 18 },    // 正殿從第幾格開始（佔 4 格）

  start: { x: 0.5, lane: 2, facing: 'right' },

  intro: [
    '這裡就是小網神社……被大樓包圍的小小神社。',
    '第二片回憶碎片，就藏在這裡的某個地方。',
  ],

  objects: [
    { id: 'sign', sprite: 'sign', x: 0.8, lane: 0, name: '看板', lines: ['小網神社　強運・厄除', '據說來這裡參拜，運氣會變好。'] },
    {
      id: 'well', sprite: 'well', x: 7.6, lane: 0,
      name: '錢洗井',
      lines: [
        '據說用這裡的水洗過的錢，會帶來好運。',
        '竹籃裡放著一枚洗得亮晶晶的五円硬幣……',
        '旁邊壓著一張小紙條：「祝妳今天也好運。」',
      ],
    },
    {
      id: 'miko',
      sprite: 'npc',
      colors: { hair: '#1f1b26', coat: '#f3efe8', skirt: '#c8283a' },
      x: 10.5, inStall: true,
      name: '巫女',
      lines: [
        '歡迎參拜～要抽一支籤嗎？',
        '抽籤之前，要先回答一個問題喔。答對了才能抽。',
      ],
      quiz: {
        question: '（回憶題待填）例：我們第一次一起去的神社是哪裡？',
        options: ['正確答案（待填）', '錯誤選項（待填）', '錯誤選項（待填）'],
        answer: 0,
        hints: [
          '嗯……好像不是這個喔。',
        ],
        successLines: [
          '答對了！',
          '來，搖一搖籤筒吧！',
        ],
        // 他寫在籤背面的話（不管抽到哪一支籤都會看到）
        message: '（他留的話：待填）',
        // 回憶碎片（抽到哪支籤都會拿到）
        fragment: { n: 2, of: 4, text: '每一次一起許下的願望、' },
      },

      // ---- 抽籤（運氣骰） ----
      // 不管抽到哪一支都會繼續往芝公園、海洋，最後一定找到他；
      // 抽到的籤決定最終章發生什麼事（內容在 sea.js 的 finale.variants），只有大吉會求婚
      // 其他籤的結局畫面可以「回到神社」重抽，抽完直接跳到碼頭
      omikuji: {
        // weight：機率權重（數字越大越容易抽到）
        // text：籤上的運勢；lines：抽到之後巫女說的話
        fortunes: [
          { rank: '大吉', weight: 25, text: '戀愛：最重要的人，就在妳身邊。', lines: ['大吉！', '好厲害，很少人抽得到呢。', '這支籤背面有字，收好喔。'] },
          { rank: '中吉', weight: 20, text: '戀愛：有人正努力朝妳跑過來。', lines: ['中吉呢！', '「努力朝妳跑過來」……好可愛的籤。', '籤背面有字，收好喔。'] },
          { rank: '小吉', weight: 20, text: '戀愛：溫暖的東西，會跟著他一起來。', lines: ['小吉～', '「溫暖的東西」是什麼呢？好令人期待。', '籤背面有字，收好喔。'] },
          { rank: '吉', weight: 15, text: '戀愛：他會一直陪在妳身邊。', lines: ['是吉！', '一直陪在身邊，很棒的籤呢。', '籤背面有字，收好喔。'] },
          { rank: '末吉', weight: 12, text: '戀愛：好事會晚一點到，但一定會到。', lines: ['末吉呢。', '晚一點也沒關係，重要的事總會發生的。', '籤背面有字，收好喔。'] },
          { rank: '凶', weight: 8, text: '戀愛：天氣可能不幫忙，但他會。', lines: ['啊……是凶。', '不過別擔心，籤只是提示，故事要自己走下去喔。', '籤背面有字，收好喔。'] },
        ],
        againLines: ['又見面了！要再抽一支籤嗎？', '來，搖一搖吧！'], // 回來重抽（或抽到一半關掉）時巫女說的話
        // 從結局回來重抽：收下新的籤之後，直接趕去碼頭
        redrawLines: ['快去碼頭吧！'],
      },
      afterLines: ['不好的籤可以綁在籤架上，把厄運留在神社喔。', '最後別忘了去正殿參拜～'],
      setFlag: 'koamiClue',
    },
    { id: 'omikuji', sprite: 'omikuji', x: 12.6, lane: 0, name: '籤架', lines: ['大家把抽到的籤綁在這裡。', '聽說抽到不好的籤綁在這裡，就能把厄運留下。'] },
    {
      id: 'ema', sprite: 'ema', x: 15.4, lane: 0,
      name: '繪馬架',
      lines: ['掛滿了大家的願望。', '「希望考試合格」「希望家人健康」……', '咦，有一塊繪馬的字跡好眼熟，可是被別的繪馬擋住了。'],
    },
    {
      id: 'priest',
      sprite: 'npc',
      colors: { hair: '#2a2a3a', coat: '#e8eef4', skirt: '#7a9ac0' },
      x: 16.6, lane: 1,
      name: '神主',
      lines: ['參拜的方式是「二拜、二拍手、一拜」喔。', '這間神社以「強運」聞名，很多人來祈求好運。'],
    },
    {
      id: 'grandma',
      sprite: 'npc',
      colors: { hair: '#c8c8d0', coat: '#7a5a6a' },
      x: 5.5, lane: 3,
      name: '附近的奶奶',
      lines: ['這間神社雖然小，可是很靈驗喔。', '拜完之後，我等一下要去芝公園走走。', '這個季節銀杏都黃了，下午去最漂亮呢。'],
    },
    {
      id: 'tourist', sprite: 'npc', colors: { hair: '#c9a46a', coat: '#4f9a62' }, x: 9, lane: 2, walk: { from: 5, to: 14 },
      name: '觀光客', lines: ['聽說錢洗井洗過的錢，要拿去花掉才會有好運耶！'],
    },
    {
      id: 'salaryman', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#3a3e4a' }, x: 12, lane: 4, walk: { from: 4, to: 17 },
      name: '上班族', lines: ['每天上班前，都會順路來這裡拜一下。'],
    },

    // 在正殿前參拜的人（背對鏡頭）
    { id: 'pray-1', sprite: 'npc', colors: { hair: '#3a2a20', coat: '#6a7a9a' }, x: 18.3, shop: true },
    { id: 'pray-2', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#9a5a3a', bag: '#f3efe8' }, x: 20.6, shop: true },

    // 背景人潮
    { id: 'crowd-1', sprite: 'npc', colors: { hair: '#2a2a3a', coat: '#7a4a4a' }, x: 6, lane: 1, walk: { from: 4, to: 12 } },
    { id: 'crowd-2', sprite: 'npc', colors: { hair: '#8a6a4a', coat: '#c9a46a' }, x: 14, lane: 3, walk: { from: 8, to: 17 } },
    { id: 'crowd-3', sprite: 'npc', colors: { hair: '#4a3030', coat: '#6a5a8a' }, x: 3, lane: 4, walk: { from: 1, to: 10 } },
  ],

  exit: {
    x: 20, // 正殿前
    requireFlag: 'koamiClue',
    lockedLines: ['來到正殿前……', '先在神社裡逛逛，找找第二片碎片吧。'],
    doneLines: [
      '（二拜、二拍手、一拜）',
      '「希望他的願望可以實現。」',
    ],
  },
}
