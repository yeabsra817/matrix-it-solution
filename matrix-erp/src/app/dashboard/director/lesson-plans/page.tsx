import { LessonPlanPanel } from "@/components/LessonPlanPanel";

export default function DirectorLessonPlansPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Lesson Plan Approval</h2>
      <p className="text-slate-400">Review submitted teacher lesson plans. Approve or reject.</p>
      <LessonPlanPanel mode="director" />
    </div>
  );
}
