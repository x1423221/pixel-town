// 第 4 區（最終章）：海洋・夜晚的港口
// 找到第四片回憶碎片 → 走到碼頭最前端，碎片拼成一句話 → 等煙火（時間鎖）→ 煙火 → 他出現 → 大吉才會求婚
// 標「待填」的地方等你把回憶給我之後再換掉；finale 裡的台詞都可以直接改成你想說的話

export default {
  id: 'sea',
  title: '海洋',
  theme: 'harbor',
  width: 26,

  // 背景每一格：, 海面＋欄杆   S 路燈
  stalls: ',,,S,,,,,S,,,,,S,,,,,S,,,,',

  tree: { x: 8 },          // 聖誕樹的位置
  viewpoint: { x: 24.3 },  // 碼頭最前端的燈＋看板

  start: { x: 0.5, lane: 2, facing: 'right' },

  intro: [
    '海風好舒服……',
    '找到第四片，就能知道寫信的人想說什麼了。',
  ],

  // 兩張似顏繪合在一起（點右上角的兩張畫）→ 播「還沒發生的回憶」→ 拿到碎片 4
  merges: [
    {
      items: ['portrait-girl', 'portrait-boy'],
      lines: ['（兩張畫放在一起的瞬間……）'],
      // 未來的回憶（future: true 會變成淡紫色調、標籤寫「未來」）
      //   cast 裡加 old: true 會變成白頭髮；shot 加 fireworks: true 會放煙火
      flashback: {
        title: '還沒發生的回憶',
        future: true,
        shots: [
          {
            bg: 'newhome',
            caption: '以後的某一天',
            cast: [{ who: 'boy', from: -24, x: 26, facing: 'right' }, { who: 'girl', x: 52, facing: 'left' }],
            lines: [
              '她：箱子也太多了吧！',
              '他：……這箱怎麼寫著「牛奶糖」？',
              '她：那是很重要的東西，不准拆！',
              '（我們的第一個家。）',
            ],
          },
          {
            bg: 'living',
            caption: '很普通的某個晚上',
            cast: [{ who: 'boy', x: 40, facing: 'left' }, { who: 'girl', x: 60, facing: 'left' }],
            lines: [
              '（沒有什麼特別的事。）',
              '她：欸，明天要吃什麼？',
              '他：都好，跟妳一起吃就好。',
              '（可是我最想要的，就是這樣的每一天。）',
            ],
          },
          {
            bg: 'harborOld',
            caption: '很久很久以後',
            fireworks: true,
            cast: [{ who: 'boy', x: 26, facing: 'right', old: true }, { who: 'girl', x: 50, facing: 'left', old: true }],
            lines: [
              '她：煙火還是跟那天一樣漂亮呢。',
              '他：妳也是。',
              '（我想收藏的，還有這些還沒發生的回憶。）',
            ],
          },
        ],
      },
      reward: {
        id: 'portrait',
        name: '兩個人的似顏繪',
        note: '這是我們的第一張「全家福」。\n\n（他留的話：待填）',
        fragment: { n: 4, of: 4, text: '我都想陪妳，一直收藏下去。' },
      },
    },
  ],

  objects: [
    {
      id: 'cart', sprite: 'cart', x: 4.6, lane: 0,
      name: '熱可可推車',
      lines: ['熱可可的香味……', '冬天的港邊，最適合來一杯了。'],
    },
    {
      id: 'vendor', sprite: 'npc', colors: { hair: '#3a2a20', coat: '#c23b4a', apron: '#f3efe8', cap: '#c23b4a' }, x: 6.1, lane: 0,
      name: '推車的店員',
      lines: ['天氣冷，要不要來一杯熱可可暖暖手？', '看煙火的時候人很多，要買記得早點來喔！'],
    },
    {
      id: 'artist',
      sprite: 'npc',
      colors: { hair: '#6a3a2a', coat: '#5a7a9a', band: '#f2c230' },
      x: 11, lane: 0,
      name: '畫似顏繪的畫家',
      lines: [
        '要不要畫一張似顏繪呀？',
        '畫之前，先回答我一個小問題吧！',
      ],
      quiz: {
        question: '（回憶題待填）例：我們第一張合照是在哪裡拍的？',
        options: ['正確答案（待填）', '錯誤選項（待填）', '錯誤選項（待填）'],
        answer: 0,
        hints: [
          '嗯……好像不是這裡喔。',
        ],
        successLines: [
          '答對了！那我開始畫囉～',
          '（沙沙沙……）',
          '畫好了！這張給妳。',
        ],
        reward: {
          id: 'portrait-girl',
          name: '妳的似顏繪',
          note: '畫得好像！',
        },
      },
      // 畫完她之後：問要不要幫旁邊的他也畫一張（說不要的話，之後再找畫家還會再問）
      offer: {
        lines: ['……旁邊這位先生，要不要也畫一張？'],
        question: '要幫他也畫一張嗎？',
        options: ['要', '不要'],
        yesLines: ['好～請坐好喔！', '（沙沙沙……）', '畫好了！'],
        noLines: ['好喔，想畫的時候再跟我說～'],
        reward: {
          id: 'portrait-boy',
          name: '他的似顏繪',
          note: '……表情好緊張。',
        },
        afterLines: ['兩張畫放在一起看看吧？', '（點右上角的兩張畫）'],
      },
      afterLines: ['今晚有煙火喔，碼頭那邊視野最好。'],
    },
    {
      id: 'grandpa', sprite: 'npc', colors: { hair: '#c8c8d0', coat: '#5a4a3a' }, x: 14, lane: 3,
      name: '老爺爺',
      lines: ['我和太太年輕的時候，也在這樣的港口一起看過煙火。'],
    },
    {
      id: 'grandma', sprite: 'npc', colors: { hair: '#d8d8e0', coat: '#9a6a7a' }, x: 15.1, lane: 3,
      name: '老奶奶', lines: ['呵呵，他那天緊張到手一直發抖呢。'],
    },
    {
      id: 'staff', sprite: 'npc', colors: { hair: '#2a2a3a', coat: '#2e6ad0', cap: '#f3efe8' }, x: 18, lane: 1,
      name: '工作人員',
      lines: ['晚上 8 點半會放煙火喔。', '最好的觀賞位置，在碼頭的最前端。'],
      setFlag: 'seaClue',
    },
    {
      id: 'couple', sprite: 'npc', colors: { hair: '#6a3a2a', coat: '#d98aa0' }, x: 9, lane: 2, walk: { from: 2, to: 20 },
      name: '路過的女生', lines: ['今晚的煙火聽說特別漂亮！'],
    },
    { id: 'bench', sprite: 'bench', x: 20.2, lane: 0 },

    // 背景人潮
    { id: 'crowd-1', sprite: 'npc', colors: { hair: '#2a2a3a', coat: '#7a4a4a' }, x: 3, lane: 4, walk: { from: 1, to: 14 } },
    { id: 'crowd-2', sprite: 'npc', colors: { hair: '#8a6a4a', coat: '#c9a46a' }, x: 12, lane: 1, walk: { from: 7, to: 19 } },
    { id: 'crowd-3', sprite: 'npc', colors: { hair: '#1f1b26', coat: '#3a5a4a' }, x: 16, lane: 4, walk: { from: 10, to: 21 } },
    { id: 'crowd-4', sprite: 'npc', colors: { hair: '#4a3030', coat: '#6a5a8a', bag: '#f3efe8' }, x: 7.4, shop: true },
  ],

  exit: {
    x: 24.6, // 碼頭最前端
    requireFlag: 'seaClue',
    lockedLines: ['碼頭的最前端……這裡視野好好。', '先問問看工作人員，晚上有什麼活動吧。'],
  },

  // ---------- 最終章 ----------
  finale: {
    at: '2026-12-05T20:30:00+09:00', // 煙火時間（日本時間），當天看 App 確認後改這裡

    arriveLines: [
      '這裡就是看煙火最好的位置了。',
      '四片回憶碎片，都找齊了。',
      '拼在一起，是一句話——',
      '「那盒妳捨不得吃的牛奶糖、每一次一起許下的願望、一起看過的每一片風景——」',
      '「我都想陪妳，一直收藏下去。」',
    ],
    // 到了碼頭，一路陪著的他先離開一下（吉的話他會一直陪在旁邊，不會離開）
    leaveLines: ['欸，煙火還沒開始，我去買兩杯熱可可，馬上回來！', '妳在這裡等我喔，不要亂跑～'],

    waitTitle: '煙火開始前，就在這裡等吧',
    waitNote: '時間到會自動開始。\n可以先關掉畫面，快到的時候再打開。',

    startLines: ['……煙火！', '好漂亮……', '（身後傳來熟悉的腳步聲）'],

    boyName: '他',
    boyLines: [
      '其實……那些回憶碎片，都是我藏的。',
      '妳把四片碎片都找回來了。',
      '這幾天走過的每一個地方，都是我想帶妳去的地方。',
      '那些回憶，我想跟妳一起收藏一輩子。',
      '而接下來的每一段回憶，我都想跟妳一起寫。',
    ],

    question: '妳願意嫁給我嗎？',
    yes: '願意 ♥',
    no: '不願意',
    noTaunts: ['再想一下嘛～', '按不到喔！', '真的要選這個嗎？', '好啦好啦……'], // 按「不願意」時，按鈕逃跑換的字
    noFinal: '……願意 ♥',                                                      // 逃完之後變成這個

    afterYes: '轉頭看看 ♥',
    afterYesSub: '（他就在妳身後）',

    // 預設（大吉）的演出方式
    fireworks: 'on',     // on 準時放 / delayed 延後（答應的瞬間才開始）/ cancelled 取消
    entrance: 'walk',    // walk 從後面走過來 / run 跑過來 / waiting 她到碼頭時他已經在等
    prop: null,          // 他手上拿的東西：cocoa 兩杯熱可可 / sparkler 仙女棒

    // 不是大吉的路線：最後一幕演完、他沒說出口，結局畫面最後出現這句提示
    routeHint: '……也許，不同的籤，會有不同的結果？',

    // ---------- 依神社抽到的籤，最後一幕不一樣（只寫跟上面不同的地方） ----------
    // 只有大吉會走到求婚；其他籤演完自己的最後一幕就是結局
    variants: {
      大吉: {
        ending: { title: '完美的煙火', lines: ['謝謝妳，願意陪我走完這一趟。', '接下來的路，我們一起走。'] },
      },
      中吉: {
        entrance: 'run',
        startLines: ['……煙火！', '好漂亮……', '（遠處傳來急促的腳步聲）'],
        boyLines: [
          '呼……呼……',
          '熱可可的隊伍排好長，差、差一點就趕不上了……',
          '其實那些碎片，都是我藏的。藏的時候我自己都迷路了好幾次。',
          '其實……我還有一句很重要的話想說……',
          '……呼……等、等我喘完氣再說……',
        ],
        ending: { title: '趕上了', lines: ['他氣喘吁吁跑過來的樣子，', '大概會記一輩子吧。', '……不過，他好像有什麼話還沒說出口。'] },
      },
      小吉: {
        prop: 'cocoa',
        startLines: ['……煙火！', '好漂亮……', '（一股熱可可的香味飄了過來）'],
        boyLines: [
          '小心燙喔。',
          '我早上就預約了兩杯，想說一定要跟妳一起喝。',
          '天氣好冷，可是跟妳在一起就好暖。',
          '其實我……',
          '……沒事，先把熱可可喝完吧。',
        ],
        ending: { title: '兩杯熱可可', lines: ['熱可可的溫度，和那天的煙火，', '一起留在了冬天的東京。', '……他欲言又止的那句話，到底是什麼呢？'] },
      },
      吉: {
        entrance: 'waiting',
        arriveLines: [
          '這裡就是看煙火最好的位置了。',
          '四片回憶碎片，都找齊了。',
          '拼在一起，是一句話——',
          '「那盒妳捨不得吃的牛奶糖、每一次一起許下的願望、一起看過的每一片風景——」',
          '「我都想陪妳，一直收藏下去。」',
          '他：「煙火快開始了，我們就在這裡一起等吧。」',
        ],
        waitTitle: '跟他一起等煙火吧',
        startLines: ['……煙火開始了！', '好漂亮……'],
        boyLines: [
          '看妳一片一片把碎片找回來，',
          '我好幾次都差點忍不住跟妳說。',
          '我本來想在這裡，跟妳說一件事……',
          '……可是看到妳，突然好緊張。下次吧。',
        ],
        ending: { title: '一直在身邊', lines: ['這一路上，他一直都在我身邊。', '我們一起看完了整場煙火。', '……他的口袋裡，好像藏著什麼東西。'] },
      },
      末吉: {
        fireworks: 'delayed',
        startLines: ['……咦？', '廣播：「各位遊客，今晚的煙火將延後開始。」', '怎麼這樣……', '（身後傳來熟悉的腳步聲）'],
        boyLines: [
          '煙火延後了啊……',
          '那剛好，我有一句話，想在煙火開始之前說——',
          '（砰！煙火突然開始了）',
          '……啊。',
        ],
        ending: { title: '延後的煙火', lines: ['他想說的話，被突然開始的煙火蓋過去了。', '煙火很美，', '可是，他到底想說什麼呢？'] },
      },
      凶: {
        fireworks: 'cancelled',
        prop: 'sparkler',
        startLines: ['……廣播：「今晚因為強風，煙火表演取消。」', '……', '都走到這裡了……', '（身後亮起一點小小的火光）'],
        boyLines: [
          '沒有煙火也沒關係。',
          '我們有自己的煙火。',
          '今天抽到的是凶，可是有妳在身邊，就是我最大的好運。',
          '其實我還準備了……',
          '……啊，仙女棒熄掉了。',
        ],
        ending: { title: '我們的煙火', lines: ['那天的煙火取消了。', '可是那根小小的仙女棒，比什麼都亮。', '……他想拿出來的，是什麼呢？'] },
      },
    },
  },
}
