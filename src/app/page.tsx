import Link from "next/link";

const demoAccounts = [
  {
    role: "学生端",
    account: "20260018",
    password: "mock123456",
    description: "查看个人成长画像、综合素质评价、班级任务与成长档案。",
    href: "/student/overview",
    badge: "含班级协助权限",
  },
  {
    role: "教师端",
    account: "teacher_zhang",
    password: "mock123456",
    description: "查看班级数据总览、学生测评、档案管理与统计报表。",
    href: "/teacher/dashboard",
    badge: "班主任 / 任课教师",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f2f6fc] px-4 py-10 text-[#1f2d3d] sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-[#dbe7f3] bg-gradient-to-br from-[#0f4aa1] via-[#175dc5] to-[#3f85e8] p-8 text-white shadow-[0_24px_60px_rgba(15,74,161,0.22)] lg:p-12">
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium">
            词源 前端原型
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            学生综合素质测评与成长档案系统
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#dce9ff] sm:text-lg">
            当前为纯前端可运行原型，全部数据使用 mock 展示，不接真实后端、不接真实 AI、不接数据库。
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["2 个入口", "学生端 / 教师端"],
              ["11 个页面", "左侧菜单可切换"],
              ["正式风格", "蓝白灰、表格清晰"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <div className="text-sm text-[#c9ddff]">{label}</div>
                <div className="mt-2 text-xl font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#dbe7f3] bg-white p-6 shadow-[0_20px_50px_rgba(31,45,61,0.08)] sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#1f2d3d]">登录入口</h2>
              <p className="mt-2 text-sm leading-6 text-[#5b6b7d]">
                选择不同角色进入原型。班长不单独设端口，作为学生账号中的班级协助权限展示。
              </p>
            </div>
            <div className="rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-medium text-[#175dc5]">Mock Login</div>
          </div>

          <div className="mt-8 space-y-4">
            {demoAccounts.map((item) => (
              <div key={item.role} className="rounded-2xl border border-[#e2eaf3] bg-[#fbfdff] p-5 transition hover:border-[#b7cde6] hover:shadow-[0_16px_30px_rgba(23,93,197,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-[#1f2d3d]">{item.role}</h3>
                      <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-medium text-[#175dc5]">{item.badge}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#5b6b7d]">{item.description}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-[#f4f8fc] p-4 text-sm text-[#405266] sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-[#7b8a9a]">账号</div>
                    <div className="mt-1 font-medium">{item.account}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7b8a9a]">密码</div>
                    <div className="mt-1 font-medium">{item.password}</div>
                  </div>
                </div>

                <Link
                  href={item.href}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#175dc5] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0f4aa1]"
                >
                  进入{item.role}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
