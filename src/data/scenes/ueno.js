// 第 1 區：上野・阿美橫町（橫向捲軸，路面有 5 排可以上下移動）
//
// 畫面由上到下：夜空 → JR 高架（山手線） → 高架下的店 → 攤位 → 路面（5 排）
// 所有 x 都是「第幾格」（一格 24 像素，從 0 開始，左到右）
// lane 是路面的第幾排：0 最裡面（靠攤位）、4 最靠鏡頭

export default {
  id: 'ueno',
  title: '阿美橫町',
  theme: 'ameyoko',
  width: 30, // 整條街幾格寬（畫面一次看得到 8 格）

  // 每一格前面擺什麼攤位（跟 width 一樣長）
  //   A 零食／乾貨／衣服隨機   F 水果攤   K 魚攤   C 牛奶糖攤   , 沒有攤位
  stalls: 'AA,,AFFFAA,AAKKCA,AAFF,KKKA,,,',

  arch: { x: 3.4 },      // 入口拱門的中心（左右柱子各往外約 2.7 格）
  station: { x: 27 },    // 上野站從第幾格開始（佔 3 格），走到門口就是終點
  train: { cars: 4, everyMs: 6000 },

  // 營業時間：店會依日本時間開店、收攤（早上 9:00～10:30 陸續開，傍晚 18:00～20:00 陸續收）
  //   收攤後店員不在、街上的人變少；always: true 的人（劇情需要）一直都在
  //   phaseLines 可以依時段換台詞：early 還沒開／closing 收攤中／closed 打烊（沒寫就用 lines）
  shopHours: true,

  start: { x: 0.5, lane: 2, facing: 'right' },

  // 第一次打開遊戲：他說話 → 神秘的信 → 出發
  introParts: [
    { name: '他', lines: ['終於到阿美橫町了！', '……欸，妳手機是不是響了？'] },
    {
      name: '神秘的信',
      lines: [
        '歡迎來到「像素東京」。',
        '到處逛逛吧！',
      ],
    },
    { name: '他', lines: ['走吧，先去看看有什麼好吃的！'] },
  ],

  // 三種人／物件：
  //   inStall: true      站在攤位裡（櫃檯後面），她要走到最裡面那排才能跟他說話
  //   walk: { from, to } 在街上 from～to 格之間隨機走動、換排
  //   都沒有              固定站在 lane 那一排
  //   沒有 lines 的人只是背景人潮，不能對話
  objects: [
    {
      id: 'gate-sign',
      sprite: 'sign',
      x: 1.2, lane: 0,
      name: '看板',
      lines: ['阿美橫町　→ 往上野站'],
    },
    {
      id: 'tourist-1',
      sprite: 'npc',
      colors: { hair: '#c9a46a', coat: '#4f9a62' },
      x: 5, lane: 2, walk: { from: 3, to: 10 },
      name: '觀光客',
      lines: ['這裡好熱鬧喔！', '聽說阿美橫町以前是賣糖果的街，所以才叫「アメ横」。'],
    },
    {
      id: 'fruit-vendor',
      sprite: 'npc',
      colors: { hair: '#3a2a20', coat: '#3a6ab0', apron: '#e8e0c8', band: '#d84a3a' },
      x: 6, inStall: true,
      name: '水果攤老闆',
      lines: [
        '來喔來喔！鳳梨一支 200 日圓！',
        '冰冰甜甜的，邊走邊吃剛剛好。',
        '兩個人的話，買兩支比較划算喔！',
      ],
    },
    {
      id: 'snack-clerk',
      sprite: 'npc',
      colors: { hair: '#6a3a2a', coat: '#e58fa6', apron: '#ffffff' },
      x: 15, inStall: true, always: true,
      name: '零食攤店員',
      // 第一次對話 → 接著出回憶題
      lines: [
        '歡迎光臨～這款牛奶糖是今天最後一盒了喔！',
        '……咦，紅色貝蕾帽？有位客人託我，把一樣東西交給戴紅色貝蕾帽的小姐。',
        '他只留了一句話：「她上次都捨不得吃。」',
        '妳知道是什麼意思嗎？',
      ],
      phaseLines: {
        early: [
          '（鐵捲門拉起了一半，店員正在擺貨）',
          '啊，還沒開店喔～……咦，紅色貝蕾帽？',
          '有位客人一大早就來，託我把一樣東西交給戴紅色貝蕾帽的小姐。',
          '他只留了一句話：「她上次都捨不得吃。」',
          '妳知道是什麼意思嗎？',
        ],
        closing: [
          '我們快要收攤囉～啊，紅色貝蕾帽！等一下！',
          '有位客人託我把一樣東西交給妳，還好趕上了。',
          '他只留了一句話：「她上次都捨不得吃。」',
          '妳知道是什麼意思嗎？',
        ],
        closed: [
          '（整條街都收攤了，只剩這一攤還亮著燈）',
          '紅色貝蕾帽……終於等到了！有位客人拜託我，一定要等妳來。',
          '他只留了一句話：「她上次都捨不得吃。」',
          '妳知道是什麼意思嗎？',
        ],
      },
      quiz: {
        question: '剛在一起時他送妳牛奶糖，妳為什麼都沒吃？',
        options: ['捨不得吃', '不喜歡牛奶口味', '放到忘記了', '在減肥'],
        answer: 0, // 正確答案是第幾個（從 0 開始）
        // 答錯時依序給的提示，答錯越多次給得越明顯
        hints: [
          '嗯……好像不是這個喔。',
          '那位客人說，妳當時的回答，他記到現在。',
        ],
        successLines: [
          '原來是這樣啊！難怪他說的時候一直在笑。',
          '那這個給妳——是他託我轉交的。',
          '……咦？碰到它的瞬間，好像想起了什麼……',
        ],

        // 答對後播的回憶畫面（他的視角）
        //   bg 背景：konbini 便利商店 / street 傍晚的街道 / room 房間
        //   cast 人物：who 是 boy 或 girl；x 是站的位置（0～72）；from 是從哪裡走進來；facing 面向
        //   props 牛奶糖：at 放在畫面某處 / on 拿在誰手上；from、until 是第幾句話開始、結束（從 0 數）
        //   lines：開頭寫「他：」「她：」會顯示名字，其他當旁白
        flashback: {
          title: '牛奶糖',
          shots: [
            {
              bg: 'konbini',
              caption: '那天，下班路上的便利商店',
              cast: [{ who: 'boy', from: 74, x: 24, facing: 'left' }],
              props: [{ at: [14, 42], until: 2 }, { on: 'boy', from: 2 }],
              lines: [
                '（叮咚——）',
                '他：這個好吃，不知道她會不會喜歡……',
                '他：……就這個吧。',
              ],
            },
            {
              bg: 'street',
              caption: '把它交給妳的那天',
              cast: [{ who: 'boy', from: -24, x: 22, facing: 'right' }, { who: 'girl', x: 52, facing: 'left' }],
              props: [{ on: 'boy', until: 2 }, { on: 'girl', from: 2 }],
              lines: [
                '他：那個……這個給妳。',
                '她：牛奶糖？',
                '她：……謝謝。',
              ],
            },
            {
              bg: 'room',
              caption: '過了好一陣子',
              cast: [{ who: 'boy', x: 34, facing: 'right' }, { who: 'girl', x: 60, facing: 'left' }],
              lines: [
                '他：欸，之前送妳的那盒牛奶糖，怎麼都沒吃？',
                '她：……因為是你送的啊。',
                '她：捨不得吃。',
                '（那一刻我就決定了——',
                '以後她想吃的，我都買給她。）',
              ],
            },
          ],
        },
        reward: {
          id: 'milk-candy',
          name: '牛奶糖',
          note: '這次不用捨不得了，吃一顆吧。\n以後想吃，我都買給妳。',
        },
      },
      // 答對之後再跟她說話
      afterLines: ['謝謝光臨～', '對了，魚攤的大叔好像也受人之託，在等妳喔。'],
    },
    {
      id: 'passerby',
      sprite: 'npc',
      colors: { hair: '#5a4030', coat: '#4a5a7a' },
      x: 18, lane: 3, walk: { from: 14, to: 22 },
      name: '路人',
      lines: ['週末的阿美橫町，人真的好多……', '可樂餅的店要排好久喔。'],
    },
    {
      id: 'fish-uncle',
      sprite: 'npc',
      colors: { hair: '#2a2a2a', coat: '#5a5a6a', apron: '#2e4a7a', band: '#f3efe8' },
      x: 24, inStall: true, always: true,
      name: '魚攤大叔',
      lines: [
        '一千日圓！一千日圓！螃蟹、鮭魚卵，便宜賣啦！',
      ],
      phaseLines: {
        early: [
          '（大叔正在搬一箱一箱的冰塊）',
          '還沒開始賣啦！',
        ],
        closing: [
          '最後一箱！全部算妳便宜啦！',
        ],
        closed: [
          '（大叔正在沖洗攤子）',
          '收攤囉！',
        ],
      },
    },
    {
      id: 'staff',
      sprite: 'npc',
      colors: { hair: '#2a2a3a', coat: '#2e4a7a', cap: '#2e4a7a' },
      x: 26, lane: 1,
      name: '站務員',
      lines: ['往山手線的話，從這裡進站喔。', '假日人很多，小心不要走散了。'],
    },

    // ---- 可以聊幾句的路人（只是增加熱鬧感，不影響劇情） ----
    {
      id: 'couple-girl',
      sprite: 'npc',
      colors: { hair: '#6a3a2a', coat: '#d98aa0' },
      x: 10, lane: 3, walk: { from: 8, to: 14 },
      name: '路過的女生',
      lines: ['那家的可樂餅剛炸好，好香喔！', '一邊走一邊吃，最有阿美橫町的感覺了。'],
    },
    {
      id: 'salaryman',
      sprite: 'npc',
      colors: { hair: '#1f1b26', coat: '#3a3e4a' },
      x: 21, lane: 4, walk: { from: 17, to: 25 },
      name: '上班族',
      lines: ['下班來買點魚回家……', '傍晚的時候，魚攤常常會再便宜一點喔。'],
    },
    {
      id: 'grandma',
      sprite: 'npc',
      colors: { hair: '#c8c8d0', coat: '#7a5a3a' },
      x: 4, lane: 4,
      name: '老奶奶',
      lines: ['我年輕的時候就常來這裡買東西了。', '買完東西，我等一下要去小網神社拜拜。', '那間神社被大樓包圍著，小小的，可是很靈驗喔。'],
      setFlag: 'heardDirection', // 聽到小網神社，才能從上野站出發
    },

    // ---- 其他攤位的老闆（不能對話，只是站在攤位裡） ----
    { id: 'vendor-a', sprite: 'npc', colors: { hair: '#2a2a2a', coat: '#7a4a4a', apron: '#e8e0c8' }, x: 1, inStall: true },
    { id: 'vendor-b', sprite: 'npc', colors: { hair: '#5a3a2a', coat: '#2f6a46', apron: '#f3efe8', band: '#2e6ab0' }, x: 9, inStall: true },
    { id: 'vendor-c', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#5a5a6a', apron: '#2e4a7a' }, x: 12, inStall: true },
    { id: 'vendor-d', sprite: 'npc', colors: { hair: '#8a6a4a', coat: '#c94a4a', apron: '#ffffff' }, x: 19, inStall: true },
    { id: 'vendor-e', sprite: 'npc', colors: { hair: '#3a2a20', coat: '#e0a020', apron: '#e8e0c8', band: '#d84a3a' }, x: 21, inStall: true },

    // ---- 在攤位前買東西的客人（站在最裡面那排、背對鏡頭；bag 是手上提的購物袋顏色） ----
    { id: 'shopper-1', sprite: 'npc', colors: { hair: '#3a2a20', coat: '#6a7a9a', bag: '#f3efe8' }, x: 4.6, shop: true },
    { id: 'shopper-2', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#9a5a3a' }, x: 8.4, shop: true },
    { id: 'shopper-3', sprite: 'npc', colors: { hair: '#c8c8d0', coat: '#5a4a6a', bag: '#e8d4a8' }, x: 10.6, shop: true },
    { id: 'shopper-4', sprite: 'npc', colors: { hair: '#6a3a2a', coat: '#3a6a5a' }, x: 13.3, shop: true },
    { id: 'shopper-5', sprite: 'npc', colors: { hair: '#2a2a3a', coat: '#c8b89a', bag: '#f3efe8' }, x: 17.2, shop: true },
    { id: 'shopper-6', sprite: 'npc', colors: { hair: '#8a6a4a', coat: '#7a3a4a' }, x: 20.4, shop: true },
    { id: 'shopper-7', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#4a5a7a', cap: '#2f8a5a', bag: '#d84a3a' }, x: 22.7, shop: true },

    // ---- 背景人潮（不能對話，只是走來走去） ----
    { id: 'crowd-1', sprite: 'npc', colors: { hair: '#2a2a3a', coat: '#7a4a4a' }, x: 9, lane: 1, walk: { from: 4, to: 16 } },
    { id: 'crowd-2', sprite: 'npc', colors: { hair: '#8a6a4a', coat: '#c9a46a' }, x: 12, lane: 4, walk: { from: 6, to: 20 } },
    { id: 'crowd-3', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#3a5a4a' }, x: 20, lane: 2, walk: { from: 16, to: 26 } },
    { id: 'crowd-4', sprite: 'npc', colors: { hair: '#4a3030', coat: '#6a5a8a' }, x: 3, lane: 3, walk: { from: 1, to: 12 } },
    { id: 'crowd-5', sprite: 'npc', colors: { hair: '#c9a46a', coat: '#2e4a7a' }, x: 6, lane: 0, walk: { from: 4, to: 13 } },
    { id: 'crowd-6', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#9a3a5a' }, x: 14, lane: 2, walk: { from: 10, to: 22 } },
    { id: 'crowd-7', sprite: 'npc', colors: { hair: '#3a2a20', coat: '#5a7a9a' }, x: 16, lane: 4, walk: { from: 12, to: 24 } },
    { id: 'crowd-8', sprite: 'npc', colors: { hair: '#2a2a3a', coat: '#4a4a4a', cap: '#c23b4a' }, x: 18, lane: 1, walk: { from: 13, to: 25 } },
    { id: 'crowd-9', sprite: 'npc', colors: { hair: '#6a4a3a', coat: '#c8b89a' }, x: 23, lane: 3, walk: { from: 19, to: 26 } },
    { id: 'crowd-10', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#3a6a5a' }, x: 7, lane: 2, walk: { from: 4, to: 10 } },
    { id: 'crowd-11', sprite: 'npc', colors: { hair: '#8a5a4a', coat: '#7a7a8a' }, x: 25, lane: 2, walk: { from: 21, to: 26 } },
  ],

  // 走到上野站門口時：有沒有打聽到方向，給不同反應
  exit: {
    x: 28.3, // 上野站門口
    requireFlag: 'heardDirection',
    lockedLines: ['車站前好多人……', '下一站要去哪裡呢？先問問市場裡的人吧。'],
    doneLines: ['奶奶說的小網神社……', '搭電車去看看吧！'],
  },
}
