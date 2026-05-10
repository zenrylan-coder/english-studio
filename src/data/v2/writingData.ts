export const writingTypes = ["万能框架", "高分句型", "话题素材", "原创范文拆解"];
export const writingStages = ["四级", "六级", "考研", "专升本", "雅思"];

export const writingMap = {
  "万能框架": {
    desc: "按学段套用写作结构。",
    items: [
      ["观点引入", "It is widely believed that ...", "用于开头引出观点，四级/专升本都能直接改写。"],
      ["原因展开", "There are two main reasons for this.", "用于正文第一句，帮你自然展开论证。"],
      ["举例说明", "A typical example is that ...", "用于补充例子，避免正文只有空泛观点。"],
      ["对比转折", "However, this does not mean that ...", "用于让论证更自然，不显得单薄。"],
      ["结果影响", "As a result, ...", "用于说明某个现象带来的结果。"],
      ["总结收束", "In conclusion, ... plays an important role in ...", "用于结尾，简洁收束全文。"],
    ],
  },
  "高分句型": {
    desc: "把普通表达换成更自然的句子。",
    items: [
      ["普通", "I think it is important.", "高分替换：I attach great importance to it."],
      ["普通", "More people use AI tools.", "高分替换：An increasing number of people are turning to AI tools."],
      ["普通", "We should study hard.", "高分替换：It is necessary for us to keep learning consistently."],
      ["普通", "This problem is serious.", "高分替换：This issue deserves more attention."],
      ["普通", "It has many benefits.", "高分替换：It brings a wide range of benefits."],
      ["普通", "People should take action.", "高分替换：Effective measures should be taken."],
    ],
  },
  "话题素材": {
    desc: "按高频主题积累可用语料。",
    items: [
      ["教育", "lifelong learning", "终身学习；可用于学习、就业、社会发展类作文。"],
      ["科技", "the rapid development of technology", "科技快速发展；适合AI、互联网、效率类话题。"],
      ["社会", "a sense of responsibility", "责任感；适合青年、职业、社会参与类话题。"],
      ["环境", "environmental awareness", "环保意识；适合环保、城市、社会责任类话题。"],
      ["就业", "career development", "职业发展；适合职业规划、技能提升类作文。"],
      ["生活", "a balanced lifestyle", "平衡生活方式；适合健康、学习压力类话题。"],
    ],
  },
  "原创范文拆解": {
    desc: "看结构，不背整篇。",
    items: [
      ["开头", "引出话题 + 表明态度", "第一段只解决“我要谈什么、我的态度是什么”。"],
      ["正文", "原因1 + 原因2 + 简短例子", "正文不要堆句子，围绕两个理由展开。"],
      ["转折", "承认另一面 + 回到主观点", "让文章更自然，不像背模板。"],
      ["例子", "生活例子 + 简短解释", "例子只服务观点，不要展开太长。"],
      ["结尾", "重申观点 + 给出建议", "结尾保持短，不要强行升华。"],
      ["检查", "主题句 + 连接词 + 结尾句", "写完后检查结构是否完整。"],
    ],
  },
};
