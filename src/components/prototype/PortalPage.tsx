import Link from "next/link";
import { getPageContent, roleMeta, type RoleKey } from "./portalData";

export function PortalPage({
  role,
  activeSection,
}: {
  role: RoleKey;
  activeSection: string;
}) {
  const meta = roleMeta[role];

  return (
    <main className="min-h-screen bg-[#f2f6fc] text-[#1f2d3d]">
      <div className="grid min-h-screen lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="border-r border-[#dbe5f0] bg-[#f8fbff] px-5 py-6">
          <Link href="/" className="inline-flex rounded-full bg-[#eaf2fd] px-3 py-1 text-xs font-medium text-[#175dc5]">
            返回登录
          </Link>

          <div className="mt-5 rounded-3xl bg-[#175dc5] p-5 text-white shadow-[0_18px_36px_rgba(23,93,197,0.22)]">
            <div className="text-sm text-[#d9e9ff]">{meta.title}</div>
            <div className="mt-2 text-2xl font-semibold">English Studio</div>
            <div className="mt-2 text-sm leading-6 text-[#dce9ff]">{meta.subtitle}</div>
          </div>

          <div className="mt-5 rounded-3xl border border-[#dfebf7] bg-white p-4">
            <div className="text-xs text-[#7b8a9a]">当前用户</div>
            <div className="mt-2 text-lg font-semibold text-[#1f2d3d]">{meta.userName}</div>
            <div className="mt-1 text-sm text-[#5b6b7d]">{meta.userDesc}</div>
            <div className="mt-3 inline-flex rounded-full bg-[#eef4fb] px-3 py-1 text-xs text-[#315a88]">{meta.userTag}</div>
          </div>

          <nav className="mt-6 space-y-2">
            {meta.sections.map((item) => {
              const href = role === "student" ? `/student/${item.key}` : `/teacher/${item.key}`;
              const active = activeSection === item.key;

              return (
                <Link
                  key={item.key}
                  href={href}
                  className={active
                    ? "block rounded-2xl border border-[#b9d2f1] bg-[#eaf2fd] px-4 py-3 shadow-sm"
                    : "block rounded-2xl border border-transparent px-4 py-3 hover:border-[#d8e5f2] hover:bg-white"
                  }
                >
                  <div className="font-medium text-[#1f2d3d]">{item.label}</div>
                  <div className="mt-1 text-sm text-[#6b7a8c]">{item.hint}</div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 rounded-3xl border border-[#dce7f2] bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm text-[#7b8a9a]">Mock Prototype / {meta.title}</div>
                <h1 className="mt-2 text-3xl font-semibold text-[#1f2d3d]">
                  {meta.sections.find((item) => item.key === activeSection)?.label}
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#5b6b7d]">
                  当前页面使用静态 mock 数据展示交互与信息架构，风格参考 Ant Design Pro 的正式后台布局。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["数据来源", "Mock"],
                  ["AI 状态", "未接入"],
                  ["数据库", "未接入"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7fafd] px-4 py-3 text-center">
                    <div className="text-xs text-[#7b8a9a]">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-[#1f2d3d]">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </header>

          {getPageContent(role, activeSection)}
        </section>
      </div>
    </main>
  );
}
