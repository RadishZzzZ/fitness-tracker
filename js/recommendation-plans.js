(function () {
  const app = window.FitnessApp;

  const warmups = {
    base: [
      "原地踏步或轻松走动 2 分钟，让身体微微发热",
      "肩绕环 10 次 + 髋部绕环 10 次",
      "徒手深蹲 10 次，动作慢一点",
      "猫牛式或胸椎旋转 8 次，打开背部"
    ],
    upper: [
      "原地踏步 2 分钟",
      "肩绕环 12 次 + 手臂前后摆动 12 次",
      "弹力带拉开 2 组 x 12 次",
      "墙壁俯卧撑 10 次，激活胸和肩"
    ],
    lower: [
      "原地踏步或开合步 2 分钟",
      "髋部绕环 10 次 + 膝关节绕环 10 次",
      "臀桥 12 次，激活臀部",
      "徒手深蹲 10 次，确认膝盖和髋部状态"
    ],
    recovery: [
      "轻松走动 3 分钟",
      "肩颈轻柔绕环 8 次",
      "髋部绕环 8 次",
      "脚踝绕环每侧 10 次"
    ]
  };

  const cooldowns = {
    base: [
      "慢走 2 分钟，让心率降下来",
      "大腿前侧拉伸每侧 30 秒",
      "大腿后侧拉伸每侧 30 秒",
      "胸肩拉伸 30 秒 + 深呼吸 1 分钟"
    ],
    upper: [
      "慢走或站立深呼吸 2 分钟",
      "胸大肌门框拉伸每侧 30 秒",
      "背阔肌拉伸每侧 30 秒",
      "肩后侧拉伸每侧 30 秒",
      "颈部放松每侧 20 秒"
    ],
    lower: [
      "慢走 2 分钟",
      "大腿前侧拉伸每侧 30 秒",
      "臀部拉伸每侧 30 秒",
      "小腿拉伸每侧 30 秒",
      "大腿后侧拉伸每侧 30 秒"
    ],
    recovery: [
      "鼻吸口呼 1 分钟",
      "小腿拉伸每侧 30 秒",
      "髋屈肌拉伸每侧 30 秒",
      "胸椎打开 6 次",
      "肩颈放松 30 秒"
    ]
  };

  const plans = {
    starter: {
      title: "先建立一条基础记录",
      duration: "5 分钟",
      focus: "记录优先",
      warmup: ["不用正式热身，先完成今天的基础记录。"],
      exercises: ["填写今天体重、步数、训练和晚饭", "如果身体状态正常，饭后散步 10-20 分钟"],
      cooldown: ["散步结束后做小腿和大腿后侧拉伸各 30 秒。"],
      intensity: "今天先不追求训练量，重点是建立记录习惯。",
      recovery: "有了最近几天的数据后，推荐会更贴近你的节奏。"
    },
    recoveryWalk: {
      title: "轻恢复 + 散步",
      duration: "20-30 分钟",
      focus: "恢复、活动量",
      warmup: warmups.recovery,
      exercises: ["饭后慢走 20 分钟", "髋部绕环 2 组 x 10 次", "肩颈放松 2 组 x 30 秒", "小腿和大腿后侧拉伸各 45 秒"],
      cooldown: cooldowns.recovery,
      intensity: "全程保持轻松，主观强度 3-4/10，走路时能顺畅说完整句子。",
      recovery: "今天保持轻松，睡前不要追加高强度训练。"
    },
    lowIntensityWalk: {
      title: "低强度燃脂散步",
      duration: "25-35 分钟",
      focus: "步数、消化、恢复",
      warmup: warmups.recovery,
      exercises: ["饭后慢走 25 分钟", "靠墙深蹲 2 组 x 30 秒", "站姿提踵 2 组 x 15 次", "腹式呼吸 2 分钟"],
      cooldown: cooldowns.recovery,
      intensity: "强度控制在 4/10，不喘、不冲刺，重点是消化和增加活动量。",
      recovery: "今天晚饭建议鸡肉/鱼/豆腐 + 蔬菜 + 少量主食。"
    },
    restartFullBody: {
      title: "弹力带轻量全身训练",
      duration: "20-25 分钟",
      focus: "重新启动训练",
      warmup: warmups.base,
      exercises: ["徒手深蹲 3 组 x 10 次", "弹力带划船 3 组 x 12 次", "跪姿俯卧撑 2 组 x 8-10 次", "臀桥 3 组 x 12 次", "平板支撑 2 组 x 20-30 秒"],
      cooldown: cooldowns.base,
      intensity: "主观强度 5-6/10，每组结束保留 2-3 次余力，不做到力竭。",
      recovery: "明天根据酸痛程度选择散步或上/下半身训练。"
    },
    coreWalk: {
      title: "散步 + 核心激活",
      duration: "20-30 分钟",
      focus: "补步数、低压力",
      warmup: warmups.recovery,
      exercises: ["饭后慢走 20 分钟", "死虫 2 组 x 10 次", "鸟狗 2 组 x 10 次", "平板支撑 2 组 x 20 秒"],
      cooldown: cooldowns.recovery,
      intensity: "主观强度 4-5/10，核心动作慢做，腰不要塌。",
      recovery: "今天先把活动量补上，不必追求训练强度。"
    },
    lowerBody: {
      title: "下半身力量训练",
      duration: "25-35 分钟",
      focus: "腿部、臀部",
      warmup: warmups.lower,
      exercises: ["徒手深蹲 3 组 x 12 次", "反向弓步 3 组 x 每侧 8 次", "臀桥 3 组 x 15 次", "罗马尼亚硬拉动作练习 2 组 x 10 次", "小腿提踵 2 组 x 15 次"],
      cooldown: cooldowns.lower,
      intensity: "主观强度 6-7/10，动作稳定后再加深幅度；膝盖不舒服就减少弓步。",
      recovery: "动作保留 2-3 次余力，不做到力竭。"
    },
    upperBody: {
      title: "上半身力量训练",
      duration: "25-35 分钟",
      focus: "推、拉、肩背",
      warmup: warmups.upper,
      exercises: ["俯卧撑 3 组 x 6-12 次", "弹力带划船 3 组 x 12 次", "弹力带肩推 2 组 x 10 次", "弹力带面拉 2 组 x 12 次", "侧平板支撑 2 组 x 每侧 20 秒"],
      cooldown: cooldowns.upper,
      intensity: "主观强度 6-7/10，肩部动作不要耸肩，推拉动作都保留 2 次余力。",
      recovery: "肩颈不舒服时减少肩推动作，优先划船和拉伸。"
    },
    lowerSupplement: {
      title: "下半身补强",
      duration: "25-30 分钟",
      focus: "腿部、臀部",
      warmup: warmups.lower,
      exercises: ["深蹲 3 组 x 10 次", "台阶踏上 2 组 x 每侧 10 次", "臀桥 3 组 x 12 次", "靠墙静蹲 2 组 x 30 秒"],
      cooldown: cooldowns.lower,
      intensity: "主观强度 6/10，以稳定和控制为主，不追求速度。",
      recovery: "如果膝盖不舒服，把深蹲幅度减小，动作放慢。"
    },
    upperSupplement: {
      title: "上半身补强",
      duration: "25-30 分钟",
      focus: "胸、背、肩",
      warmup: warmups.upper,
      exercises: ["俯卧撑 3 组 x 6-10 次", "弹力带划船 3 组 x 12 次", "弹力带外旋 2 组 x 12 次", "平板支撑 2 组 x 30 秒"],
      cooldown: cooldowns.upper,
      intensity: "主观强度 6/10，动作过程保持肩胛稳定，不硬撑数量。",
      recovery: "手腕或肩部不舒服时，把俯卧撑改成墙壁俯卧撑。"
    },
    recoveryDay: {
      title: "轻恢复日",
      duration: "20-30 分钟",
      focus: "恢复、灵活性",
      warmup: warmups.recovery,
      exercises: ["轻松散步 15-20 分钟", "胸椎旋转 2 组 x 每侧 8 次", "髋屈肌拉伸 2 组 x 每侧 30 秒", "腿后侧拉伸 2 组 x 每侧 30 秒"],
      cooldown: cooldowns.recovery,
      intensity: "主观强度 3-4/10，做完应该更轻松，而不是更累。",
      recovery: "最近活动量不错，今天把恢复做好比硬加量更有价值。"
    },
    balancedFullBody: {
      title: "中等强度全身训练",
      duration: "25-35 分钟",
      focus: "全身均衡",
      warmup: warmups.base,
      exercises: ["深蹲 3 组 x 10 次", "俯卧撑 3 组 x 6-10 次", "弹力带划船 3 组 x 12 次", "臀桥 2 组 x 15 次", "平板支撑 2 组 x 30 秒"],
      cooldown: cooldowns.base,
      intensity: "主观强度 6/10，每个动作先保证姿势，再考虑增加次数。",
      recovery: "训练后补水，晚饭以蛋白质 + 蔬菜 + 少量主食为主。"
    }
  };

  function plan(name, reasons, overrides = {}) {
    return {
      ...plans[name],
      ...overrides,
      warmup: [...(overrides.warmup || plans[name].warmup)],
      exercises: [...(overrides.exercises || plans[name].exercises)],
      cooldown: [...(overrides.cooldown || plans[name].cooldown)],
      reasons
    };
  }

  app.recommendationPlans = {
    plan
  };
})();
