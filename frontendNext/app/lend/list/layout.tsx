// app/lend/layout.tsx
// sidebar

import Sidebar from "../../components/layout/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-10 min-h-screen">
      {/* Sidebar 占 4 */}
      <div className="col-span-3 border-r border-gray-300 bg-white p-6">

        <Sidebar />
      </div>

      {/* 主内容占 6 */}
      <main className="col-span-7 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
