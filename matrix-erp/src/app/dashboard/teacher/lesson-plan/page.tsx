import { LessonPlanPanel } from "@/components/LessonPlanPanel";

export default function TeacherLessonPlanPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Annual Lesson Plan</h2>
      <p className="text-slate-400">
        Create one plan per assigned subject. Editable until submitted. Director approval
        locks the plan; rejection allows edit and resubmit.
      </p>
      <LessonPlanPanel mode="teacher" />
    </div>
  );
}
