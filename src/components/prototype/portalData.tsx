import type { ReactNode } from "react";

export type RoleKey = "student" | "teacher";

export type SectionItem = {
  key: string;
  label: string;
  hint: string;
};

export const studentSections: SectionItem[] = [
  { key: "overview", label: "首页总览", hint: "个人成长概览" },
  { key: "evaluation", label: "综合测评", hint: "德智体美劳指标" },
  { key: "growth", label: "成长记录", hint: "活动与获奖记录" },
  { key: "classroom", label: "班级事务", hint: "班级协助与任务" },
  { key: "archive", label: "成长档案", hint: "学期档案汇总" },
];

export const teacherSections: SectionItem[] = [
  { key: "dashboard", label: "工作台", hint: "班级运行概览" },
  { key: "students", label: "学生管理", hint: "学生基础信息" },
  { key: "evaluation", label: "测评中心", hint: "批量评价录入" },
  { key: "archives", label: "档案管理", hint: "成长档案维护" },
  { key: "class", label: "班级分析", hint: "班级维度统计" },
  { key: "reports", label: "统计报表", hint: "输出汇总报表" },
];

export const roleMeta = {
  student: {
    title: "学生端",
    subtitle: "个人成长与综合素质测评",
    homeHref: "/student/overview",
    sections: studentSections,
    userName: "高二(3)班 李明轩",
    userDesc: "班长协助权限已开启",
    userTag: "学生账号",
  },
  teacher: {
    title: "教师端",
    subtitle: "班级管理与综合评价工作台",
    homeHref: "/teacher/dashboard",
    sections: teacherSections,
    userName: "张静老师",
    userDesc: "高二年级 班主任",
    userTag: "教师账号",
  },
} as const;

function SummaryCards({ cards }: { cards: Array<{ label: string; value: string; trend: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-[#e1e9f2] bg-white p-5 shadow-sm">
          <div className="text-sm text-[#6b7a8c]">{card.label}</div>
          <div className="mt-3 text-3xl font-semibold text-[#1f2d3d]">{card.value}</div>
          <div className="mt-2 text-sm text-[#175dc5]">{card.trend}</div>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, extra, children }: { title: string; extra?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e1e9f2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#1f2d3d]">{title}</h3>
        {extra ? <div className="text-sm text-[#7b8a9a]">{extra}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string>>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#edf2f7]">
      <table className="min-w-full divide-y divide-[#edf2f7] text-left text-sm">
        <thead className="bg-[#f7fafd] text-[#5b6b7d]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f7] bg-white text-[#1f2d3d]">
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`} className="hover:bg-[#fafcff]">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressList({ items }: { items: Array<{ label: string; value: number; note: string }> }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[#1f2d3d]">{item.label}</span>
            <span className="text-[#175dc5]">{item.value}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#eef3f8]">
            <div className="h-2 rounded-full bg-[#2f7ae5]" style={{ width: `${item.value}%` }} />
          </div>
          <div className="mt-2 text-xs text-[#7b8a9a]">{item.note}</div>
        </div>
      ))}
    </div>
  );
}

function TagRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-[#eef4fb] px-3 py-1 text-sm text-[#315a88]">
          {item}
        </span>
      ))}
    </div>
  );
}

export function getPageContent(role: RoleKey, section: string): ReactNode {
  if (role === "student") {
    switch (section) {
      case "overview":
        return (
          <div className="space-y-5">
            <SummaryCards
              cards={[
                { label: "综合素质总分", value: "92.5", trend: "较上月 +3.2" },
                { label: "本学期成长记录", value: "28 条", trend: "已同步至档案" },
                { label: "班级贡献值", value: "A", trend: "班长协助活跃" },
                { label: "AI 成长建议", value: "6 项", trend: "本周待完成 2 项" },
              ]}
            />
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel title="近期待办" extra="Mock 数据">
                <SimpleTable
                  columns={["任务", "截止时间", "状态", "备注"]}
                  rows={[
                    ["上传志愿服务照片", "05-22", "进行中", "用于德育档案补充"],
                    ["班会主持总结", "05-24", "待提交", "班长协助任务"],
                    ["体育锻炼打卡", "05-25", "已完成", "连续 7 天"],
                  ]}
                />
              </Panel>
              <Panel title="五育发展雷达" extra="文字版">
                <ProgressList
                  items={[
                    { label: "德育", value: 95, note: "志愿服务、班级协助表现突出" },
                    { label: "智育", value: 91, note: "学科成绩稳定，项目学习积极" },
                    { label: "体育", value: 88, note: "运动频次持续提升" },
                    { label: "美育", value: 86, note: "参与校艺术节主持" },
                    { label: "劳育", value: 90, note: "劳动实践记录完整" },
                  ]}
                />
              </Panel>
            </div>
          </div>
        );
      case "evaluation":
        return (
          <div className="space-y-5">
            <SummaryCards
              cards={[
                { label: "德育", value: "95", trend: "年级前 12%" },
                { label: "智育", value: "91", trend: "优势学科：英语、历史" },
                { label: "体育", value: "88", trend: "达标优秀" },
                { label: "劳动", value: "90", trend: "校内服务表现好" },
              ]}
            />
            <Panel title="评价明细">
              <SimpleTable
                columns={["维度", "指标", "本次评分", "评语"]}
                rows={[
                  ["德育", "责任担当", "A", "能主动组织班级值日与班会事务"],
                  ["智育", "学习能力", "A", "项目式学习中输出完整、表达清晰"],
                  ["体育", "健康习惯", "A-", "晨跑打卡稳定，建议加强力量训练"],
                  ["美育", "艺术参与", "B+", "积极参与主持，建议增加作品沉淀"],
                ]}
              />
            </Panel>
          </div>
        );
      case "growth":
        return (
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Panel title="成长事件记录" extra="最近 6 条">
              <SimpleTable
                columns={["日期", "类型", "事件", "结果"]}
                rows={[
                  ["05-16", "志愿服务", "社区助老服务 3 小时", "已归档"],
                  ["05-12", "学科活动", "英语演讲比赛校级二等奖", "已入库"],
                  ["05-08", "班级管理", "主持月度班会", "教师已评价"],
                  ["04-28", "劳动实践", "校园植树活动", "已归档"],
                ]}
              />
            </Panel>
            <Panel title="成长标签">
              <TagRow items={["责任感强", "表达清晰", "组织协调", "服务意识", "学习主动性", "团队协作"]} />
              <div className="mt-5 rounded-2xl bg-[#f7fafd] p-4 text-sm leading-7 text-[#4e6073]">
                系统 mock AI 结论：你在组织协调和公共表达上优势明显，建议在学术研究型活动中继续积累可量化成果，提升档案说服力。
              </div>
            </Panel>
          </div>
        );
      case "classroom":
        return (
          <div className="space-y-5">
            <Panel title="班级协助权限" extra="班长身份内嵌于学生账号">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["待处理班务", "4 项"],
                  ["待汇总出勤", "1 次"],
                  ["待提交班会纪要", "2 份"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7fafd] p-5">
                    <div className="text-sm text-[#6b7a8c]">{label}</div>
                    <div className="mt-2 text-2xl font-semibold text-[#1f2d3d]">{value}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="班级任务列表">
              <SimpleTable
                columns={["任务", "负责人", "截止时间", "状态"]}
                rows={[
                  ["周五班会主持安排", "李明轩", "05-23 16:00", "进行中"],
                  ["卫生值日表确认", "李明轩", "05-21 12:00", "待处理"],
                  ["运动会报名汇总", "王子涵", "05-24 18:00", "已完成"],
                ]}
              />
            </Panel>
          </div>
        );
      case "archive":
        return (
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel title="成长档案概览">
              <ProgressList
                items={[
                  { label: "基础信息完整度", value: 100, note: "学籍、班级、联系方式齐全" },
                  { label: "活动材料完整度", value: 82, note: "缺 2 份活动图片附件" },
                  { label: "评价材料完整度", value: 90, note: "班主任评语已更新" },
                  { label: "升学材料准备度", value: 76, note: "社会实践证明待补充" },
                ]}
              />
            </Panel>
            <Panel title="学期档案目录">
              <SimpleTable
                columns={["模块", "材料数量", "状态", "最后更新"]}
                rows={[
                  ["思想品德", "8 份", "完整", "05-18"],
                  ["学业表现", "12 份", "完整", "05-19"],
                  ["实践创新", "6 份", "需补充", "05-16"],
                  ["身心健康", "5 份", "完整", "05-14"],
                ]}
              />
            </Panel>
          </div>
        );
      default:
        return null;
    }
  }

  switch (section) {
    case "dashboard":
      return (
        <div className="space-y-5">
          <SummaryCards
            cards={[
              { label: "班级人数", value: "48", trend: "到课率 97.9%" },
              { label: "待完成测评", value: "12 人", trend: "较昨日 -5" },
              { label: "档案待审核", value: "9 份", trend: "本周新增 3 份" },
              { label: "异常预警", value: "2 条", trend: "需重点跟进" },
            ]}
          />
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel title="近期工作安排">
              <SimpleTable
                columns={["事项", "时间", "对象", "状态"]}
                rows={[
                  ["完成月度综合素质录入", "05-21", "高二(3)班", "进行中"],
                  ["成长档案抽检", "05-22", "年级学生", "待开始"],
                  ["家校沟通回访", "05-23", "重点关注学生", "待安排"],
                ]}
              />
            </Panel>
            <Panel title="班级评价结构">
              <ProgressList
                items={[
                  { label: "优秀", value: 42, note: "综合表现突出" },
                  { label: "良好", value: 38, note: "稳定发展" },
                  { label: "需关注", value: 16, note: "需补材料或持续观察" },
                  { label: "重点跟进", value: 4, note: "建议家校联合支持" },
                ]}
              />
            </Panel>
          </div>
        </div>
      );
    case "students":
      return (
        <Panel title="学生列表" extra="Mock 学生名册">
          <SimpleTable
            columns={["姓名", "学号", "角色", "综合等级", "档案状态"]}
            rows={[
              ["李明轩", "20260018", "班长", "A", "完整"],
              ["王子涵", "20260021", "学习委员", "A-", "完整"],
              ["陈雨桐", "20260007", "普通学生", "B+", "待补材料"],
              ["周浩然", "20260033", "体育委员", "B", "已提交待审"],
            ]}
          />
        </Panel>
      );
    case "evaluation":
      return (
        <div className="space-y-5">
          <Panel title="批量评价进度">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["已完成", "36 人"],
                ["待教师评分", "8 人"],
                ["待班主任复核", "3 人"],
                ["缺材料", "1 人"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f7fafd] p-5">
                  <div className="text-sm text-[#6b7a8c]">{label}</div>
                  <div className="mt-2 text-2xl font-semibold text-[#1f2d3d]">{value}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="测评任务清单">
            <SimpleTable
              columns={["学生", "维度", "当前状态", "最近更新"]}
              rows={[
                ["李明轩", "德育 / 劳育", "待班主任复核", "05-19 10:20"],
                ["陈雨桐", "美育", "缺少活动附件", "05-19 09:15"],
                ["周浩然", "体育", "待教师评分", "05-18 18:30"],
                ["孙嘉宁", "智育", "已完成", "05-18 16:10"],
              ]}
            />
          </Panel>
        </div>
      );
    case "archives":
      return (
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel title="档案审核队列">
            <SimpleTable
              columns={["学生", "档案类型", "状态", "操作建议"]}
              rows={[
                ["陈雨桐", "社会实践", "待补充", "补上传实践证明"],
                ["周浩然", "体育发展", "待审核", "确认竞赛成绩附件"],
                ["王子涵", "学业成果", "已通过", "无需处理"],
              ]}
            />
          </Panel>
          <Panel title="档案质量指标">
            <ProgressList
              items={[
                { label: "完整率", value: 88, note: "目标值 95%" },
                { label: "审核通过率", value: 93, note: "材料规范较稳定" },
                { label: "补件响应率", value: 74, note: "需加强提醒" },
                { label: "优秀案例沉淀", value: 68, note: "可扩充示范样例" },
              ]}
            />
          </Panel>
        </div>
      );
    case "class":
      return (
        <div className="space-y-5">
          <Panel title="班级分析标签">
            <TagRow items={["班级凝聚力高", "学业表现稳定", "志愿服务积极", "体育参与均衡", "美育材料偏少"]} />
          </Panel>
          <Panel title="班级维度对比">
            <SimpleTable
              columns={["维度", "班级均分", "年级均分", "差值", "结论"]}
              rows={[
                ["德育", "91.8", "89.4", "+2.4", "优势明显"],
                ["智育", "87.6", "86.9", "+0.7", "基本持平"],
                ["体育", "85.2", "84.1", "+1.1", "稳中向好"],
                ["美育", "80.5", "83.0", "-2.5", "需加强活动沉淀"],
              ]}
            />
          </Panel>
        </div>
      );
    case "reports":
      return (
        <div className="space-y-5">
          <SummaryCards
            cards={[
              { label: "本月报表", value: "7 份", trend: "已生成 5 份" },
              { label: "导出记录", value: "19 次", trend: "近 7 日" },
              { label: "重点学生名单", value: "4 人", trend: "自动汇总" },
              { label: "AI 文本建议", value: "12 条", trend: "仅 mock 展示" },
            ]}
          />
          <Panel title="报表中心">
            <SimpleTable
              columns={["报表名称", "统计周期", "状态", "最后生成"]}
              rows={[
                ["班级综合素质月报", "2026-05", "可导出", "05-19 08:30"],
                ["成长档案完整率报表", "2026 春季学期", "可导出", "05-18 17:20"],
                ["重点关注学生跟踪表", "近 30 天", "待更新", "05-17 14:10"],
              ]}
            />
          </Panel>
        </div>
      );
    default:
      return null;
  }
}
