"use client";

"use client";

import { ScheduleBuilder } from "@/components/schedule-builder";
import { PixSidebar } from "@/components/pix-sidebar";
import { PersonDetailsSheet } from "@/components/person-details-sheet";

export default function DashboardPage() {
  return (
    <div className="page-enter h-[calc(100vh-130px)] pb-4">
      <div className="flex h-full gap-4">
        {/* Main Content: Schedule Builder */}
        <div className="flex-1 min-w-0 h-full">
          <ScheduleBuilder />
        </div>

        {/* Right Sidebar: Pix & Calculator */}
        <aside className="w-[260px] xl:w-[280px] shrink-0 h-full">
          <PixSidebar />
        </aside>
      </div>

      <PersonDetailsSheet />
    </div>
  );
}

